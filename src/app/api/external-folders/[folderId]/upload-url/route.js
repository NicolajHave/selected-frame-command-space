// Browser-direct upload to Vercel Blob (bypasses the 4.5 MB function body cap).
// We sign a short-lived token, the browser PUTs the file directly to Blob, then
// records the file via /files. The DB-known folder id is interpolated into the
// allowed prefix so a token can't be reused against a different folder.

import { handleUpload } from '@vercel/blob/client';
import { requireAccess } from '../../../../../lib/external-folders/auth';
import { getExternalFolderById, isConfigured } from '../../../../../lib/external-folders/folders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try { requireAccess(); } catch (r) { return r; }
  if (!isConfigured()) return new Response(JSON.stringify({ error: 'DB_NOT_CONFIGURED' }), { status: 503 });
  const folder = await getExternalFolderById(params.folderId);
  if (!folder) return new Response(JSON.stringify({ error: 'Folder not found' }), { status: 404 });

  const body = await request.json();
  try {
    const jsonResponse = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(folder.blobPrefix)) {
          throw new Error(`Invalid upload path. Must start with ${folder.blobPrefix}`);
        }
        return {
          allowedContentTypes: ['*/*'],
          maximumSizeInBytes: 200 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ folderId: folder.id }),
        };
      },
      onUploadCompleted: async () => {
        // No-op: the file row is created via POST /files after the client has
        // the blob URL.
      },
    });
    return Response.json(jsonResponse);
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Upload failed' }), { status: 400 });
  }
}
