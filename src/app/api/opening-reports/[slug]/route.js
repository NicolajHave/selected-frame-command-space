import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { ensureConfiguredOr503 } from '../../../../lib/external-folders/db';
import {
  getOpeningReportWithChildren,
  updateOpeningReport,
  deleteOpeningReport,
} from '../../../../lib/opening-reports/reports';
import { ensureAdminCodeOr403 } from '../../../../lib/opening-reports/admin-code';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  const data = await getOpeningReportWithChildren(params.slug);
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}

/**
 * Deleting a report is gated by the shared code and checked here, not just in
 * the UI, so the button cannot be clicked past in devtools.
 *
 * Blobs go first: the photo rows hold the only pointers to them and the FK
 * cascade drops those rows with the report, so the reverse order orphans the
 * storage with no way to find it again.
 */
export async function DELETE(request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  let body;
  try { body = await request.json(); } catch { body = {}; }
  try { ensureAdminCodeOr403(body?.code); } catch (r) { return r; }

  try {
    const data = await getOpeningReportWithChildren(params.slug);
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const urls = [
      ...(data.photos || []).map((p) => p.blobUrl),
      data.report.reportPdfUrl,
    ].filter(Boolean);

    for (const url of urls) {
      try {
        await del(url);
      } catch {
        // Best-effort: a blob already gone must not block the delete.
      }
    }

    await deleteOpeningReport(data.report.id);
    return NextResponse.json({ ok: true, deletedBlobs: urls.length });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Failed to delete' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  try {
    const data = await updateOpeningReport(params.slug, body || {});
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Failed to update' }, { status: 500 });
  }
}
