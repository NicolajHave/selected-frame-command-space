import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { ensureConfiguredOr503 } from '../../../../lib/external-folders/db';
import {
  getConceptRequest,
  updateConceptRequest,
  deleteConceptRequest,
} from '../../../../lib/concept-requests/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  try {
    const req = await getConceptRequest(params.id);
    if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ request: req });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  try {
    const patch = await request.json();
    return NextResponse.json({ request: await updateConceptRequest(params.id, patch) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  try {
    const req = await getConceptRequest(params.id);
    if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Blobs first, then the row: the row holds the only pointers to those
    // blobs, so the reverse order orphans the storage with no way to find it.
    for (const photo of req.photos || []) {
      if (!photo?.url) continue;
      try {
        await del(photo.url);
      } catch {
        // Best-effort: a blob that is already gone must not block the delete.
      }
    }

    await deleteConceptRequest(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
