import { NextResponse } from 'next/server';
import { ensureConfiguredOr503 } from '../../../../lib/showroom-ops/db';
import { bulkInsertShowrooms, bulkInsertMaterials, listShowrooms, listMaterials } from '../../../../lib/showroom-ops/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Bulk import endpoint used by the Registry Admin xlsx importer. The browser
// parses SELECTED_SHOWROOM_MASTER_REGISTRY.xlsx (SheetJS, loaded from CDN) and
// posts already-mapped row arrays. Insert-only; refuses to run if the target
// table already has rows unless { force: true } is set.
export async function POST(request) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  const { showrooms = [], materials = [], force = false } = body || {};

  try {
    const result = {};
    if (showrooms.length) {
      const existing = await listShowrooms();
      if (existing.length && !force) {
        return NextResponse.json({ error: `showrooms already has ${existing.length} rows. Re-run with force to add anyway.`, code: 'NOT_EMPTY' }, { status: 409 });
      }
      result.showroomsInserted = await bulkInsertShowrooms(showrooms);
    }
    if (materials.length) {
      const existing = await listMaterials();
      if (existing.length && !force) {
        return NextResponse.json({ error: `materials already has ${existing.length} rows. Re-run with force to add anyway.`, code: 'NOT_EMPTY' }, { status: 409 });
      }
      result.materialsInserted = await bulkInsertMaterials(materials);
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
