import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getPromo, updatePromo } from '@/lib/promo';

// Client-upload flow: the browser POSTs a small JSON body here to obtain a
// presigned token, then uploads the file directly to Vercel Blob storage.
// This bypasses the platform's ~4.5 MB serverless request body limit (which
// was causing 413 errors on legitimately-sized images).
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const promo = await getPromo();
  if (!promo) {
    return NextResponse.json(
      { error: 'Save the promo first before uploading an image.' },
      { status: 400 },
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      token: process.env.Images_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        maximumSizeInBytes: 10 * 1024 * 1024, // 10 MB
        addRandomSuffix: false,
        allowOverwrite: true,
        tokenPayload: JSON.stringify({ promoId: promo.id }),
      }),
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Fires from a Vercel Blob webhook in production. Won't reach
        // localhost in dev — the client also PATCHes below as a fallback.
        try {
          const payload = JSON.parse(tokenPayload || '{}') as { promoId?: string };
          if (payload.promoId) {
            await updatePromo(payload.promoId, {
              imageSrc: blob.url,
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.error('promo image onUploadCompleted failed', err);
        }
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

// Called by the client after a successful direct-to-blob upload to persist
// the resulting URL on the active promo (also acts as a dev fallback for the
// onUploadCompleted webhook, which can't reach localhost).
export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const promo = await getPromo();
  if (!promo) {
    return NextResponse.json({ error: 'No active promo.' }, { status: 400 });
  }

  const { url } = (await request.json()) as { url?: string };
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Missing url.' }, { status: 400 });
  }

  await updatePromo(promo.id, {
    imageSrc: url,
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ success: true, url });
}
