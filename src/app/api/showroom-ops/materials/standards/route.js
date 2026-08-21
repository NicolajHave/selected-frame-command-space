import { NextResponse } from 'next/server';
import { ensureConfiguredOr503 } from '../../../../../lib/showroom-ops/db';
import { listMaterials, bulkInsertMaterials } from '../../../../../lib/showroom-ops/store';
import { STANDARD_MATERIALS, missingStandardMaterials } from '../../../../../lib/showroom-ops/standard-materials';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Which of the recurring boards are not in the catalog yet.
export async function GET() {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  try {
    const existing = await listMaterials();
    return NextResponse.json({
      missing: missingStandardMaterials(existing).map((m) => m.name),
      total: STANDARD_MATERIALS.length,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Add only the ones that are missing, so this is safe to press twice and never
// overwrites a board whose defaults have been adjusted.
export async function POST() {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  try {
    const existing = await listMaterials();
    const missing = missingStandardMaterials(existing);
    if (!missing.length) return NextResponse.json({ added: 0, names: [] });
    await bulkInsertMaterials(missing);
    return NextResponse.json({ added: missing.length, names: missing.map((m) => m.name) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
