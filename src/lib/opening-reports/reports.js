// Server-side data layer for Opening Reports.
// Mirrors src/lib/external-folders/folders.js — reuses the same Supabase
// helpers (getSupabase, isConfigured, ensureConfiguredOr503) and the same
// row/error conventions. Route handlers wrap these with HTTP concerns.

import crypto from 'node:crypto';
import { getSupabase, isConfigured } from '../external-folders/db';
import { CHECKPOINTS } from './checkpoints';

export { isConfigured };

const REPORTS = 'opening_reports';
const CHECKPOINTS_TBL = 'opening_report_checkpoints';
const PHOTOS = 'opening_report_photos';

function rowToReport(r) {
  if (!r) return null;
  return {
    id: r.id,
    partnerName: r.partner_name,
    location: r.location,
    sqm: r.sqm,
    openingDate: r.opening_date,
    completedByName: r.completed_by_name,
    shopfloorResponsible: r.shopfloor_responsible,
    responsibleContact: r.responsible_contact,
    responsibilityWhen: r.responsibility_when,
    status: r.status,
    followUpNeeded: !!r.follow_up_needed,
    followUpOwner: r.follow_up_owner,
    followUpDeadline: r.follow_up_deadline,
    submittedAt: r.submitted_at,
    approvedByName: r.approved_by_name,
    approvedAt: r.approved_at,
    approvalNote: r.approval_note,
    reportUrlSlug: r.report_url_slug,
    blobPrefix: r.blob_prefix,
    asanaProjectId: r.asana_project_id || null,
    projectName: r.project_name || null,
    projectRegion: r.project_region || null,
    projectDueDate: r.project_due_date || null,
    reportPdfUrl: r.report_pdf_url || null,
    reportPdfPath: r.report_pdf_path || null,
  };
}

function rowToCheckpoint(r) {
  return {
    id: r.id,
    reportId: r.report_id,
    checkpointNo: r.checkpoint_no,
    tier: r.tier,
    title: r.title,
    result: r.result,
    comment: r.comment,
  };
}

function rowToPhoto(r) {
  return {
    id: r.id,
    reportId: r.report_id,
    slot: r.slot,
    slotOrder: r.slot_order,
    fileName: r.file_name,
    blobUrl: r.blob_url,
    blobPath: r.blob_path,
    uploadedAt: r.uploaded_at,
  };
}

function makeSlug() {
  return crypto.randomBytes(6).toString('base64url');
}

function unwrap({ data, error }, ctx) {
  if (error) {
    if (error.code === '42P01') {
      throw new Error(
        `Supabase tables are missing. Run supabase/opening-report-schema.sql in the SQL Editor. (${ctx})`,
      );
    }
    throw new Error(`${ctx}: ${error.message}`);
  }
  return data;
}

/**
 * A column this deployment has not been given yet — the schema file is applied
 * by hand, so a release can reach the app before the SQL reaches Supabase.
 *
 * Narrower than the showroom-ops helper of the same name: a missing *table*
 * (42P01, "does not exist") is deliberately not matched here, so a wholly
 * un-applied schema still fails loudly with the "run the schema" message
 * rather than quietly writing half a report.
 */
function isMissingSchema(e) {
  const m = String(e?.message || '');
  return /Could not find the .* column|schema cache|PGRST204/i.test(m);
}

export async function createOpeningReport({
  partnerName,
  location,
  sqm,
  openingDate,
  completedByName,
  shopfloorResponsible,
  responsibleContact,
  responsibilityWhen,
  asanaProjectId,
  projectName,
  projectRegion,
  projectDueDate,
}) {
  if (!partnerName) throw new Error('partnerName is required');
  if (!location) throw new Error('location is required');
  if (!completedByName) throw new Error('completedByName is required');

  const id = crypto.randomUUID();
  const slug = makeSlug();
  const blobPrefix = `opening-reports/${id}/`;
  const sb = getSupabase();

  const core = {
    id,
    partner_name: partnerName,
    location,
    sqm: sqm != null ? Number(sqm) : null,
    opening_date: openingDate || null,
    completed_by_name: completedByName,
    shopfloor_responsible: shopfloorResponsible || null,
    responsible_contact: responsibleContact || null,
    responsibility_when: responsibilityWhen || null,
    status: 'submitted',
    report_url_slug: slug,
    blob_prefix: blobPrefix,
  };
  const projectColumns = {
    asana_project_id: asanaProjectId || null,
    project_name: projectName || null,
    project_region: projectRegion || null,
    project_due_date: projectDueDate || null,
  };

  // The project columns arrived in a later revision of the schema file, which
  // is applied by hand. If this deployment has not had it run yet, still take
  // the report: a rep standing in a shop on opening day must never be blocked
  // by a pending migration. The link is what is lost, not the report.
  try {
    unwrap(await sb.from(REPORTS).insert({ ...core, ...projectColumns }), 'createOpeningReport');
  } catch (e) {
    if (!isMissingSchema(e)) throw e;
    unwrap(await sb.from(REPORTS).insert(core), 'createOpeningReport/withoutProject');
  }

  // Seed the 16 checkpoints. Result is left NULL until the rep fills them in.
  const checkpointRows = CHECKPOINTS.map((c) => ({
    id: crypto.randomUUID(),
    report_id: id,
    checkpoint_no: c.no,
    tier: c.tier,
    title: c.title,
    result: null,
    comment: null,
  }));
  unwrap(await sb.from(CHECKPOINTS_TBL).insert(checkpointRows), 'createOpeningReport/checkpoints');

  return getOpeningReportBySlug(slug);
}

export async function listOpeningReports({ status } = {}) {
  const sb = getSupabase();
  let q = sb.from(REPORTS).select('*').order('submitted_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const data = unwrap(await q, 'listOpeningReports');
  return data.map(rowToReport);
}

async function getReportRowByIdOrSlug(idOrSlug) {
  const sb = getSupabase();
  return unwrap(
    await sb.from(REPORTS).select('*').or(`id.eq.${idOrSlug},report_url_slug.eq.${idOrSlug}`).maybeSingle(),
    'getOpeningReport',
  );
}

export async function getOpeningReportBySlug(slug) {
  return rowToReport(await getReportRowByIdOrSlug(slug));
}

export async function getOpeningReportWithChildren(slug) {
  const row = await getReportRowByIdOrSlug(slug);
  if (!row) return null;
  const sb = getSupabase();
  const report = rowToReport(row);
  const cps = unwrap(
    await sb.from(CHECKPOINTS_TBL).select('*').eq('report_id', row.id).order('checkpoint_no', { ascending: true }),
    'getOpeningReport/checkpoints',
  );
  const photos = unwrap(
    await sb.from(PHOTOS).select('*').eq('report_id', row.id).order('uploaded_at', { ascending: true }),
    'getOpeningReport/photos',
  );
  return {
    report,
    checkpoints: cps.map(rowToCheckpoint),
    photos: photos.map(rowToPhoto),
  };
}

const REPORT_FIELD_MAP = {
  partnerName: 'partner_name',
  location: 'location',
  sqm: 'sqm',
  openingDate: 'opening_date',
  completedByName: 'completed_by_name',
  shopfloorResponsible: 'shopfloor_responsible',
  responsibleContact: 'responsible_contact',
  responsibilityWhen: 'responsibility_when',
  followUpNeeded: 'follow_up_needed',
  followUpOwner: 'follow_up_owner',
  followUpDeadline: 'follow_up_deadline',
};

export async function updateOpeningReport(slug, patch) {
  const row = await getReportRowByIdOrSlug(slug);
  if (!row) return null;
  const update = {};
  for (const [key, col] of Object.entries(REPORT_FIELD_MAP)) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      update[col] = patch[key] === '' ? null : patch[key];
    }
  }
  if (Object.keys(update).length > 0) {
    const sb = getSupabase();
    unwrap(await sb.from(REPORTS).update(update).eq('id', row.id), 'updateOpeningReport');
  }
  if (Array.isArray(patch.checkpoints) && patch.checkpoints.length > 0) {
    const sb = getSupabase();
    for (const cp of patch.checkpoints) {
      if (!cp.id) continue;
      const cpUpdate = {};
      if (Object.prototype.hasOwnProperty.call(cp, 'result')) cpUpdate.result = cp.result || null;
      if (Object.prototype.hasOwnProperty.call(cp, 'comment')) cpUpdate.comment = cp.comment || null;
      if (Object.keys(cpUpdate).length > 0) {
        unwrap(
          await sb.from(CHECKPOINTS_TBL).update(cpUpdate).eq('id', cp.id).eq('report_id', row.id),
          'updateOpeningReport/checkpoint',
        );
      }
    }
  }
  return getOpeningReportWithChildren(slug);
}

export async function approveOpeningReport(slug, { approvedByName, approvalNote }) {
  if (!approvedByName) throw new Error('approvedByName is required');
  const row = await getReportRowByIdOrSlug(slug);
  if (!row) return null;
  const sb = getSupabase();
  unwrap(
    await sb.from(REPORTS).update({
      status: 'approved',
      approved_by_name: approvedByName,
      approved_at: new Date().toISOString(),
      approval_note: approvalNote || null,
    }).eq('id', row.id),
    'approveOpeningReport',
  );
  return getOpeningReportWithChildren(slug);
}

/** Records the generated report PDF once it is in Blob. */
export async function setOpeningReportPdf(reportId, { url, path }) {
  const sb = getSupabase();
  try {
    unwrap(
      await sb.from(REPORTS).update({ report_pdf_url: url, report_pdf_path: path }).eq('id', reportId),
      'setOpeningReportPdf',
    );
  } catch (e) {
    // Same story as the project columns: the PDF is already generated and in
    // Blob, and it is handed to the folder and the Flow from the approval
    // route directly. Only the pointer on the row is lost.
    if (!isMissingSchema(e)) throw e;
    return { stored: false, reason: 'report_pdf_url column not in this deployment yet' };
  }
  return { stored: true };
}

/**
 * Deletes the report row. Checkpoints and photos go with it through the FK
 * cascade — the caller must remove the Blob objects FIRST, because the photo
 * rows hold the only pointers to them.
 */
export async function deleteOpeningReport(reportId) {
  const sb = getSupabase();
  unwrap(await sb.from(REPORTS).delete().eq('id', reportId), 'deleteOpeningReport');
}

export async function recordOpeningReportPhoto({
  reportId,
  slot,
  slotOrder,
  fileName,
  blobUrl,
  blobPath,
}) {
  const sb = getSupabase();
  const id = crypto.randomUUID();
  unwrap(
    await sb.from(PHOTOS).insert({
      id,
      report_id: reportId,
      slot,
      slot_order: slotOrder,
      file_name: fileName,
      blob_url: blobUrl,
      blob_path: blobPath,
    }),
    'recordOpeningReportPhoto',
  );
  const data = unwrap(
    await sb.from(PHOTOS).select('*').eq('id', id).single(),
    'recordOpeningReportPhoto/read',
  );
  return rowToPhoto(data);
}

export async function deleteOpeningReportPhotosBySlot(reportId, slot) {
  const sb = getSupabase();
  unwrap(
    await sb.from(PHOTOS).delete().eq('report_id', reportId).eq('slot', slot),
    'deleteOpeningReportPhotosBySlot',
  );
}

export async function deleteOpeningReportPhoto(reportId, photoId) {
  const sb = getSupabase();
  unwrap(
    await sb.from(PHOTOS).delete().eq('report_id', reportId).eq('id', photoId),
    'deleteOpeningReportPhoto',
  );
}
