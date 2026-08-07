import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { requireAccess } from '../../../../lib/external-folders/auth';
import { getExternalFolderById, listExternalFolderFiles, updateLastOpened, updateExternalFolderNotes, deleteExternalFolder, isConfigured } from '../../../../lib/external-folders/folders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try { requireAccess(); } catch (r) { return r; }
  if (!isConfigured()) return NextResponse.json({ folder: null }, { status: 503 });
  const folder = await getExternalFolderById(params.folderId);
  if (!folder) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await updateLastOpened(folder.id);
  const files = await listExternalFolderFiles(folder.id);
  return NextResponse.json({ folder, files });
}

// Permanent delete. The client must echo the exact project name in
// `confirmName` — this removes every file in the folder and cannot be undone,
// so a stray click must not be enough.
export async function DELETE(request, { params }) {
  try { requireAccess(); } catch (r) { return r; }
  if (!isConfigured()) return NextResponse.json({ error: 'DB_NOT_CONFIGURED' }, { status: 503 });
  const folder = await getExternalFolderById(params.folderId);
  if (!folder) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let body = {};
  try { body = await request.json(); } catch { /* confirmName checked below */ }
  if ((body?.confirmName || '').trim() !== folder.projectName.trim()) {
    return NextResponse.json(
      { error: 'confirmName must match the project name exactly' },
      { status: 400 },
    );
  }

  // Blobs first: once the rows are gone we no longer know what to clean up.
  const files = await listExternalFolderFiles(folder.id);
  let blobsDeleted = 0;
  for (const f of files) {
    try { await del(f.blobUrl); blobsDeleted += 1; } catch { /* best effort */ }
  }

  try {
    await deleteExternalFolder(folder.id);
    return NextResponse.json({ ok: true, projectName: folder.projectName, filesDeleted: files.length, blobsDeleted });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Failed to delete folder' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try { requireAccess(); } catch (r) { return r; }
  if (!isConfigured()) return NextResponse.json({ error: 'DB_NOT_CONFIGURED' }, { status: 503 });
  const folder = await getExternalFolderById(params.folderId);
  if (!folder) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  if (!Object.prototype.hasOwnProperty.call(body || {}, 'notes')) {
    return NextResponse.json({ error: 'notes is required' }, { status: 400 });
  }
  try {
    const updated = await updateExternalFolderNotes(folder.id, typeof body.notes === 'string' ? body.notes : '');
    return NextResponse.json({ folder: updated });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Failed to update notes' }, { status: 500 });
  }
}
