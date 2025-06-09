// app/api/auth/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { password } = await request.json();
  const CORRECT_PASSWORD = process.env.MEMBER_PASSWORD;

  if (password === CORRECT_PASSWORD) {
    return NextResponse.json({ authorized: true });
  }
  return NextResponse.json({ authorized: false, error: 'Incorrect password' }, { status: 401 });
}