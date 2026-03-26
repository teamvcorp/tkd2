import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import client from '@/lib/mongodb';
import type { Kid } from '@/lib/types';

const DB = process.env.MONGODB_DATABASE ?? 'tkd';
const col = () => client.db(DB).collection('users');

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  if (body.parentName !== undefined) updates.parentName = String(body.parentName).trim();
  if (body.parentAge !== undefined) updates.parentAge = Number(body.parentAge);
  if (body.kids !== undefined) {
    updates.kids = (body.kids as Kid[]).map((k) => ({
      name: String(k.name ?? '').trim(),
      age: Number(k.age ?? 0),
      rank: String(k.rank ?? 'white'),
      program: k.program || undefined,
      status: k.status ?? 'pending',
      expiresAt: k.expiresAt || undefined,
      stripePaymentIntentId: k.stripePaymentIntentId || undefined,
      avatarUrl: k.avatarUrl || undefined,
    }));
  }

  const result = await col().updateOne({ id }, { $set: updates });
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
