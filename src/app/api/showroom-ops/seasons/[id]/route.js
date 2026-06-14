import { NextResponse } from 'next/server';
import { ensureConfiguredOr503 } from '../../../../../lib/showroom-ops/db';
import { getSeasonDetail, updateSeason, deleteSeason } from '../../../../../lib/showroom-ops/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  try {
    const detail = await getSeasonDetail(params.id);
    if (!detail) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(detail);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  try {
    const season = await updateSeason(params.id, body || {});
    if (!season) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ season });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  try {
    await deleteSeason(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
