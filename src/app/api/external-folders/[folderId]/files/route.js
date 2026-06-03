import { NextResponse } from 'next/server';
import { requireAccess } from '../../../../../lib/external-folders/auth';
import { getExternalFolderById, recordExternalFolderFile, listExternalFolderFiles, isConfigured } from '../../../../../lib/external-folders/folders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try { requireAccess(); } catch (r) { return r; }
  if (!isConfigured()) return NextResponse.json({ files: [] }, { status: 503 });
  const files = await listExternalFolderFiles(params.folderId);
  return NextResponse.json({ files });
}

export async function POST(request, { params }) {
  try { requireAccess(); } catch (r) { return r; }
  if (!isConfigured()) return NextResponse.json({ error: 'DB_NOT_CONFIGURED' }, { status: 503 });
  const folder = await getExternalFolderById(params.folderId);
  if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  const { originalName, blobUrl, blobPath, fileType, fileSize, category, uploadedByName } = body || {};
  if (!originalName || !blobUrl || !blobPath) {
    return NextResponse.json({ error: 'originalName, blobUrl and blobPath are required' }, { status: 400 });
  }
  if (!blobPath.startsWith(folder.blobPrefix)) {
    return NextResponse.json({ error: 'blobPath outside folder prefix' }, { status: 400 });
  }

  const file = await recordExternalFolderFile({
    folderId: folder.id,
    fileName: blobPath.split('/').pop(),
    originalName,
    fileType: fileType || null,
    fileSize: Number(fileSize) || 0,
    blobUrl,
    blobPath,
    uploadedByName: uploadedByName || null,
    category: category || null,
  });
  return NextResponse.json({ file });
}
