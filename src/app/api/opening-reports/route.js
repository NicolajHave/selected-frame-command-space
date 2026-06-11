import { NextResponse } from 'next/server';
import { ensureConfiguredOr503 } from '../../../lib/external-folders/db';
import {
  createOpeningReport,
  listOpeningReports,
} from '../../../lib/opening-reports/reports';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || undefined;
  const reports = await listOpeningReports({ status });
  return NextResponse.json({ reports });
}

export async function POST(request) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  const {
    partnerName,
    location,
    sqm,
    openingDate,
    completedByName,
    shopfloorResponsible,
    responsibleContact,
    responsibilityWhen,
  } = body || {};
  if (!partnerName) return NextResponse.json({ error: 'partnerName is required' }, { status: 400 });
  if (!location) return NextResponse.json({ error: 'location is required' }, { status: 400 });
  if (!completedByName) return NextResponse.json({ error: 'completedByName is required' }, { status: 400 });
  try {
    const report = await createOpeningReport({
      partnerName,
      location,
      sqm,
      openingDate,
      completedByName,
      shopfloorResponsible,
      responsibleContact,
      responsibilityWhen,
    });
    return NextResponse.json({ report });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Failed to create report' }, { status: 500 });
  }
}
