// Daily retention pass for External Project Folders.
//
// Vercel cron POSTs Authorization: Bearer <CRON_SECRET>. We accept GET too so
// the route can be hand-tested with curl. Logic:
//
//   1. For every completed folder, recompute days-left from delete_at.
//   2. If <= 30 days and reminder_30_sent_at is null → send + mark sent.
//   3. If <= 7  days and reminder_7_sent_at  is null → send + mark sent.
//   4. If delete_at <= now and status is still completed → set
//      pending_deletion, hard-delete blob objects + file rows, then set
//      status=deleted (we keep the folder row so the UI can show
//      "Deleted by retention policy").

import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { getSupabase, isConfigured } from '../../../../lib/external-folders/db';
import { sendRetentionReminder } from '../../../../lib/external-folders/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DAY = 24 * 60 * 60 * 1000;
const FOLDERS = 'external_project_folders';
const FILES = 'external_project_files';

function authorized(request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true; // allow local runs when no secret is set
  const got = request.headers.get('authorization') || '';
  return got === `Bearer ${expected}`;
}

async function run() {
  const sb = getSupabase();
  const now = Date.now();
  const summary = { checked: 0, reminder30: 0, reminder7: 0, deleted: 0 };

  const { data: rows, error } = await sb
    .from(FOLDERS)
    .select('id, project_name, status, delete_at, reminder_30_sent_at, reminder_7_sent_at, blob_prefix')
    .in('status', ['completed', 'pending_deletion']);

  if (error) throw new Error(error.message);

  const reminderTo = process.env.RETENTION_REMINDER_EMAIL;

  for (const r of rows) {
    summary.checked++;
    const deleteAtMs = r.delete_at ? new Date(r.delete_at).getTime() : null;
    if (!deleteAtMs) continue;
    const daysLeft = Math.ceil((deleteAtMs - now) / DAY);

    if (deleteAtMs <= now) {
      if (r.status !== 'pending_deletion') {
        await sb.from(FOLDERS).update({ status: 'pending_deletion' }).eq('id', r.id);
      }
      const { data: files } = await sb.from(FILES).select('id, blob_url').eq('folder_id', r.id);
      for (const f of files || []) {
        try { await del(f.blob_url); } catch { /* best effort */ }
      }
      await sb.from(FILES).delete().eq('folder_id', r.id);
      await sb.from(FOLDERS).update({ status: 'deleted' }).eq('id', r.id);
      summary.deleted++;
      continue;
    }

    if (daysLeft <= 30 && !r.reminder_30_sent_at) {
      await sendRetentionReminder({
        folder: { id: r.id, projectName: r.project_name, deleteAt: r.delete_at },
        daysLeft,
        to: reminderTo,
      });
      await sb.from(FOLDERS).update({ reminder_30_sent_at: new Date().toISOString() }).eq('id', r.id);
      summary.reminder30++;
    }
    if (daysLeft <= 7 && !r.reminder_7_sent_at) {
      await sendRetentionReminder({
        folder: { id: r.id, projectName: r.project_name, deleteAt: r.delete_at },
        daysLeft,
        to: reminderTo,
      });
      await sb.from(FOLDERS).update({ reminder_7_sent_at: new Date().toISOString() }).eq('id', r.id);
      summary.reminder7++;
    }
  }

  return summary;
}

export async function GET(request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  if (!isConfigured()) return NextResponse.json({ skipped: true, reason: 'Supabase not configured' });
  try {
    const summary = await run();
    return NextResponse.json({ ok: true, ...summary });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}

export const POST = GET;
