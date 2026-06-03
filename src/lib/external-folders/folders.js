// Server-side utilities for External Project Folders. Pure data layer —
// route handlers wrap these with auth and HTTP concerns.

import crypto from 'node:crypto';
import { query, ensureSchema, isConfigured } from './db';
import { computeRetention } from './retention';

export { isConfigured };

/** Convert a Postgres row → camelCase object the UI consumes. */
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
  };
}

function rowToFile(r) {
  return {
    id: r.id,
    folderId: r.folder_id,
    fileName: r.file_name,
    originalName: r.original_name,
    fileType: r.file_type,
    fileSize: Number(r.file_size),
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

export async function getExternalFolderByAsanaProjectId(asanaProjectId) {
  await ensureSchema();
  const { rows } = await query`
    SELECT * FROM external_project_folders WHERE asana_project_id = ${asanaProjectId} LIMIT 1
  `;
  return rowToFolder(rows[0]);
}

export async function getExternalFolderById(id) {
  await ensureSchema();
  const { rows } = await query`
    SELECT * FROM external_project_folders WHERE id = ${id} OR folder_url_slug = ${id} LIMIT 1
  `;
  return rowToFolder(rows[0]);
}

export async function listExternalFolders({ status, region, search } = {}) {
  await ensureSchema();
  // Build a dynamic filter via tagged-template chaining is awkward with
  // @vercel/postgres; we filter in JS after fetching. Result set is small
  // (one row per project) so this is fine for V1.
  const { rows } = await query`SELECT * FROM external_project_folders ORDER BY due_date ASC NULLS LAST, project_name ASC`;
  let out = rows.map(rowToFolder);
  if (status) out = out.filter((f) => f.status === status);
  if (region) out = out.filter((f) => f.region === region);
  if (search) {
    const s = search.toLowerCase();
    out = out.filter((f) => f.projectName.toLowerCase().includes(s));
  }
  return out;
}

export async function listRecentlyOpened(limit = 8) {
  await ensureSchema();
  const { rows } = await query`
    SELECT f.*, r.opened_at AS recent_opened_at
    FROM recently_opened_folders r
    JOIN external_project_folders f ON f.id = r.folder_id
    WHERE r.opened_at = (
      SELECT MAX(opened_at) FROM recently_opened_folders WHERE folder_id = r.folder_id
    )
    ORDER BY r.opened_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({ ...rowToFolder(r), lastOpenedAt: r.recent_opened_at }));
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

  await query`
    INSERT INTO external_project_folders (
      id, asana_project_id, project_name, project_type, region, due_date,
      status, completed_at, retention_start_date, delete_at, blob_prefix, folder_url_slug
    ) VALUES (
      ${id}, ${asanaProjectId}, ${projectName}, ${projectType || null}, ${region || null},
      ${dueDate || null}, ${status}, ${completedAt}, ${retention.retentionStartDate},
      ${retention.deleteAt}, ${blobPrefix}, ${slug}
    )
  `;
  return getExternalFolderById(id);
}

/** Sync the project's completion state into an existing folder, if any. */
export async function syncProjectStatus({ asanaProjectId, completed, completedAt }) {
  const folder = await getExternalFolderByAsanaProjectId(asanaProjectId);
  if (!folder) return null;
  const newStatus = completed ? 'completed' : 'active';
  if (folder.status === newStatus) return folder;
  const retention = computeRetention({ status: newStatus, completedAt });
  await query`
    UPDATE external_project_folders
    SET status = ${newStatus},
        completed_at = ${completedAt || null},
        retention_start_date = ${retention.retentionStartDate},
        delete_at = ${retention.deleteAt}
    WHERE id = ${folder.id}
  `;
  return getExternalFolderById(folder.id);
}

export async function updateLastOpened(folderId) {
  await ensureSchema();
  const now = new Date().toISOString();
  await query`
    UPDATE external_project_folders SET last_opened_at = ${now} WHERE id = ${folderId}
  `;
  const id = crypto.randomUUID();
  const folder = await getExternalFolderById(folderId);
  if (folder) {
    await query`
      INSERT INTO recently_opened_folders (id, folder_id, asana_project_id, opened_at)
      VALUES (${id}, ${folder.id}, ${folder.asanaProjectId}, ${now})
    `;
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
  await ensureSchema();
  const id = crypto.randomUUID();
  await query`
    INSERT INTO external_project_files (
      id, folder_id, file_name, original_name, file_type, file_size,
      blob_url, blob_path, uploaded_by_name, category
    ) VALUES (
      ${id}, ${folderId}, ${fileName}, ${originalName}, ${fileType}, ${fileSize},
      ${blobUrl}, ${blobPath}, ${uploadedByName}, ${category}
    )
  `;
  const { rows } = await query`SELECT * FROM external_project_files WHERE id = ${id}`;
  return rowToFile(rows[0]);
}

export async function listExternalFolderFiles(folderId) {
  await ensureSchema();
  const { rows } = await query`
    SELECT * FROM external_project_files WHERE folder_id = ${folderId} ORDER BY uploaded_at DESC
  `;
  return rows.map(rowToFile);
}

export async function deleteExternalFolderFile(fileId) {
  await ensureSchema();
  const { rows } = await query`SELECT * FROM external_project_files WHERE id = ${fileId}`;
  const file = rows[0];
  if (!file) return null;
  await query`DELETE FROM external_project_files WHERE id = ${fileId}`;
  return rowToFile(file);
}

export async function countFilesByFolder(folderIds) {
  if (!folderIds.length) return {};
  await ensureSchema();
  // We do this in a single round trip rather than per-folder.
  const { rows } = await query`
    SELECT folder_id, COUNT(*)::int AS n FROM external_project_files GROUP BY folder_id
  `;
  const out = {};
  for (const r of rows) out[r.folder_id] = Number(r.n);
  return out;
}
