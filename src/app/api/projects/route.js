export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ASANA_TOKEN = process.env.ASANA_TOKEN;
const PROJECT_GID = '1209245583930344';

async function asanaFetch(path) {
  const res = await fetch(`https://app.asana.com/api/1.0${path}`, {
    headers: { 'Authorization': `Bearer ${ASANA_TOKEN}`, 'Accept': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Asana API error: ${res.status}`);
  return res.json();
}

function getCustomField(task, fieldName) {
  if (!task.custom_fields) return null;
  const field = task.custom_fields.find(f => f.name === fieldName);
  if (!field) return null;
  if (field.enum_value) return field.enum_value.name;
  if (field.multi_enum_values?.length > 0) return field.multi_enum_values.map(v => v.name);
  if (field.text_value) return field.text_value;
  if (field.number_value !== null && field.number_value !== undefined) return field.number_value;
  return field.display_value || null;
}

function parsePhaseNum(phaseName) {
  if (!phaseName) return null;
  const match = phaseName.match(/Phase\s+(\d+)/);
  return match ? parseInt(match[1]) : null;
}

export async function GET() {
  try {
    if (!ASANA_TOKEN) return Response.json({ error: 'ASANA_TOKEN not configured' }, { status: 500 });

    const data = await asanaFetch(
      `/projects/${PROJECT_GID}/tasks?opt_fields=name,notes,assignee,assignee.name,due_on,start_on,completed,completed_at,created_at,custom_fields,permalink_url,parent&limit=100`
    );

    // Filter out subtasks (only include tasks without a parent)
    const projects = data.data
      .filter(task => !task.parent)
      .map(task => {
        const phase = getCustomField(task, 'PHASE');
        const phaseNum = parsePhaseNum(phase);
        // Parse name: "PARTNER, CITY // TYPE" pattern
        const parts = task.name.split('//').map(s => s.trim());
        const name = parts[0] || task.name;
        const type = parts[1] || (task.completed ? 'SIS' : 'Shop-in-Shop');

        return {
          gid: task.gid, name, type, fullName: task.name,
          sex: getCustomField(task, 'SEX'),
          phase: phase || (task.completed ? 'Completed' : null),
          phaseNum: task.completed ? 11 : (phaseNum ?? 0),
          region: getCustomField(task, 'REGION'),
          salesResp: getCustomField(task, 'SALES RESPONSIBLE'),
          specialElements: getCustomField(task, 'SPECIAL ELEMENTS'),
          projectNumber: getCustomField(task, 'PROJECT NUMBER'),
          dueOn: task.due_on, startOn: task.start_on,
          completed: task.completed,
          completedAt: task.completed_at ? task.completed_at.split('T')[0] : null,
          notes: task.notes || '',
          url: task.permalink_url,
          created: task.created_at ? task.created_at.split('T')[0] : null,
          assignee: task.assignee?.name || null,
        };
      });

    return Response.json({
      projects,
      meta: { total: projects.length, active: projects.filter(p => !p.completed).length, completed: projects.filter(p => p.completed).length, fetchedAt: new Date().toISOString() }
    });
  } catch (error) {
    console.error('Asana fetch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
