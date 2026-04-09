import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { put } from '@vercel/blob';
import { getPromo, updatePromo } from '@/lib/promo';

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

  const formData = await request.formData();
  const file = formData.get('image') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No image provided.' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image.' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be under 5 MB.' }, { status: 400 });
  }

  const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const blob = await put(`promo-images/${promo.id}.${ext}`, file, {
    access: 'public',
    contentType: file.type,
    allowOverwrite: true,
    token: process.env.Images_READ_WRITE_TOKEN,
  });

  await updatePromo(promo.id, { imageSrc: blob.url, updatedAt: new Date().toISOString() });
  return NextResponse.json({ success: true, url: blob.url });
}
