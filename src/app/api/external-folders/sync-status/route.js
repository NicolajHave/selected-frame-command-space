// Sync project completion state from Asana into the External Project Folder
// row. Called by the Projects page when it refreshes the live data, so a
// project that just completed will get a `deleteAt` and start the retention
// clock without waiting for the cron job.

import { NextResponse } from 'next/server';
import { requireAccess } from '../../../../lib/external-folders/auth';
import { syncProjectStatus, isConfigured } from '../../../../lib/external-folders/folders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try { requireAccess(); } catch (r) { return r; }
  if (!isConfigured()) return NextResponse.json({ ok: false, dbConfigured: false });
  const { projects } = await request.json();
  if (!Array.isArray(projects)) return NextResponse.json({ error: 'projects[] required' }, { status: 400 });
  const updated = [];
  for (const p of projects) {
    if (!p?.gid) continue;
    const result = await syncProjectStatus({
      asanaProjectId: p.gid,
      completed: Boolean(p.completed),
      completedAt: p.completedAt || null,
    });
    if (result) updated.push(result);
  }
  return NextResponse.json({ ok: true, updated: updated.length });
}
