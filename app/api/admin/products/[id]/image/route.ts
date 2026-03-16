import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { put } from '@vercel/blob';
import { getProductById, updateProduct } from '@/lib/shop';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!(await getProductById(id))) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
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
  const blob = await put(`shop-images/${id}.${ext}`, file, {
    access: 'public',
    contentType: file.type,
    allowOverwrite: true,
    token: process.env.Images_READ_WRITE_TOKEN,
  });

  await updateProduct(id, { imageSrc: blob.url });
  return NextResponse.json({ success: true, url: blob.url });
}
