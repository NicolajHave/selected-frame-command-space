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

// The SQM number field on the intake project, feeding the FY footprint report.
// Overridable via env in case the field is ever recreated.
const DEFAULT_SQM_FIELD_GID = '1217571452526962';
function sqmFieldGid() {
  return process.env.ASANA_SQM_FIELD_ID || DEFAULT_SQM_FIELD_GID;
}

export async function createIntakeTask({ name, notes, dueOn, sqm }) {
  const base = {
    name,
    notes,
    projects: [intakeProjectGid()],
    ...(isIsoDate(dueOn) ? { due_on: dueOn } : {}),
  };

  const hasSqm = typeof sqm === 'number' && Number.isFinite(sqm) && sqm > 0;
  const withField = hasSqm
    ? { ...base, custom_fields: { [sqmFieldGid()]: sqm } }
    : base;

  try {
    const data = await asana('/tasks', 'POST', withField);
    return { gid: data.gid, url: data.permalink_url, sqmAttached: hasSqm };
  } catch (e) {
    // The task is the keystone of the whole intake — it keys the External
    // Folder and puts the project in Current. Never let a custom-field problem
    // (renamed, deleted, wrong gid) cost us the task; retry without it.
    if (!hasSqm) throw e;
    const data = await asana('/tasks', 'POST', base);
    return { gid: data.gid, url: data.permalink_url, sqmAttached: false };
  }
}

export async function updateTaskNotes(gid, notes) {
  await asana(`/tasks/${gid}`, 'PUT', { notes });
}

function isIsoDate(v) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
}
