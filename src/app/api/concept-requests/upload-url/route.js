// Browser-direct upload to Vercel Blob for concept-request photos.
//
// Unlike Opening Reports, photos are uploaded BEFORE the row exists: that way
// one POST creates the request and fires one webhook carrying the photo links,
// instead of a create → upload → patch → notify dance where a failure halfway
// leaves a request whose mail lists no photos. The token is therefore scoped
// to the shared `concept-requests/` prefix rather than to a row.

import { handleUpload } from '@vercel/blob/client';
import { ensureConfiguredOr503 } from '../../../../lib/external-folders/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PREFIX = 'concept-requests/';

export async function POST(request) {
  try { ensureConfiguredOr503(); } catch (r) { return r; }

  const body = await request.json();
  try {
    const jsonResponse = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(PREFIX)) {
          throw new Error(`Invalid upload path. Must start with ${PREFIX}`);
        }
        return {
          // PDFs as well as photos: a request often comes with a drawing or a
          // spec sheet, and Blob rejects anything not listed here outright.
          allowedContentTypes: [
            'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
            'application/pdf',
          ],
          maximumSizeInBytes: 25 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // The photo pointers are stored with the request on POST.
      },
    });
    return Response.json(jsonResponse);
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Upload failed' }), { status: 400 });
  }
}
