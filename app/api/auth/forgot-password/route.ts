import { NextResponse } from 'next/server';
import { getUserByUsername } from '@/lib/userStore';
import { createResetToken } from '@/lib/passwordReset';
import { sendPasswordResetEmail } from '@/lib/email';

/**
 * Request a password reset link.
 *
 * Always responds 200 with the same body whether or not the account exists, so
 * this endpoint can't be used to enumerate registered emails. Any failure to
 * send is logged server-side but not leaked to the caller.
 */
export async function POST(request: Request) {
  let username: string | undefined;
  try {
    const body = await request.json();
    username = (body?.username as string | undefined)?.toLowerCase().trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!username) {
    return NextResponse.json({ error: 'Please enter your email address.' }, { status: 400 });
  }

  try {
    const user = await getUserByUsername(username);
    if (user) {
      const token = await createResetToken(username);

      const baseUrl =
        process.env.NEXTAUTH_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
        'http://localhost:3000';
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      await sendPasswordResetEmail({
        parentName: user.parentName,
        userEmail: user.username,
        resetUrl,
      });
    }
  } catch (err) {
    // Don't surface internal errors — still return the generic success response.
    console.error('forgot-password: failed to issue reset link', err);
  }

  return NextResponse.json({
    success: true,
    message: 'If an account exists for that email, a reset link is on its way.',
  });
}
