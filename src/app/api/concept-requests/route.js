import { NextResponse } from 'next/server';
import { ensureConfiguredOr503 } from '../../../lib/external-folders/db';
import { listConceptRequests, createConceptRequest } from '../../../lib/concept-requests/requests';
import { notifyConceptRequest } from '../../../lib/concept-requests/notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  try {
    return NextResponse.json({ requests: await listConceptRequests() });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  try {
    const payload = await request.json();

    const submitterName = String(payload.submitterName || '').trim();
    const title = String(payload.title || '').trim();
    if (!submitterName) return NextResponse.json({ error: 'Your name is required' }, { status: 400 });
    if (!title) return NextResponse.json({ error: 'A title is required' }, { status: 400 });

    const created = await createConceptRequest({ ...payload, submitterName, title });

    // Best-effort: the request is stored, so a failing webhook must not fail
    // the submission. The outcome is reported back instead.
    const mail = await notifyConceptRequest(created);

    return NextResponse.json({ request: created, mail });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
