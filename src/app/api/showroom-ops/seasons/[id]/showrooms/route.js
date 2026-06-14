import { NextResponse } from 'next/server';
import { ensureConfiguredOr503 } from '../../../../../../lib/showroom-ops/db';
import { setSeasonShowroom, removeSeasonShowroom } from '../../../../../../lib/showroom-ops/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Upsert a showroom's participation in this season.
export async function PUT(request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  if (!body?.showroomId) return NextResponse.json({ error: 'showroomId is required' }, { status: 400 });
  try {
    const seasonShowroom = await setSeasonShowroom(params.id, body.showroomId, body);
    return NextResponse.json({ seasonShowroom });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  const url = new URL(request.url);
  const showroomId = url.searchParams.get('showroomId');
  if (!showroomId) return NextResponse.json({ error: 'showroomId is required' }, { status: 400 });
  try {
    await removeSeasonShowroom(params.id, showroomId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
