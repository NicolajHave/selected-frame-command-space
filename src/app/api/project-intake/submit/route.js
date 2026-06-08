// Project Intake submission — V1.
//
// Flow:
//   1. Validate the payload server-side (defence in depth; the client also
//      validates).
//   2. Build the human-readable filecard summary.
//   3. Best-effort fan-out to whatever integrations are configured:
//        - email summary  (PROJECT_INTAKE_EMAIL_TO + email provider)
//        - Power Automate  (POWER_AUTOMATE_PROJECT_INTAKE_WEBHOOK)
//        - Asana           (ASANA_PROJECT_INTAKE_PROJECT_ID + ASANA_PAT)
//      Each is optional; missing config is logged, not fatal.
//   4. Always log the structured payload + summary server-side so nothing is
//      lost while integrations are still being wired up.
//   5. Return the summary so the client can show it on the confirmation screen.

import { NextResponse } from 'next/server';
import { buildFilecardSummary } from '../../../../lib/project-intake/payload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function validate(payload) {
  const errs = [];
  const pb = payload?.projectBasics || {};
  const pl = payload?.partnerLocation || {};
  const ct = payload?.contact || {};
  if (!pb.projectName) errs.push('Project name');
  if (!pb.yourName) errs.push('Your name');
  if (!pb.desiredOpeningDate) errs.push('Desired opening date');
  if (!pb.marketRegion) errs.push('Market / Region');
  if (!pl.partnerName) errs.push('Partner name');
  if (!ct.email) errs.push('Contact e-mail');
  return errs;
}

async function notifyEmail(summary, payload) {
  const to = process.env.PROJECT_INTAKE_EMAIL_TO;
  if (!to) return { sent: false, reason: 'PROJECT_INTAKE_EMAIL_TO not set' };
  // Provider not wired in V1. When you pick one (Resend/SendGrid/M365),
  // implement the send here using its API key from env. We log so the data
  // is never lost in the meantime.
  // eslint-disable-next-line no-console
  console.log('[project-intake] email summary (stub) →', to, '\n', summary);
  return { sent: false, reason: 'provider_not_configured' };
}

async function notifyPowerAutomate(payload, summary) {
  const url = process.env.POWER_AUTOMATE_PROJECT_INTAKE_WEBHOOK;
  if (!url) return { sent: false, reason: 'webhook not set' };
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, summary }),
    });
    return { sent: r.ok, status: r.status };
  } catch (e) {
    return { sent: false, reason: e.message };
  }
}

function asanaPayloadPreview(payload, summary) {
  // Structure prepared for a future Asana task creation. Not sent in V1
  // unless both env vars are present AND we choose to enable it.
  return {
    projectId: process.env.ASANA_PROJECT_INTAKE_PROJECT_ID || null,
    name: payload.projectBasics.projectName,
    notes: summary,
    ready: Boolean(process.env.ASANA_PROJECT_INTAKE_PROJECT_ID && process.env.ASANA_PAT),
  };
}

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const errs = validate(payload);
  if (errs.length) {
    return NextResponse.json({ error: `Missing required fields: ${errs.join(', ')}` }, { status: 400 });
  }

  const summary = buildFilecardSummary(payload);

  // Always capture server-side so nothing is lost pre-integration.
  // eslint-disable-next-line no-console
  console.log('[project-intake] new submission\n', summary, '\nderivedFlags:', payload.derivedFlags);

  const integrations = {
    email: await notifyEmail(summary, payload),
    powerAutomate: await notifyPowerAutomate(payload, summary),
    asana: asanaPayloadPreview(payload, summary),
  };

  return NextResponse.json({
    ok: true,
    summary,
    softShop: Boolean(payload?.derivedFlags?.isSoftShopLikely),
    integrations,
  });
}
