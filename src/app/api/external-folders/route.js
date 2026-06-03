import { NextResponse } from 'next/server';
import { requireAccess } from '../../../lib/external-folders/auth';
import {
  isConfigured,
  listExternalFolders,
  createExternalFolder,
  countFilesByFolder,
} from '../../../lib/external-folders/folders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function dbNotConfigured() {
  return NextResponse.json(
    { error: 'DB_NOT_CONFIGURED', message: 'Provision Postgres and set POSTGRES_URL or DATABASE_URL to enable External Project Folders.' },
    { status: 503 },
  );
}

export async function GET(request) {
  try { requireAccess(); } catch (r) { return r; }
  if (!isConfigured()) return dbNotConfigured();
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || undefined;
  const region = url.searchParams.get('region') || undefined;
  const search = url.searchParams.get('search') || undefined;
  const folders = await listExternalFolders({ status, region, search });
  const counts = await countFilesByFolder(folders.map((f) => f.id));
  return NextResponse.json({
    folders: folders.map((f) => ({ ...f, fileCount: counts[f.id] || 0 })),
  });
}

export async function POST(request) {
  try { requireAccess(); } catch (r) { return r; }
  if (!isConfigured()) return dbNotConfigured();
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  const { asanaProjectId, projectName, projectType, region, dueDate, completed, completedAt } = body || {};
  if (!asanaProjectId) return NextResponse.json({ error: 'asanaProjectId is required' }, { status: 400 });
  if (!projectName) return NextResponse.json({ error: 'projectName is required' }, { status: 400 });
  try {
    const folder = await createExternalFolder({ asanaProjectId, projectName, projectType, region, dueDate, completed, completedAt });
    return NextResponse.json({ folder });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Failed to create folder' }, { status: 500 });
  }
}
