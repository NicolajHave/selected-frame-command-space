import { NextResponse } from 'next/server';
import { ensureConfiguredOr503 } from '../../../../../../lib/showroom-ops/db';
import { importSalesList } from '../../../../../../lib/showroom-ops/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The browser parses the sales list (SheetJS from CDN) and posts the mapped
// rows. Matching happens server-side against the registry, keyed on customer
// number.
export async function POST(request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  const { gender, rows, createMissing } = body || {};
  if (!Array.isArray(rows) || !rows.length) {
    return NextResponse.json({ error: 'rows is required' }, { status: 400 });
  }
  try {
    const result = await importSalesList(params.id, { gender, rows, createMissing: !!createMissing });
    if (!result) return NextResponse.json({ error: 'Season not found' }, { status: 404 });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Import failed' }, { status: 500 });
  }
}
