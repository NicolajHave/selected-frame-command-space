// Browser-direct upload to Vercel Blob for Project Intake attachments.
// Files land under project-intake/<sessionId>/<group>/. No DB row is created
// here — the file metadata travels with the intake submission payload.

import { handleUpload } from '@vercel/blob/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json();
  try {
    const jsonResponse = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith('project-intake/')) {
          throw new Error('Invalid upload path');
        }
        return {
          // Folder is internal; accept arbitrary partner material (DWG/DXF
          // often arrive without a reliable content type).
          maximumSizeInBytes: 200 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return Response.json(jsonResponse);
  } catch (e) {
    return Response.json({ error: e.message || 'Upload failed' }, { status: 400 });
  }
}
