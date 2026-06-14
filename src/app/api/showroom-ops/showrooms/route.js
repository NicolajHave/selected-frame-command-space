import { NextResponse } from 'next/server';
import { ensureConfiguredOr503 } from '../../../../lib/showroom-ops/db';
import { listShowrooms, createShowroom } from '../../../../lib/showroom-ops/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  try {
    return NextResponse.json({ showrooms: await listShowrooms() });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  if (!body?.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
  try {
    return NextResponse.json({ showroom: await createShowroom(body) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
