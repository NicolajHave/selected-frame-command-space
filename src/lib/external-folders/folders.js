// Server-side utilities for External Project Folders.
// Pure data layer on top of Supabase. Route handlers wrap these with auth
// and HTTP concerns.

import crypto from 'node:crypto';
import { getSupabase, isConfigured } from './db';
import { computeRetention } from './retention';

export { isConfigured };

const FOLDERS = 'external_project_folders';
const FILES = 'external_project_files';
const RECENT = 'recently_opened_folders';

function rowToFolder(r) {
  if (!r) return null;
  return {
    id: r.id,
    asanaProjectId: r.asana_project_id,
    projectName: r.project_name,
    projectType: r.project_type,
    region: r.region,
    dueDate: r.due_date,
    status: r.status,
    createdAt: r.created_at,
    completedAt: r.completed_at,
    retentionStartDate: r.retention_start_date,
    deleteAt: r.delete_at,
    reminder30SentAt: r.reminder_30_sent_at,
    reminder7SentAt: r.reminder_7_sent_at,
    lastOpenedAt: r.last_opened_at,
    blobPrefix: r.blob_prefix,
    folderUrlSlug: r.folder_url_slug,
    notes: r.notes || "",
  };
}

function rowToFile(r) {
  return {
    id: r.id,
    folderId: r.folder_id,
    fileName: r.file_name,
    originalName: r.original_name,
    fileType: r.file_type,
    fileSize: r.file_size != null ? Number(r.file_size) : 0,
    blobUrl: r.blob_url,
    blobPath: r.blob_path,
    uploadedAt: r.uploaded_at,
    uploadedByName: r.uploaded_by_name,
    category: r.category,
  };
}

function makeSlug() {
  return crypto.randomBytes(6).toString('base64url');
}

function unwrap({ data, error }, ctx) {
  if (error) {
    // Postgres "relation does not exist" → make the bootstrap requirement
    // obvious instead of leaking the raw message.
    if (error.code === '42P01') {
      throw new Error(
        `Supabase tables are missing. Run supabase/schema.sql in the SQL Editor. (${ctx})`,
      );
    }
    throw new Error(`${ctx}: ${error.message}`);
  }
  return data;
}

export async function getExternalFolderByAsanaProjectId(asanaProjectId) {
  const sb = getSupabase();
  const data = unwrap(
    await sb.from(FOLDERS).select('*').eq('asana_project_id', asanaProjectId).maybeSingle(),
    'getExternalFolderByAsanaProjectId',
  );
  return rowToFolder(data);
}

export async function getExternalFolderById(id) {
  const sb = getSupabase();
  // Accept either the row id or the URL slug.
  const data = unwrap(
    await sb.from(FOLDERS).select('*').or(`id.eq.${id},folder_url_slug.eq.${id}`).maybeSingle(),
    'getExternalFolderById',
  );
  return rowToFolder(data);
}

export async function listExternalFolders({ status, region, search } = {}) {
  const sb = getSupabase();
  let q = sb.from(FOLDERS).select('*').order('due_date', { ascending: true, nullsFirst: false }).order('project_name', { ascending: true });
  if (status) q = q.eq('status', status);
  if (region) q = q.eq('region', region);
  if (search) q = q.ilike('project_name', `%${search}%`);
  const data = unwrap(await q, 'listExternalFolders');
  return data.map(rowToFolder);
}

export async function listRecentlyOpened(limit = 8) {
  const sb = getSupabase();
  // We pull the most recent rows from recently_opened_folders, join folder
  // data, then dedupe by folder in JS keeping the newest opened_at.
  const recent = unwrap(
    await sb
      .from(RECENT)
      .select('opened_at, folder_id, asana_project_id, folder:external_project_folders!inner(*)')
      .order('opened_at', { ascending: false })
      .limit(limit * 3),
    'listRecentlyOpened',
  );

  const seen = new Set();
  const out = [];
  for (const r of recent) {
    if (seen.has(r.folder_id)) continue;
    seen.add(r.folder_id);
    out.push({ ...rowToFolder(r.folder), lastOpenedAt: r.opened_at });
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Create a folder for a given Asana project. Idempotent: if a folder already
 * exists for the same Asana project id, return the existing record.
 */
export async function createExternalFolder({
  asanaProjectId,
  projectName,
  projectType,
  region,
  dueDate,
  completed = false,
  completedAt = null,
}) {
  if (!asanaProjectId) throw new Error('asanaProjectId is required');

  const existing = await getExternalFolderByAsanaProjectId(asanaProjectId);
  if (existing) return existing;

  const id = crypto.randomUUID();
  const slug = makeSlug();
  const blobPrefix = `external-project-folders/${asanaProjectId}/`;
  const status = completed ? 'completed' : 'active';
  const retention = computeRetention({ status, completedAt });

  const sb = getSupabase();
  unwrap(
    await sb.from(FOLDERS).insert({
      id,
      asana_project_id: asanaProjectId,
      project_name: projectName,
      project_type: projectType || null,
      region: region || null,
      due_date: dueDate || null,
      status,
      completed_at: completedAt || null,
      retention_start_date: retention.retentionStartDate,
      delete_at: retention.deleteAt,
      blob_prefix: blobPrefix,
      folder_url_slug: slug,
    }),
    'createExternalFolder',
  );
  return getExternalFolderById(id);
}

/** Sync the project's completion state into an existing folder, if any. */
export async function syncProjectStatus({ asanaProjectId, completed, completedAt }) {
  const folder = await getExternalFolderByAsanaProjectId(asanaProjectId);
  if (!folder) return null;
  const newStatus = completed ? 'completed' : 'active';
  if (folder.status === newStatus) return folder;
  const retention = computeRetention({ status: newStatus, completedAt });
  const sb = getSupabase();
  unwrap(
    await sb
      .from(FOLDERS)
      .update({
        status: newStatus,
        completed_at: completedAt || null,
        retention_start_date: retention.retentionStartDate,
        delete_at: retention.deleteAt,
      })
      .eq('id', folder.id),
    'syncProjectStatus',
  );
  return getExternalFolderById(folder.id);
}

/** Update the per-folder notes (free text, typically bullet lines). */
export async function updateExternalFolderNotes(folderId, notes) {
  const sb = getSupabase();
  unwrap(
    await sb.from(FOLDERS).update({ notes: notes || null }).eq('id', folderId),
    'updateExternalFolderNotes',
  );
  return getExternalFolderById(folderId);
}

export async function updateLastOpened(folderId) {
  const sb = getSupabase();
  const now = new Date().toISOString();
  unwrap(await sb.from(FOLDERS).update({ last_opened_at: now }).eq('id', folderId), 'updateLastOpened');

  const folder = await getExternalFolderById(folderId);
  if (folder) {
    unwrap(
      await sb.from(RECENT).insert({
        id: crypto.randomUUID(),
        folder_id: folder.id,
        asana_project_id: folder.asanaProjectId,
        opened_at: now,
      }),
      'recordRecentlyOpened',
    );
  }
}

export async function recordExternalFolderFile({
  folderId,
  fileName,
  originalName,
  fileType,
  fileSize,
  blobUrl,
  blobPath,
  uploadedByName = null,
  category = null,
}) {
  const sb = getSupabase();
  const id = crypto.randomUUID();
  unwrap(
    await sb.from(FILES).insert({
      id,
      folder_id: folderId,
      file_name: fileName,
      original_name: originalName,
      file_type: fileType,
      file_size: fileSize,
      blob_url: blobUrl,
      blob_path: blobPath,
      uploaded_by_name: uploadedByName,
      category,
    }),
    'recordExternalFolderFile',
  );
  const data = unwrap(
    await sb.from(FILES).select('*').eq('id', id).single(),
    'recordExternalFolderFile/read',
  );
  return rowToFile(data);
}

export async function listExternalFolderFiles(folderId) {
  const sb = getSupabase();
  const data = unwrap(
    await sb
      .from(FILES)
      .select('*')
      .eq('folder_id', folderId)
      .order('uploaded_at', { ascending: false }),
    'listExternalFolderFiles',
  );
  return data.map(rowToFile);
}

export async function deleteExternalFolderFile(fileId) {
  const sb = getSupabase();
  const data = unwrap(
    await sb.from(FILES).select('*').eq('id', fileId).maybeSingle(),
    'deleteExternalFolderFile/read',
  );
  if (!data) return null;
  unwrap(await sb.from(FILES).delete().eq('id', fileId), 'deleteExternalFolderFile');
  return rowToFile(data);
}

export async function countFilesByFolder(folderIds) {
  if (!folderIds.length) return {};
  const sb = getSupabase();
  // PostgREST doesn't expose GROUP BY directly; we fetch only the folder_id
  // column (cheap) and count in JS. Adequate for V1's data volume.
  const data = unwrap(
    await sb.from(FILES).select('folder_id').in('folder_id', folderIds),
    'countFilesByFolder',
  );
  const out = {};
  for (const r of data) out[r.folder_id] = (out[r.folder_id] || 0) + 1;
  return out;
}
