// Opening Reports → Power Automate → Outlook + OneDrive.
//
// One webhook, two events, so the user builds and maintains a single Flow:
//
//   event = 'created'   a report was started        → mail only
//   event = 'approved'  Brand Spaces approved it    → mail + copy files into
//                                                     the project's OneDrive
//                                                     folder, beside the filecard
//
// The Flow branches on `event`. Field names are a STABLE CONTRACT — the Flow's
// dynamic-content picker is frozen at the schema generated from the sample
// payload, so renaming one breaks it.
//
// `files` and `targetPath` deliberately mirror the intake flow's contract, so
// the OneDrive actions can be copied from it rather than rebuilt.

import { buildTargetPath } from '../onedrive-path';

const DEFAULT_RECIPIENTS = 'nicolaj.ostergaard@bestseller.com';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const para = (s) => esc(s).replace(/\r?\n/g, '<br>');

function buildHtml(report, { event, deviations, photoCount }) {
  const created = event === 'created';
  const factRow = (label, value) => `
              <tr>
                <td style="padding:7px 16px 7px 0;font:400 12px Helvetica,Arial,sans-serif;color:#8A8D8F;white-space:nowrap;vertical-align:top;">${esc(label)}</td>
                <td style="padding:7px 0;font:400 13px Helvetica,Arial,sans-serif;color:#2C2C2C;vertical-align:top;">${value}</td>
              </tr>`;

  const facts = [
    factRow('Project', esc(report.projectName || '—')),
    report.projectRegion ? factRow('Region', esc(report.projectRegion)) : '',
    factRow('Opening', esc(fmtDate(report.openingDate))),
    report.sqm != null ? factRow('Sqm', `${esc(report.sqm)} m&sup2;`) : '',
    factRow(created ? 'Started by' : 'Completed by', esc(report.completedByName)),
    !created && report.approvedByName ? factRow('Approved by', esc(report.approvedByName)) : '',
    !created ? factRow('Photos', String(photoCount ?? 0)) : '',
    !created && deviations
      ? factRow('Deviations', `<span style="color:#C75B4A;font-weight:600;">${deviations} checkpoint${deviations === 1 ? '' : 's'}</span>`)
      : '',
  ].filter(Boolean).join('');

  const note = created
    ? 'A report has been started. It is filled in on site and comes back here for Brand Spaces approval.'
    : 'The report is approved. The PDF and photos have been filed to the project folder.';

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F4F1;margin:0;padding:26px 0;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#FFFFFF;border:1px solid #ECEAE5;">
      <tr><td style="background-color:#C4944A;height:3px;line-height:3px;font-size:0;">&nbsp;</td></tr>
      <tr><td style="padding:30px 34px 0;">
        <div style="font:600 10px Helvetica,Arial,sans-serif;letter-spacing:1.6px;text-transform:uppercase;color:#8A8D8F;">Selected Frame &middot; Opening report</div>
        <div style="font:400 11px Helvetica,Arial,sans-serif;letter-spacing:0.8px;text-transform:uppercase;color:${created ? '#C4944A' : '#4A7C5C'};padding-top:14px;">${created ? 'Started' : 'Approved by Brand Spaces'}</div>
        <div style="font:400 27px/1.28 Georgia,'Times New Roman',serif;color:#2C2C2C;padding:5px 0 22px;">${esc(report.partnerName)}, ${esc(report.location)}</div>
      </td></tr>
      <tr><td style="padding:0 34px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F4F1;border-left:2px solid #ECEAE5;">
          <tr><td style="padding:12px 18px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">${facts}
            </table>
          </td></tr>
        </table>
      </td></tr>
      ${report.approvalNote ? `<tr><td style="padding:0 34px;">
        <div style="font:600 10px Helvetica,Arial,sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:#8A8D8F;padding-bottom:7px;">Approval note</div>
        <div style="font:400 14px/1.65 Helvetica,Arial,sans-serif;color:#2C2C2C;padding-bottom:24px;">${para(report.approvalNote)}</div>
      </td></tr>` : ''}
      <tr><td style="padding:20px 34px 26px;border-top:1px solid #ECEAE5;">
        <div style="font:400 12px/1.6 Helvetica,Arial,sans-serif;color:#8A8D8F;">${esc(note)}</div>
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

function buildText(report, { event, deviations, photoCount }) {
  const created = event === 'created';
  const lines = [
    created ? 'Opening report started' : 'Opening report approved',
    '',
    `${report.partnerName}, ${report.location}`,
    '',
    `Project: ${report.projectName || '—'}`,
    `Opening: ${fmtDate(report.openingDate)}`,
    `${created ? 'Started by' : 'Completed by'}: ${report.completedByName}`,
  ];
  if (!created) {
    lines.push(`Approved by: ${report.approvedByName || '—'}`);
    lines.push(`Photos: ${photoCount ?? 0}`);
    if (deviations) lines.push(`Deviations: ${deviations}`);
    if (report.approvalNote) lines.push('', 'Approval note:', report.approvalNote);
  }
  return lines.join('\n');
}

/**
 * @param {'created'|'approved'} event
 * @param files [{name,url}] — sent on approval so the Flow can copy them into
 *   the same OneDrive folder the filecard lives in.
 */
export async function notifyOpeningReport(report, { event, files = [], deviations = 0, photoCount = 0 } = {}) {
  const url = process.env.POWER_AUTOMATE_OPENING_REPORT_WEBHOOK;
  if (!url) return { sent: false, reason: 'POWER_AUTOMATE_OPENING_REPORT_WEBHOOK not set' };

  const { targetYear, targetRegion, targetProject, targetPath } = buildTargetPath({
    // The intake flow filed under the year of the desired opening date. The
    // due date is the closest match available after the fact; the report's own
    // opening date is the fallback.
    dates: [report.projectDueDate, report.openingDate],
    region: report.projectRegion,
    projectName: report.projectName || `${report.partnerName}, ${report.location}`,
  });

  const created = event === 'created';
  const body = {
    event,
    emailTo: process.env.OPENING_REPORT_EMAIL_TO || DEFAULT_RECIPIENTS,
    emailSubject: created
      ? `Opening report started: ${report.partnerName}, ${report.location}`
      : `Opening report approved: ${report.partnerName}, ${report.location}`,
    emailBody: buildText(report, { event, deviations, photoCount }),
    emailBodyHtml: buildHtml(report, { event, deviations, photoCount }),

    // OneDrive filing — same field names as the intake flow.
    projectName: report.projectName || '',
    asanaProjectId: report.asanaProjectId || '',
    targetYear,
    targetRegion,
    targetSubfolder: targetProject,
    targetPath,
    files,

    reportId: report.id,
    reportUrlSlug: report.reportUrlSlug,
    partnerName: report.partnerName,
    location: report.location,
    openingDate: report.openingDate || '',
    sqm: report.sqm ?? null,
    completedByName: report.completedByName,
    approvedByName: report.approvedByName || '',
    approvalNote: report.approvalNote || '',
    deviations,
    photoCount,
    status: report.status,
  };

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const hint =
        r.status === 401 || r.status === 403
          ? ' — the trigger URL is missing or has a stale sig= signature. Set "Who can trigger the flow?" to Anyone and re-copy the URL.'
          : '';
      return { sent: false, reason: `webhook returned ${r.status}${hint}` };
    }
    return { sent: true, targetPath };
  } catch (e) {
    return { sent: false, reason: e.message };
  }
}
