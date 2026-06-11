import { NextResponse } from 'next/server';
import { ensureConfiguredOr503 } from '../../../../../../lib/showroom-ops/db';
import { createLine } from '../../../../../../lib/showroom-ops/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  try {
    const line = await createLine(params.id, body || {});
    return NextResponse.json({ line });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
