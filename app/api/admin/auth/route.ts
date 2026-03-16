import { NextResponse } from 'next/server';
import { makeAdminToken, ADMIN_COOKIE } from '@/lib/adminAuth';

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD ?? '';

  if (!adminPassword) {
    return NextResponse.json({ error: 'Admin password not configured.' }, { status: 500 });
  }
  if (!password || password !== adminPassword) {
    return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
  }

  const token = makeAdminToken(password);
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}
