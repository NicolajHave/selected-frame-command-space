import { NextResponse } from 'next/server';
import { requireAccess } from '../../../../lib/external-folders/auth';
import { getExternalFolderById, listExternalFolderFiles, updateLastOpened, isConfigured } from '../../../../lib/external-folders/folders';

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
