// Renders a quotation PDF for download without filing it anywhere.
//
// The same renderer as the folder route, so a downloaded quotation and a
// filed one are the same document — and both carry their own data, which is
// what lets the Quotation Builder open either of them again later. Nothing is
// stored, so this route needs no folder access: it renders what it is sent.

import { buildQuotationPdf } from '../../../../lib/quotation-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeFileName(s) {
  return (
    String(s || 'Quotation')
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\.+$/, '')
      .slice(0, 100) || 'Quotation'
  );
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid body' }, { status: 400 }); }

  try {
    const bytes = await buildQuotationPdf(body || {});
    const stamp = new Date().toISOString().slice(0, 10);
    const fileName = `Quotation - ${safeFileName(body?.header?.project)} - ${stamp}.pdf`;
    return new Response(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return Response.json({ error: e.message || 'Failed to render quotation' }, { status: 500 });
  }
}
