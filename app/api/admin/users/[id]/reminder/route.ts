import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import client from '@/lib/mongodb';
import { sendReminderEmail } from '@/lib/email';

const DB = process.env.MONGODB_DATABASE ?? 'tkd';
const col = () => client.db(DB).collection('users');

const VALID_TYPES = ['finish-signup', 'payment-due-soon', 'payment-past-due'];

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

  const user = await col().findOne({ id }, { projection: { _id: 0, username: 1, parentName: 1 } });
  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  await sendReminderEmail({
    parentName: user.parentName as string,
    userEmail: user.username as string,
    reminderType,
  });

  return NextResponse.json({ success: true });
}
