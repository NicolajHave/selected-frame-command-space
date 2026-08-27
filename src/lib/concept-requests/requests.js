// Server-side data layer for Concept Requests.
// Pure Supabase access; route handlers wrap these with HTTP concerns.
//
// Reuses the External Folders Supabase client — same project, same
// service-role key, public schema.

import { getSupabase, isConfigured } from '../external-folders/db';

export { isConfigured };

const TABLE = 'concept_requests';

export const TYPES = ['ADDITION', 'CHANGE', 'FEEDBACK', 'COST'];
export const URGENCIES = ['NICE_TO_HAVE', 'UPCOMING_PROJECT', 'BLOCKING'];
export const STATUSES = ['NEW', 'UNDER_REVIEW', 'ACCEPTED', 'DECLINED', 'PARKED', 'IMPLEMENTED'];

/** Statuses that still need a decision — drives the sidebar count. */
export const OPEN_STATUSES = ['NEW', 'UNDER_REVIEW'];

function rowToRequest(r) {
  if (!r) return null;
  return {
    id: r.id,
    submitterName: r.submitter_name,
    submitterEmail: r.submitter_email || '',
    region: r.region || '',
    partner: r.partner || '',
    type: r.type,
    elementCode: r.element_code || '',
    elementName: r.element_name || '',
    title: r.title,
    description: r.description || '',
    problem: r.problem || '',
    urgency: r.urgency,
    projectRef: r.project_ref || '',
    photos: Array.isArray(r.photos) ? r.photos : [],
    status: r.status,
    decisionNote: r.decision_note || '',
    decidedBy: r.decided_by || '',
    decidedAt: r.decided_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function unwrap({ data, error }, ctx) {
  if (error) {
    // Postgres "relation does not exist" → make the bootstrap requirement
    // obvious instead of leaking the raw message.
    if (error.code === '42P01') {
      throw new Error(
        `The concept_requests table is missing. Run supabase/concept-requests-schema.sql in the SQL Editor. (${ctx})`,
      );
    }
    throw new Error(`${ctx}: ${error.message}`);
  }
  return data;
}

export async function listConceptRequests() {
  const sb = getSupabase();
  const data = unwrap(
    await sb.from(TABLE).select('*').order('created_at', { ascending: false }),
    'listConceptRequests',
  );
  return (data || []).map(rowToRequest);
}

export async function getConceptRequest(id) {
  const sb = getSupabase();
  const data = unwrap(
    await sb.from(TABLE).select('*').eq('id', id).maybeSingle(),
    'getConceptRequest',
  );
  return rowToRequest(data);
}

export async function createConceptRequest(input) {
  const sb = getSupabase();
  const row = {
    submitter_name: input.submitterName,
    submitter_email: input.submitterEmail || null,
    region: input.region || null,
    partner: input.partner || null,
    type: TYPES.includes(input.type) ? input.type : 'FEEDBACK',
    element_code: input.elementCode || null,
    element_name: input.elementName || null,
    title: input.title,
    description: input.description || null,
    problem: input.problem || null,
    urgency: URGENCIES.includes(input.urgency) ? input.urgency : 'NICE_TO_HAVE',
    project_ref: input.projectRef || null,
    photos: Array.isArray(input.photos) ? input.photos : [],
  };
  const data = unwrap(
    await sb.from(TABLE).insert(row).select().single(),
    'createConceptRequest',
  );
  return rowToRequest(data);
}

/**
 * Triage update. Stamps decided_by / decided_at whenever the status moves off
 * NEW, so the register shows who resolved a request without a separate table.
 */
export async function updateConceptRequest(id, patch) {
  const sb = getSupabase();
  const row = { updated_at: new Date().toISOString() };

  if (patch.status !== undefined) {
    if (!STATUSES.includes(patch.status)) throw new Error(`Unknown status: ${patch.status}`);
    row.status = patch.status;
    if (patch.status === 'NEW') {
      row.decided_at = null;
      row.decided_by = null;
    } else {
      row.decided_at = new Date().toISOString();
      if (patch.decidedBy) row.decided_by = patch.decidedBy;
    }
  }
  if (patch.decisionNote !== undefined) row.decision_note = patch.decisionNote || null;

  const data = unwrap(
    await sb.from(TABLE).update(row).eq('id', id).select().single(),
    'updateConceptRequest',
  );
  return rowToRequest(data);
}

export async function deleteConceptRequest(id) {
  const sb = getSupabase();
  unwrap(await sb.from(TABLE).delete().eq('id', id), 'deleteConceptRequest');
  return true;
}
