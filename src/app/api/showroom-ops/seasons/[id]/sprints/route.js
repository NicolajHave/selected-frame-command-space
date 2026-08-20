import { NextResponse } from 'next/server';
import { ensureConfiguredOr503 } from '../../../../../../lib/showroom-ops/db';
import { listSeasonSprints, createSeasonSprint } from '../../../../../../lib/showroom-ops/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  try { return NextResponse.json({ sprints: await listSeasonSprints(params.id) }); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  let body = {};
  try { body = await request.json(); } catch { /* name defaults to Sprint N */ }
  try { return NextResponse.json({ sprint: await createSeasonSprint(params.id, body || {}) }); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
