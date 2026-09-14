// Reads an older Selected Frame quotation back from its printed text.
//
// Only reached for documents from before the data was embedded in the PDF;
// newer ones are restored exactly in the browser from their metadata and never
// come here. The browser extracts the lines with pdf.js (the same grouping the
// supplier parser uses) and posts them.

import { parseSelectedFrameQuotation } from '../../../../lib/quotation-reopen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid body' }, { status: 400 }); }
  const lines = Array.isArray(body?.lines) ? body.lines.slice(0, 5000) : null;
  if (!lines) return Response.json({ error: 'Missing lines' }, { status: 400 });

  try {
    return Response.json(parseSelectedFrameQuotation(lines));
  } catch (e) {
    return Response.json({ error: e.message || 'Could not read this quotation' }, { status: 422 });
  }
}
