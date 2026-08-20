import { NextResponse } from 'next/server';
import { ensureConfiguredOr503 } from '../../../../lib/showroom-ops/db';
import { listShowroomMaterials, createShowroomMaterial } from '../../../../lib/showroom-ops/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  const showroomId = new URL(request.url).searchParams.get('showroomId') || null;
  try {
    return NextResponse.json({ materials: await listShowroomMaterials(showroomId) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  if (!body?.showroomId) return NextResponse.json({ error: 'showroomId is required' }, { status: 400 });
  if (!body?.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
  try {
    return NextResponse.json({ material: await createShowroomMaterial(body) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
