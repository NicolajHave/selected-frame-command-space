import { NextResponse } from 'next/server';
import { ensureConfiguredOr503 } from '../../../../../lib/external-folders/db';
import { approveOpeningReport } from '../../../../../lib/opening-reports/reports';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  const { approvedByName, approvalNote } = body || {};
  if (!approvedByName) return NextResponse.json({ error: 'approvedByName is required' }, { status: 400 });
  try {
    const data = await approveOpeningReport(params.slug, { approvedByName, approvalNote });
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Failed to approve' }, { status: 500 });
  }
}
