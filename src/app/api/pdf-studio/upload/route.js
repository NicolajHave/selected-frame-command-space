import { handleUpload } from '@vercel/blob/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Client-upload endpoint. The browser asks this route for a short-lived
// upload token, then PUTs the file directly to Vercel Blob — bypassing the
// 4.5 MB serverless function body limit. The processing endpoint receives
// just the resulting blob URL.

export async function POST(request) {
  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        // Only allow uploads under a known prefix. The PDF being processed
        // and the optional picture for the concept information page both
        // come through here — Blob refuses any type not listed, so the image
        // types have to be on this list, not just on the file input.
        if (!pathname.startsWith('pdf-studio/')) {
          throw new Error('Invalid upload path');
        }
        return {
          allowedContentTypes: ['application/pdf', 'image/jpeg', 'image/png'],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50 MB hard cap
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // No-op: processing happens in a separate request once the client
        // has the public blob URL.
      },
    });
    return Response.json(jsonResponse);
  } catch (e) {
    return Response.json({ error: e.message || 'Upload failed' }, { status: 400 });
  }
}
