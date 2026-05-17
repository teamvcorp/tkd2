import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import client from '@/lib/mongodb';
import { sendReminderEmail } from '@/lib/email';

const DB = process.env.MONGODB_DATABASE ?? 'tkd';
const col = () => client.db(DB).collection('users');

const VALID_TYPES = ['finish-signup', 'payment-due-soon', 'payment-past-due'];

/** Generates a short, easy-to-read temporary password (no ambiguous chars). */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const reminderType = body.type as string | undefined;

  if (!reminderType || !VALID_TYPES.includes(reminderType)) {
    return NextResponse.json({ error: 'Invalid reminder type.' }, { status: 400 });
  }

  const user = await col().findOne(
    { id },
    { projection: { _id: 0, username: 1, parentName: 1, passwordHash: 1 } },
  );
  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  // If we're inviting them to finish signup but their account has no password
  // yet (admin created it as locked), generate a one-time temp password,
  // persist its hash, and include the plaintext in the email so they can log
  // in and complete enrollment.
  let tempPassword: string | undefined;
  if (reminderType === 'finish-signup' && !user.passwordHash) {
    tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    await col().updateOne(
      { id },
      { $set: { passwordHash, updatedAt: new Date().toISOString() } },
    );
  }

  await sendReminderEmail({
    parentName: user.parentName as string,
    userEmail: user.username as string,
    reminderType,
    tempPassword,
  });

  return NextResponse.json({ success: true, tempPasswordIssued: Boolean(tempPassword) });
}
