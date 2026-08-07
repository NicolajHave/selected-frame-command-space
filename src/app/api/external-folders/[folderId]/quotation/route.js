// Store a generated quotation PDF in a project's External Folder.
//
// The browser posts the quotation data; the server renders the PDF with
// pdf-lib, uploads it to Vercel Blob under the folder's prefix and records it
// as an 03-quotation file. Returns the blob URL so the client can also hand
// the very same bytes to the user as a download — one renderer, one document.

import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requireAccess } from '../../../../../lib/external-folders/auth';
import {
  getExternalFolderById,
  recordExternalFolderFile,
  isConfigured,
} from '../../../../../lib/external-folders/folders';
import { buildQuotationPdf } from '../../../../../lib/quotation-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CATEGORY = '03-quotation';

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

export async function POST(request, { params }) {
  try { requireAccess(); } catch (r) { return r; }
  if (!isConfigured()) return NextResponse.json({ error: 'DB_NOT_CONFIGURED' }, { status: 503 });

  const folder = await getExternalFolderById(params.folderId);
  if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  try {
    const bytes = await buildQuotationPdf(body || {});
    const label = safeFileName(body?.header?.project || folder.projectName);
    const stamp = new Date().toISOString().slice(0, 10);
    const fileName = `Quotation - ${label} - ${stamp}.pdf`;
    const dest = `${folder.blobPrefix}${CATEGORY}/${Date.now()}-${fileName.replace(/\s+/g, '_')}`;

    const blob = await put(dest, Buffer.from(bytes), {
      access: 'public',
      contentType: 'application/pdf',
    });

    const file = await recordExternalFolderFile({
      folderId: folder.id,
      fileName: dest.split('/').pop(),
      originalName: fileName,
      fileType: 'application/pdf',
      fileSize: bytes.length,
      blobUrl: blob.url,
      blobPath: blob.pathname,
      category: CATEGORY,
    });

    return NextResponse.json({ file, url: blob.url, folderName: folder.projectName });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Failed to store quotation' }, { status: 500 });
  }
}
