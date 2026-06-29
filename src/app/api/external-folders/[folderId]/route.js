import { NextResponse } from 'next/server';
import { requireAccess } from '../../../../lib/external-folders/auth';
import { getExternalFolderById, listExternalFolderFiles, updateLastOpened, updateExternalFolderNotes, isConfigured } from '../../../../lib/external-folders/folders';

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
