export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PROJECT_GID = '1209245583930344';

async function asana(path, opts = {}) {
  const res = await fetch(`https://app.asana.com/api/1.0${path}`, {
    ...opts,
    headers: {
      'Authorization': `Bearer ${process.env.ASANA_TOKEN}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

export async function POST() {
  const log = [];
  const step = (label, ok, detail) => log.push({ label, ok, detail });

  if (!process.env.ASANA_TOKEN) {
    return Response.json({
      success: false,
      summary: 'ASANA_TOKEN environment variable not set',
      log: [{ label: 'Environment check', ok: false, detail: 'No token configured in Vercel' }],
    }, { status: 500 });
  }
  step('Environment check', true, 'ASANA_TOKEN is set');

  // Step 1: Read test - fetch first task
  const tasksResp = await asana(`/projects/${PROJECT_GID}/tasks?limit=1&opt_fields=name`);
  if (!tasksResp.ok) {
    step('Read tasks', false, `HTTP ${tasksResp.status}: ${JSON.stringify(tasksResp.data?.errors || tasksResp.data)}`);
    return Response.json({ success: false, summary: 'Read failed - cannot continue', log });
  }
  const tasks = tasksResp.data?.data || [];
  if (tasks.length === 0) {
    step('Read tasks', false, 'Project has no tasks - cannot test write');
    return Response.json({ success: false, summary: 'No tasks to test against', log });
  }
  const testTask = tasks[0];
  step('Read tasks', true, `Found task "${testTask.name}" (gid ${testTask.gid})`);

  // Step 2: Write test - create a comment
  const testText = `[Selected Frame Command Space] Token write-access test — ${new Date().toISOString()}. This comment will be deleted automatically.`;
  const createResp = await asana(`/tasks/${testTask.gid}/stories`, {
    method: 'POST',
    body: JSON.stringify({ data: { text: testText } }),
  });
  if (!createResp.ok) {
    step('Create comment', false, `HTTP ${createResp.status}: ${JSON.stringify(createResp.data?.errors || createResp.data)}`);
    return Response.json({
      success: false,
      summary: createResp.status === 403
        ? 'Token has read access but cannot write. Ask Bestseller IT for write/comment permissions.'
        : 'Write failed for an unexpected reason',
      log,
    });
  }
  const storyGid = createResp.data?.data?.gid;
  step('Create comment', true, `Comment created (gid ${storyGid})`);

  // Step 3: Cleanup - delete the test comment
  if (storyGid) {
    const delResp = await asana(`/stories/${storyGid}`, { method: 'DELETE' });
    if (delResp.ok) {
      step('Delete test comment', true, 'Cleanup successful');
    } else {
      step('Delete test comment', false, `Cleanup failed but write worked. Manually delete comment ${storyGid} if needed. (HTTP ${delResp.status})`);
    }
  }

  return Response.json({
    success: true,
    summary: 'Token has full write access — Asana sync feature can be built',
    testedTaskName: testTask.name,
    log,
  });
}
