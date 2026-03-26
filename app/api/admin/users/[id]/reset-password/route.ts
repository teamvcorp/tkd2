import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import client from '@/lib/mongodb';

const DB = process.env.MONGODB_DATABASE ?? 'tkd';
const col = () => client.db(DB).collection('users');

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const newPassword = body.password as string | undefined;

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const result = await col().updateOne(
    { id },
    { $set: { passwordHash, updatedAt: new Date().toISOString() } },
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
