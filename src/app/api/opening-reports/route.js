import { NextResponse } from 'next/server';
import { ensureConfiguredOr503 } from '../../../lib/external-folders/db';
import {
  createOpeningReport,
  listOpeningReports,
} from '../../../lib/opening-reports/reports';
import { notifyOpeningReport } from '../../../lib/opening-reports/notify';

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
    asanaProjectId,
    projectName,
    projectRegion,
    projectDueDate,
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
      asanaProjectId,
      projectName,
      projectRegion,
      projectDueDate,
    });

    // Best-effort: the report exists, so a failing webhook must not fail the
    // creation. The outcome is reported back instead.
    const mail = await notifyOpeningReport(report, { event: 'created' });

    // The report is taken even when this deployment has not had the project
    // columns applied yet — but say so, or the rep believes the report is
    // linked and the filing on approval will quietly have nowhere to go.
    const projectLinkLost = Boolean(asanaProjectId) && !report.asanaProjectId;

    return NextResponse.json({
      report,
      mail,
      ...(projectLinkLost
        ? {
            warning:
              'The report was created, but it could not be linked to the project: run supabase/opening-report-schema.sql in the SQL Editor, then NOTIFY pgrst, \'reload schema\';',
          }
        : {}),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Failed to create report' }, { status: 500 });
  }
}
