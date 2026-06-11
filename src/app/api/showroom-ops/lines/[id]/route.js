import { NextResponse } from 'next/server';
import { ensureConfiguredOr503 } from '../../../../../lib/showroom-ops/db';
import { updateLine, deleteLine } from '../../../../../lib/showroom-ops/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  try {
    const line = await updateLine(params.id, body || {});
    if (!line) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ line });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  try {
    await deleteLine(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
