import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import client from '@/lib/mongodb';
import { getUsernameForToken, consumeResetToken } from '@/lib/passwordReset';

const DB = process.env.MONGODB_DATABASE ?? 'tkd';
const col = () => client.db(DB).collection('users');

/**
 * Complete a password reset: verify the one-time token and set the new
 * password. The token is consumed (deleted) on success so it can't be reused.
 */
export async function POST(request: Request) {
  let token: string | undefined;
  let password: string | undefined;
  try {
    const body = await request.json();
    token = body?.token as string | undefined;
    password = body?.password as string | undefined;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ error: 'Missing reset token.' }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 },
    );
  }

  const username = await getUsernameForToken(token);
  if (!username) {
    return NextResponse.json(
      { error: 'This reset link is invalid or has expired. Please request a new one.' },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await col().updateOne(
    { username },
    { $set: { passwordHash, updatedAt: new Date().toISOString() } },
  );

  if (result.matchedCount === 0) {
    // User vanished between token issue and reset — clean up the token.
    await consumeResetToken(token);
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  await consumeResetToken(token);
  return NextResponse.json({ success: true });
}
