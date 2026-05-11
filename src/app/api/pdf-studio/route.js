import { processPdf } from '../../../lib/pdf-studio';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Allow drafts up to ~25 MB; pdf-lib is happy well above that, but we cap to
// keep Vercel function memory predictable.
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024;

function bad(message, status = 400, extra = {}) {
  return Response.json({ error: message, ...extra }, { status });
}

export async function POST(request) {
  let form;
  try {
    form = await request.formData();
  } catch (e) {
    return bad('Could not read form data');
  }

  const file = form.get('file');
  if (!file || typeof file === 'string') return bad('No PDF uploaded');
  if (file.type && file.type !== 'application/pdf') {
    return bad('Only PDF files are accepted');
  }
  if (file.size > MAX_BYTES) {
    return bad(`File too large (max ${Math.round(MAX_BYTES / 1024 / 1024)} MB)`, 413);
  }

  const flag = (name) => form.get(name) === 'true' || form.get(name) === 'on';
  const options = {
    replaceLogos: flag('replaceLogos'),
    updateContact: flag('updateContact'),
    appendZoning: flag('appendZoning'),
  };

  if (!options.replaceLogos && !options.updateContact && !options.appendZoning) {
    return bad('Select at least one operation');
  }

  let bytes, report;
  try {
    const inputBytes = new Uint8Array(await file.arrayBuffer());
    ({ bytes, report } = await processPdf(inputBytes, options));
  } catch (e) {
    return bad(`PDF processing failed: ${e.message || e}`, 500);
  }

  const sourceName = (file.name || 'document.pdf').replace(/\.pdf$/i, '');
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
