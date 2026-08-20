import { NextResponse } from 'next/server';
import { ensureConfiguredOr503 } from '../../../../../../lib/showroom-ops/db';
import { getSeasonCustomisations } from '../../../../../../lib/showroom-ops/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// What the ticked showrooms pull in for this season: one row per showroom ×
// gender × standing customisation. Feeds the graphics sheet and shows the
// buyer what rides along with each package.
export async function GET(_request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  try {
    const data = await getSeasonCustomisations(params.id);
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
