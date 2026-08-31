// Concept Requests → Power Automate → Outlook.
//
// Mail in this app goes through Power Automate, not a mail provider: the
// intake flow is the working precedent and the direct-provider helpers are
// still stubs. This uses its own webhook (and therefore its own Flow), because
// the intake flow also creates OneDrive folders — a shape that does not fit
// here.
//
// The webhook body is a STABLE CONTRACT. The Flow's dynamic-content picker is
// frozen at the schema generated when the sample payload was pasted, so
// renaming a field breaks the user's Flow. Treat it as an API.
//
// Delivery is best-effort: a failing webhook must never fail the submission.
// The request is already stored in Supabase, which is what the register reads.

const DEFAULT_RECIPIENTS = 'nicolaj.ostergaard@bestseller.com;ulrik.riisom@bestseller.com';

const TYPE_LABELS = {
  ADDITION: 'Addition — new element',
  CHANGE: 'Change — existing element',
  FEEDBACK: 'Feedback / problem',
  COST: 'Cost optimisation',
};

const URGENCY_LABELS = {
  NICE_TO_HAVE: 'Nice to have',
  UPCOMING_PROJECT: 'Needed for an upcoming project',
  BLOCKING: 'Blocking now',
};

export function buildEmailBody(req) {
  const lines = [
    `${TYPE_LABELS[req.type] || req.type}`,
    '',
    req.title,
    '',
  ];

  if (req.elementCode || req.elementName) {
    lines.push(`Element: ${[req.elementCode, req.elementName].filter(Boolean).join(' — ')}`);
  }
  lines.push(`Urgency: ${URGENCY_LABELS[req.urgency] || req.urgency}`);
  if (req.projectRef) lines.push(`Project: ${req.projectRef}`);
  lines.push('');

  if (req.description) lines.push('What is being asked for:', req.description, '');
  if (req.problem) lines.push('Problem it solves:', req.problem, '');

  const from = [req.submitterName, req.region, req.partner].filter(Boolean).join(' · ');
  lines.push(`From: ${from}${req.submitterEmail ? ` (${req.submitterEmail})` : ''}`);

  if (req.photos?.length) {
    lines.push('', `Attachments (${req.photos.length}):`);
    req.photos.forEach((p) => lines.push(p.name ? `${p.name} — ${p.url}` : p.url));
  }

  lines.push('', 'Triage this in Command Space → Concept Requests.');
  return lines.join('\n');
}

const URGENCY_COLOURS = {
  BLOCKING: '#C75B4A',
  UPCOMING_PROJECT: '#D4A843',
  NICE_TO_HAVE: '#8A8D8F',
};

/** Free-text fields come from a form, so they must never reach the mail raw. */
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const para = (s) => esc(s).replace(/\r?\n/g, '<br>');

/**
 * HTML body for Outlook. Table layout with inline styles throughout: Outlook
 * renders with Word's engine, where flexbox, grid and <style> blocks are
 * unreliable. Cormorant Garamond is not available to a mail client, so the
 * display face falls back to Georgia — the nearest web-safe serif.
 */
export function buildEmailHtml(req) {
  const urgencyColour = URGENCY_COLOURS[req.urgency] || '#8A8D8F';

  const factRow = (label, value) => `
              <tr>
                <td style="padding:7px 16px 7px 0;font:400 12px Helvetica,Arial,sans-serif;color:#8A8D8F;white-space:nowrap;vertical-align:top;">${esc(label)}</td>
                <td style="padding:7px 0;font:400 13px Helvetica,Arial,sans-serif;color:#2C2C2C;vertical-align:top;">${value}</td>
              </tr>`;

  const facts = [
    (req.elementCode || req.elementName)
      ? factRow('Element', `<span style="font-family:Consolas,'Courier New',monospace;color:#6B6B6B;">${esc(req.elementCode)}</span>&nbsp; ${esc(req.elementName)}`)
      : '',
    factRow('Urgency', `<span style="color:${urgencyColour};font-weight:600;">${esc(URGENCY_LABELS[req.urgency] || req.urgency)}</span>`),
    req.projectRef ? factRow('Project', esc(req.projectRef)) : '',
    factRow('From', [
      esc([req.submitterName, req.region, req.partner].filter(Boolean).join(' · ')),
      req.submitterEmail
        ? `<a href="mailto:${esc(req.submitterEmail)}" style="color:#6B6B6B;text-decoration:none;">${esc(req.submitterEmail)}</a>`
        : '',
    ].filter(Boolean).join('<br>')),
  ].filter(Boolean).join('');

  const section = (heading, value) => value ? `
          <tr><td style="padding:0 34px;">
            <div style="font:600 10px Helvetica,Arial,sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:#8A8D8F;padding-bottom:7px;">${esc(heading)}</div>
            <div style="font:400 14px/1.65 Helvetica,Arial,sans-serif;color:#2C2C2C;padding-bottom:24px;">${para(value)}</div>
          </td></tr>` : '';

  const attachments = req.photos?.length ? `
          <tr><td style="padding:0 34px 8px;">
            <div style="font:600 10px Helvetica,Arial,sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:#8A8D8F;padding-bottom:9px;">Attachments (${req.photos.length})</div>
            ${req.photos.map((p) => `<div style="padding-bottom:6px;"><a href="${esc(p.url)}" style="font:400 13px Helvetica,Arial,sans-serif;color:#C4944A;text-decoration:none;">${esc(p.name || 'Attachment')}</a></div>`).join('')}
          </td></tr>
          <tr><td style="padding:16px 34px 0;"></td></tr>` : '';

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F4F1;margin:0;padding:26px 0;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#FFFFFF;border:1px solid #ECEAE5;">

      <tr><td style="background-color:#C4944A;height:3px;line-height:3px;font-size:0;">&nbsp;</td></tr>

      <tr><td style="padding:30px 34px 0;">
        <div style="font:600 10px Helvetica,Arial,sans-serif;letter-spacing:1.6px;text-transform:uppercase;color:#8A8D8F;">Selected Frame &middot; Concept request</div>
        <div style="font:400 11px Helvetica,Arial,sans-serif;letter-spacing:0.8px;text-transform:uppercase;color:#C4944A;padding-top:14px;">${esc(TYPE_LABELS[req.type] || req.type)}</div>
        <div style="font:400 27px/1.28 Georgia,'Times New Roman',serif;color:#2C2C2C;padding:5px 0 22px;">${esc(req.title)}</div>
      </td></tr>

      <tr><td style="padding:0 34px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F4F1;border-left:2px solid #ECEAE5;">
          <tr><td style="padding:12px 18px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">${facts}
            </table>
          </td></tr>
        </table>
      </td></tr>

      ${section('What is being asked for', req.description)}
      ${section('Problem it solves', req.problem)}
      ${attachments}

      <tr><td style="padding:20px 34px 26px;border-top:1px solid #ECEAE5;">
        <div style="font:400 12px/1.6 Helvetica,Arial,sans-serif;color:#8A8D8F;">Triage this in Command Space &rarr; Concept Requests.</div>
      </td></tr>

    </table>
  </td></tr>
</table>`;
}

export function buildSubject(req) {
  const tag = { ADDITION: 'Addition', CHANGE: 'Change', FEEDBACK: 'Feedback', COST: 'Cost' }[req.type] || 'Request';
  return `Selected Frame concept — ${tag}: ${req.title}`;
}

export async function notifyConceptRequest(req) {
  const url = process.env.POWER_AUTOMATE_CONCEPT_REQUEST_WEBHOOK;
  if (!url) return { sent: false, reason: 'POWER_AUTOMATE_CONCEPT_REQUEST_WEBHOOK not set' };

  const body = {
    // Mail
    emailTo: process.env.CONCEPT_REQUEST_EMAIL_TO || DEFAULT_RECIPIENTS,
    emailSubject: buildSubject(req),
    emailBody: buildEmailBody(req),
    // Added after the Flow was first built, so it is not in the frozen
    // dynamic-content schema — the Flow reaches it with
    // triggerBody()?['emailBodyHtml'] until the schema is regenerated.
    // emailBody stays plain text so an un-updated Flow keeps working.
    emailBodyHtml: buildEmailHtml(req),
    // Fields, so the Flow can build its own layout if the plain body is not enough
    requestId: req.id,
    type: req.type,
    typeLabel: TYPE_LABELS[req.type] || req.type,
    title: req.title,
    description: req.description || '',
    problem: req.problem || '',
    elementCode: req.elementCode || '',
    elementName: req.elementName || '',
    urgency: req.urgency,
    urgencyLabel: URGENCY_LABELS[req.urgency] || req.urgency,
    projectRef: req.projectRef || '',
    submitterName: req.submitterName,
    submitterEmail: req.submitterEmail || '',
    region: req.region || '',
    partner: req.partner || '',
    photos: (req.photos || []).map((p) => ({ name: p.name || '', url: p.url })),
    submittedAt: req.createdAt,
  };

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      // 401/403 from Power Automate means the trigger URL's `sig=` signature
      // is missing, truncated or stale — not that the Flow rejected the body.
      // Say so, or the next person reads it as a payload problem.
      const hint =
        r.status === 401 || r.status === 403
          ? ' — the trigger URL is missing or has a stale sig= signature. Re-copy the full HTTP POST URL from the Flow and redeploy.'
          : '';
      return { sent: false, reason: `webhook returned ${r.status}${hint}` };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e.message };
  }
}
