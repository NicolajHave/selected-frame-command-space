import { del, put } from '@vercel/blob';
import { processPdf } from '../../../lib/pdf-studio';
import { requireAccess } from '../../../lib/external-folders/auth';
import {
  getExternalFolderById,
  recordExternalFolderFile,
  nextDraftNumber,
  isConfigured as foldersConfigured,
} from '../../../lib/external-folders/folders';

// Drafts are layout documents, so they land alongside the floorplans.
const DRAFT_CATEGORY = '02-floorplans';

function safeFilePart(s, fallback = 'Project') {
  return (
    String(s || '')
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\.+$/, '')
      .slice(0, 100) || fallback
  );
}

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
    addInfoPage = false,
    infoNotes = '',
    infoImageUrl = null,
    folderId = null,
  } = payload || {};

  if (!blobUrl || typeof blobUrl !== 'string') return bad('Missing blobUrl');
  if (!replaceLogos && !updateContact && !appendZoning && !addInfoPage) {
    return bad('Select at least one operation');
  }

  // Filing into a project folder is gated by the same shared password as the
  // rest of External Folders. Processing without a folder stays open.
  let folder = null;
  if (folderId) {
    try { requireAccess(); } catch (r) { return r; }
    if (!foldersConfigured()) return bad('Supabase is not configured', 503);
    folder = await getExternalFolderById(folderId);
    if (!folder) return bad('Folder not found', 404);
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

  // The optional picture for the info page comes the same way as the PDF:
  // uploaded to Blob by the browser, fetched here. Losing it must not lose
  // the draft — it degrades to a page without a picture, and says so.
  let infoImageBytes = null;
  if (addInfoPage && infoImageUrl && typeof infoImageUrl === 'string') {
    try {
      const res = await fetch(infoImageUrl);
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const ab = await res.arrayBuffer();
      if (ab.byteLength > 15 * 1024 * 1024) throw new Error('image over 15 MB');
      infoImageBytes = new Uint8Array(ab);
    } catch (e) {
      infoImageBytes = null;
      payload._imageWarning = `Info page image was skipped (${e.message})`;
    }
  }

  let bytes, report;
  try {
    ({ bytes, report } = await processPdf(inputBytes, {
      replaceLogos,
      updateContact,
      appendZoning,
      addInfoPage,
      infoNotes: typeof infoNotes === 'string' ? infoNotes.slice(0, 4000) : '',
      infoImageBytes,
    }));
    if (payload._imageWarning) report.warnings.push(payload._imageWarning);
  } catch (e) {
    return bad(`PDF processing failed: ${e.message || e}`, 500);
  }

  // Clean up the uploads — they have served their purpose.
  for (const url of [blobUrl, infoImageUrl]) {
    if (!url) continue;
    try {
      await del(url);
    } catch {
      // Non-fatal: blob will expire on its own retention policy.
    }
  }

  const sourceName = (filename || 'document.pdf').replace(/\.pdf$/i, '');
  let outName = `${sourceName}__selected-frame.pdf`;
  let filed = null;

  // File into the project folder, renaming to "<project> - Draft N.pdf".
  if (folder) {
    try {
      const draftNumber = await nextDraftNumber(folder.id);
      const label = `${safeFilePart(folder.projectName)} - Draft ${draftNumber}`;
      outName = `${label}.pdf`;
      const dest = `${folder.blobPrefix}${DRAFT_CATEGORY}/${Date.now()}-${label.replace(/\s+/g, '_')}.pdf`;
      const stored = await put(dest, Buffer.from(bytes), {
        access: 'public',
        contentType: 'application/pdf',
      });
      await recordExternalFolderFile({
        folderId: folder.id,
        fileName: dest.split('/').pop(),
        originalName: outName,
        fileType: 'application/pdf',
        fileSize: bytes.length,
        blobUrl: stored.url,
        blobPath: stored.pathname,
        category: DRAFT_CATEGORY,
      });
      filed = { folderName: folder.projectName, fileName: outName, draftNumber, category: DRAFT_CATEGORY };
    } catch (e) {
      // Never lose the processed PDF over a filing failure — return it and say
      // what went wrong.
      filed = { error: e.message || 'Could not file into folder' };
    }
  }

  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${outName}"`,
      'X-PDF-Studio-Report': encodeURIComponent(JSON.stringify(report)),
      ...(filed ? { 'X-PDF-Studio-Filed': encodeURIComponent(JSON.stringify(filed)) } : {}),
      'Cache-Control': 'no-store',
    },
  });
}
