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
