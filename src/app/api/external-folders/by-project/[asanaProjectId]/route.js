import { NextResponse } from 'next/server';
import { requireAccess } from '../../../../../lib/external-folders/auth';
import { isConfigured, getExternalFolderByAsanaProjectId, countFilesByFolder } from '../../../../../lib/external-folders/folders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try { requireAccess(); } catch (r) { return r; }
  if (!isConfigured()) return NextResponse.json({ folder: null, dbConfigured: false });
  const { asanaProjectId } = params;
  const folder = await getExternalFolderByAsanaProjectId(asanaProjectId);
  if (!folder) return NextResponse.json({ folder: null });
  const counts = await countFilesByFolder([folder.id]);
  return NextResponse.json({ folder: { ...folder, fileCount: counts[folder.id] || 0 } });
}
