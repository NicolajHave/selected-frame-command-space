import { NextResponse } from 'next/server';
import { ensureConfiguredOr503 } from '../../../../lib/external-folders/db';
import {
  getOpeningReportWithChildren,
  updateOpeningReport,
} from '../../../../lib/opening-reports/reports';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  const data = await getOpeningReportWithChildren(params.slug);
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
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
