import { del } from '@vercel/blob';
import { processPdf } from '../../../lib/pdf-studio';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_BYTES = 50 * 1024 * 1024;

function bad(message, status = 400, extra = {}) {
  return Response.json({ error: message, ...extra }, { status });
}

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return bad('Invalid JSON body');
  }

  const {
    blobUrl,
    filename,
    replaceLogos = false,
    updateContact = false,
    appendZoning = false,
  } = payload || {};

  if (!blobUrl || typeof blobUrl !== 'string') return bad('Missing blobUrl');
  if (!replaceLogos && !updateContact && !appendZoning) {
    return bad('Select at least one operation');
  }

  // Fetch the uploaded PDF from Vercel Blob.
  let inputBytes;
  try {
    const res = await fetch(blobUrl);
    if (!res.ok) return bad(`Could not fetch uploaded file (${res.status})`);
    const contentLength = Number(res.headers.get('content-length') || 0);
    if (contentLength > MAX_BYTES) return bad('File too large', 413);
    const ab = await res.arrayBuffer();
    if (ab.byteLength > MAX_BYTES) return bad('File too large', 413);
    inputBytes = new Uint8Array(ab);
  } catch (e) {
    return bad(`Fetch failed: ${e.message || e}`, 502);
  }

  let bytes, report;
  try {
    ({ bytes, report } = await processPdf(inputBytes, {
      replaceLogos,
      updateContact,
      appendZoning,
    }));
  } catch (e) {
    return bad(`PDF processing failed: ${e.message || e}`, 500);
  }

  // Clean up the upload — it has served its purpose.
  try {
    await del(blobUrl);
  } catch {
    // Non-fatal: blob will expire on its own retention policy.
  }

  const sourceName = (filename || 'document.pdf').replace(/\.pdf$/i, '');
  const outName = `${sourceName}__selected-frame.pdf`;

  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${outName}"`,
      'X-PDF-Studio-Report': encodeURIComponent(JSON.stringify(report)),
      'Cache-Control': 'no-store',
    },
  });
}
