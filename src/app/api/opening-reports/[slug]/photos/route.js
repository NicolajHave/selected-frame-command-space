import { NextResponse } from 'next/server';
import { ensureConfiguredOr503 } from '../../../../../lib/external-folders/db';
import {
  getOpeningReportBySlug,
  recordOpeningReportPhoto,
  deleteOpeningReportPhotosBySlot,
} from '../../../../../lib/opening-reports/reports';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  const report = await getOpeningReportBySlug(params.slug);
  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  const { slot, slotOrder, originalName, blobUrl, blobPath, replace } = body || {};
  if (!slot) return NextResponse.json({ error: 'slot is required' }, { status: 400 });
  if (!blobUrl || !blobPath) return NextResponse.json({ error: 'blobUrl and blobPath are required' }, { status: 400 });
  if (!blobPath.startsWith(report.blobPrefix)) {
    return NextResponse.json({ error: 'blobPath outside report prefix' }, { status: 400 });
  }

  // For fixed slots the UI sets replace=true so only the latest photo
  // survives. Extras append (slot_order increments by uploadedAt).
  if (replace) {
    await deleteOpeningReportPhotosBySlot(report.id, slot);
  }

  const photo = await recordOpeningReportPhoto({
    reportId: report.id,
    slot,
    slotOrder: Number(slotOrder) || 0,
    fileName: blobPath.split('/').pop() || originalName || 'photo',
    blobUrl,
    blobPath,
  });
  return NextResponse.json({ photo });
}
