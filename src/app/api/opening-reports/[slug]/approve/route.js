import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { ensureConfiguredOr503 } from '../../../../../lib/external-folders/db';
import {
  approveOpeningReport,
  getOpeningReportWithChildren,
  setOpeningReportPdf,
} from '../../../../../lib/opening-reports/reports';
import { ensureAdminCodeOr403 } from '../../../../../lib/opening-reports/admin-code';
import { buildOpeningReportPdf, openingReportPdfName } from '../../../../../lib/opening-reports/report-pdf';
import { notifyOpeningReport } from '../../../../../lib/opening-reports/notify';
import {
  createExternalFolder,
  getExternalFolderByAsanaProjectId,
  recordExternalFolderFile,
} from '../../../../../lib/external-folders/folders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Approval is where the report becomes a record: it is generated as a PDF,
 * filed into the project's External Folder, and handed to Power Automate to
 * land in the same OneDrive folder as the filecard.
 *
 * Everything after the approval itself is BEST-EFFORT. The approval is what
 * the user asked for and it is already committed; a PDF, a folder or a webhook
 * failing must not undo it or return an error. Each outcome is reported back
 * so the UI can say what did and did not happen.
 */
export async function POST(request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  const { approvedByName, approvalNote, code } = body || {};
  try { ensureAdminCodeOr403(code); } catch (r) { return r; }
  if (!approvedByName) return NextResponse.json({ error: 'approvedByName is required' }, { status: 400 });

  let data;
  try {
    data = await approveOpeningReport(params.slug, { approvedByName, approvalNote });
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Failed to approve' }, { status: 500 });
  }

  const filing = { pdf: null, externalFolder: null, powerAutomate: null };

  // ── 1. The report as a PDF ─────────────────────────────────────────────────
  let pdfUrl = null;
  const pdfName = openingReportPdfName(data.report);
  try {
    const { bytes, skippedPhotos } = await buildOpeningReportPdf(data);
    const blob = await put(`${data.report.blobPrefix}${pdfName}`, Buffer.from(bytes), {
      access: 'public',
      contentType: 'application/pdf',
      addRandomSuffix: true,
    });
    pdfUrl = blob.url;
    await setOpeningReportPdf(data.report.id, { url: blob.url, path: blob.pathname });
    filing.pdf = { ok: true, url: blob.url, skippedPhotos };
  } catch (e) {
    filing.pdf = { ok: false, reason: e.message };
  }

  // ── 2. Into the project's External Folder ──────────────────────────────────
  // Created if missing, so filing works whether or not someone set the folder
  // up beforehand. createExternalFolder returns the existing one if there is.
  if (data.report.asanaProjectId) {
    try {
      const folder =
        (await getExternalFolderByAsanaProjectId(data.report.asanaProjectId)) ||
        (await createExternalFolder({
          asanaProjectId: data.report.asanaProjectId,
          projectName: data.report.projectName || `${data.report.partnerName}, ${data.report.location}`,
          region: data.report.projectRegion,
          dueDate: data.report.projectDueDate,
        }));

      const filed = [];
      if (pdfUrl) {
        filed.push(await recordExternalFolderFile({
          folderId: folder.id,
          fileName: pdfName,
          originalName: pdfName,
          fileType: 'application/pdf',
          fileSize: 0,
          blobUrl: pdfUrl,
          blobPath: `${data.report.blobPrefix}${pdfName}`,
          uploadedByName: approvedByName,
          // The folder's categories are a fixed list (see CATEGORIES in
          // external-project-folders/ui.js); an invented one would render as
          // an unknown group. The report is the handover record, its images
          // belong with the other photos.
          category: '07-handover',
        }));
      }
      for (const photo of data.photos || []) {
        filed.push(await recordExternalFolderFile({
          folderId: folder.id,
          fileName: photo.fileName,
          originalName: photo.fileName,
          fileType: 'image',
          fileSize: 0,
          blobUrl: photo.blobUrl,
          blobPath: photo.blobPath,
          uploadedByName: approvedByName,
          category: '06-photos',
        }));
      }
      filing.externalFolder = { ok: true, folderId: folder.id, files: filed.length };
    } catch (e) {
      filing.externalFolder = { ok: false, reason: e.message };
    }
  } else {
    filing.externalFolder = { ok: false, reason: 'no project linked to this report' };
  }

  // ── 3. Mail + OneDrive ─────────────────────────────────────────────────────
  const files = [
    ...(pdfUrl ? [{ name: pdfName, url: pdfUrl }] : []),
    ...(data.photos || []).map((p) => ({ name: p.fileName, url: p.blobUrl })),
  ];
  const deviations = (data.checkpoints || []).filter((c) => c.result === 'deviation').length;
  filing.powerAutomate = await notifyOpeningReport(
    { ...data.report, reportPdfUrl: pdfUrl },
    { event: 'approved', files, deviations, photoCount: (data.photos || []).length },
  );

  const fresh = await getOpeningReportWithChildren(params.slug);
  return NextResponse.json({ ...(fresh || data), filing });
}
