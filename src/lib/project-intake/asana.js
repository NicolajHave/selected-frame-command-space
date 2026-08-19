// Asana client for Project Intake.
//
// Reuses ASANA_TOKEN — the same Personal Access Token the read integration
// (/api/projects) already uses. "Projects" in Command Space are actually
// tasks inside one container project; a new intake therefore creates a TASK
// in that project, and its gid becomes the External Folder key + shows up in
// Current on the next poll.

const ASANA_BASE = 'https://app.asana.com/api/1.0';

// The container project Current reads from. Overridable via env; falls back to
// the known production project so the flow works without extra config.
const DEFAULT_INTAKE_PROJECT_GID = '1209245583930344';

function token() {
  return process.env.ASANA_TOKEN;
}

export function asanaConfigured() {
  return Boolean(token());
}

export function intakeProjectGid() {
  return process.env.ASANA_PROJECT_INTAKE_PROJECT_ID || DEFAULT_INTAKE_PROJECT_GID;
}

async function asana(pathname, method = 'GET', data) {
  const res = await fetch(`${ASANA_BASE}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: data ? JSON.stringify({ data }) : undefined,
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.errors?.[0]?.message || `Asana API error ${res.status}`;
    throw new Error(msg);
  }
  return json.data;
}

/**
 * Compose the task name in the "PARTNER, CITY // TYPE" convention that the
 * Current parser (/api/projects) expects. parts[0] becomes the display name,
 * parts[1] the type.
 */
export function buildTaskName(payload) {
  const pb = payload.projectBasics || {};
  const pl = payload.partnerLocation || {};
  const type = payload.derivedFlags?.isSoftShopLikely ? 'Soft Shop' : 'SIS';
  const base =
    pb.projectName ||
    [pl.partnerName, pl.cityState].filter(Boolean).join(', ') ||
    pl.partnerName ||
    'Selected Frame Project';
  return `${base} // ${type}`;
}

// Custom-field gids are per workspace, so rather than carry another env var we
// look the field up by name on the intake project and remember it for the
// lifetime of the lambda. Returns null when the field does not exist, which
// keeps task creation working on a workspace that has not added it yet.
const fieldGidCache = new Map();
async function customFieldGid(fieldName) {
  if (fieldGidCache.has(fieldName)) return fieldGidCache.get(fieldName);
  let gid = null;
  try {
    const settings = await asana(
      `/projects/${intakeProjectGid()}/custom_field_settings?opt_fields=custom_field.gid,custom_field.name&limit=100`,
    );
    const hit = (settings || []).find(
      (s) => (s.custom_field?.name || '').trim().toUpperCase() === fieldName.toUpperCase(),
    );
    gid = hit?.custom_field?.gid || null;
  } catch {
    gid = null; // Best effort — never block the intake on a lookup.
  }
  fieldGidCache.set(fieldName, gid);
  return gid;
}

export async function createIntakeTask({ name, notes, dueOn, sqm }) {
  // Attach SQM so the FY footprint report has structured data from day one.
  let customFields;
  if (typeof sqm === 'number' && Number.isFinite(sqm) && sqm > 0) {
    const gid = await customFieldGid('SQM');
    if (gid) customFields = { [gid]: sqm };
  }
  const data = await asana('/tasks', 'POST', {
    name,
    notes,
    projects: [intakeProjectGid()],
    ...(isIsoDate(dueOn) ? { due_on: dueOn } : {}),
    ...(customFields ? { custom_fields: customFields } : {}),
  });
  return { gid: data.gid, url: data.permalink_url };
}

export async function updateTaskNotes(gid, notes) {
  await asana(`/tasks/${gid}`, 'PUT', { notes });
}

function isIsoDate(v) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
}
