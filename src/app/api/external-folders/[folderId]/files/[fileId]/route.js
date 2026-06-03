import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { requireAccess } from '../../../../../../lib/external-folders/auth';
import { deleteExternalFolderFile, isConfigured } from '../../../../../../lib/external-folders/folders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(_request, { params }) {
  try { requireAccess(); } catch (r) { return r; }
  if (!isConfigured()) return NextResponse.json({ error: 'DB_NOT_CONFIGURED' }, { status: 503 });
  const removed = await deleteExternalFolderFile(params.fileId);
  if (!removed) return NextResponse.json({ error: 'File not found' }, { status: 404 });
  try { await del(removed.blobUrl); } catch { /* best effort */ }
  return NextResponse.json({ ok: true });
}
