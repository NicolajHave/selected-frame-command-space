import { NextResponse } from 'next/server';
import { requireAccess } from '../../../../lib/external-folders/auth';
import { isConfigured, listRecentlyOpened } from '../../../../lib/external-folders/folders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try { requireAccess(); } catch (r) { return r; }
  if (!isConfigured()) return NextResponse.json({ folders: [] });
  const folders = await listRecentlyOpened(8);
  return NextResponse.json({ folders });
}
