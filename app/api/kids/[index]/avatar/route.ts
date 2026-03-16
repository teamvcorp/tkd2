import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { auth } from '@/auth';
import { getUserByUsername, updateUser } from '@/lib/userStore';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ index: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { index } = await params;
  const kidIndex = parseInt(index, 10);
  if (isNaN(kidIndex) || kidIndex < 0) {
    return NextResponse.json({ error: 'Invalid kid index.' }, { status: 400 });
  }

  const username =
    (session.user as { username?: string }).username ?? session.user.email ?? '';

  const user = await getUserByUsername(username);
  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }
  if (kidIndex >= user.kids.length) {
    return NextResponse.json({ error: 'Kid not found.' }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get('image') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No image provided.' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image.' }, { status: 400 });
  }
  // After client-side resize, images are small; still guard against raw uploads
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be under 2 MB.' }, { status: 400 });
  }

  const safeUsername = username.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const blob = await put(
    `kid-avatars/${safeUsername}-${kidIndex}.jpg`,
    file,
    {
      access: 'public',
      contentType: 'image/jpeg',
      allowOverwrite: true,
      token: process.env.Images_READ_WRITE_TOKEN,
    },
  );

  const updatedKids = user.kids.map((k, i) =>
    i === kidIndex ? { ...k, avatarUrl: blob.url } : k,
  );
  await updateUser({ ...user, kids: updatedKids });

  return NextResponse.json({ success: true, url: blob.url });
}
