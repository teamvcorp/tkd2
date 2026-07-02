import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

// Client-upload flow: the browser POSTs a small JSON body here to obtain a
// presigned token, then uploads the file directly to Vercel Blob storage. This
// bypasses the platform's ~4.5 MB serverless request body limit — essential for
// hero MP4s, which routinely exceed it.
//
// The resulting URL is persisted by the browser via POST /api/admin/hero (which
// saves the whole config). onUploadCompleted only fires from a Vercel Blob
// webhook in production and can't reach localhost, so we don't rely on it here.
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      token: process.env.Images_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          'image/jpeg', 'image/png', 'image/webp', 'image/gif',
          'video/mp4', 'video/webm', 'video/quicktime', 'video/ogg',
        ],
        maximumSizeInBytes: 100 * 1024 * 1024, // 100 MB — hero videos run large
        addRandomSuffix: true,
        allowOverwrite: false,
      }),
      onUploadCompleted: async () => {
        // No-op: the browser persists the new item onto the hero config via
        // POST /api/admin/hero. (This webhook doesn't reach localhost in dev.)
      },
    });
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 400 },
    );
  }
}
