import { NextResponse } from 'next/server';
import { ensureConfiguredOr503 } from '../../../../../../lib/external-folders/db';
import {
  getOpeningReportBySlug,
  deleteOpeningReportPhoto,
} from '../../../../../../lib/opening-reports/reports';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(_request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  const report = await getOpeningReportBySlug(params.slug);
  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  try {
    await deleteOpeningReportPhoto(report.id, params.photoId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Failed to delete' }, { status: 500 });
  }
}
