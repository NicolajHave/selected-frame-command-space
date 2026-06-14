import { NextResponse } from 'next/server';
import { ensureConfiguredOr503 } from '../../../../../../lib/showroom-ops/db';
import { duplicateSeason } from '../../../../../../lib/showroom-ops/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  if (!body?.name || !body?.code) return NextResponse.json({ error: 'name and code are required' }, { status: 400 });
  try {
    const season = await duplicateSeason(params.id, body);
    if (!season) return NextResponse.json({ error: 'Source season not found' }, { status: 404 });
    return NextResponse.json({ season });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
