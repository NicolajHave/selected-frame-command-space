// Browser-direct upload to Vercel Blob. Mirrors the External Folders pattern
// (src/app/api/external-folders/[folderId]/upload-url/route.js): we sign a
// short-lived token scoped to the report's blob prefix, the browser PUTs the
// file straight to Blob, then records the photo via POST /photos.

import { handleUpload } from '@vercel/blob/client';
import { ensureConfiguredOr503 } from '../../../../../../lib/external-folders/db';
import { getOpeningReportBySlug } from '../../../../../../lib/opening-reports/reports';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }
  const report = await getOpeningReportBySlug(params.slug);
  if (!report) return new Response(JSON.stringify({ error: 'Report not found' }), { status: 404 });

  const body = await request.json();
  try {
    const jsonResponse = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(report.blobPrefix)) {
          throw new Error(`Invalid upload path. Must start with ${report.blobPrefix}`);
        }
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
          maximumSizeInBytes: 25 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ reportId: report.id }),
        };
      },
      onUploadCompleted: async () => {
        // The photo row is created via POST /photos after the client has the
        // blob URL — matches External Folders.
      },
    });
    return Response.json(jsonResponse);
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Upload failed' }), { status: 400 });
  }
}
