// Daily retention pass for External Project Folders.
//
// Vercel cron POSTs Authorization: Bearer <CRON_SECRET>. We accept GET too so
// the route can be hand-tested with curl. Logic:
//
//   1. For every completed folder, recompute days-left from deleteAt.
//   2. If <= 30 days and reminder_30_sent_at is null → send + mark sent.
//   3. If <= 7 days  and reminder_7_sent_at  is null → send + mark sent.
//   4. If deleteAt <= now and status is still completed → set
//      pending_deletion, hard-delete blob objects, then set status=deleted
//      (we keep the row so the UI can show "deleted according to policy").

import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { query, isConfigured, ensureSchema } from '../../../../lib/external-folders/db';
import { sendRetentionReminder } from '../../../../lib/external-folders/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DAY = 24 * 60 * 60 * 1000;

function authorized(request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true; // Allow local runs when no secret is set.
  const got = request.headers.get('authorization') || '';
  return got === `Bearer ${expected}`;
}

async function run() {
  await ensureSchema();
  const now = Date.now();
  const summary = { checked: 0, reminder30: 0, reminder7: 0, deleted: 0 };

  const { rows } = await query`
    SELECT id, project_name, status, delete_at, reminder_30_sent_at, reminder_7_sent_at, blob_prefix
    FROM external_project_folders
    WHERE status IN ('completed', 'pending_deletion')
  `;

  const reminderTo = process.env.RETENTION_REMINDER_EMAIL;

  for (const r of rows) {
    summary.checked++;
    const deleteAtMs = r.delete_at ? new Date(r.delete_at).getTime() : null;
    if (!deleteAtMs) continue;
    const daysLeft = Math.ceil((deleteAtMs - now) / DAY);

    if (deleteAtMs <= now) {
      // Mark pending_deletion if not already, attempt blob cleanup, then deleted.
      if (r.status !== 'pending_deletion') {
        await query`UPDATE external_project_folders SET status = 'pending_deletion' WHERE id = ${r.id}`;
      }
      const { rows: files } = await query`SELECT id, blob_url FROM external_project_files WHERE folder_id = ${r.id}`;
      for (const f of files) {
        try { await del(f.blob_url); } catch { /* best effort */ }
      }
      await query`DELETE FROM external_project_files WHERE folder_id = ${r.id}`;
      await query`UPDATE external_project_folders SET status = 'deleted' WHERE id = ${r.id}`;
      summary.deleted++;
      continue;
    }

    if (daysLeft <= 30 && !r.reminder_30_sent_at) {
      const folder = {
        id: r.id, projectName: r.project_name, deleteAt: r.delete_at,
      };
      await sendRetentionReminder({ folder, daysLeft, to: reminderTo });
      await query`UPDATE external_project_folders SET reminder_30_sent_at = NOW() WHERE id = ${r.id}`;
      summary.reminder30++;
    }
    if (daysLeft <= 7 && !r.reminder_7_sent_at) {
      const folder = {
        id: r.id, projectName: r.project_name, deleteAt: r.delete_at,
      };
      await sendRetentionReminder({ folder, daysLeft, to: reminderTo });
      await query`UPDATE external_project_folders SET reminder_7_sent_at = NOW() WHERE id = ${r.id}`;
      summary.reminder7++;
    }
  }

  return summary;
}

export async function GET(request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  if (!isConfigured()) return NextResponse.json({ skipped: true, reason: 'DB not configured' });
  try {
    const summary = await run();
    return NextResponse.json({ ok: true, ...summary });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}

export const POST = GET;
