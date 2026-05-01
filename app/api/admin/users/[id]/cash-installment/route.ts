import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import client from '@/lib/mongodb';
import { getProgramById } from '@/lib/programs';
import type { User, InstallmentRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

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
  const body = await request.json() as { requestId?: string; note?: string };
  const { requestId, note } = body;

  if (!requestId) {
    return NextResponse.json({ error: 'requestId required' }, { status: 400 });
  }

  const doc = await col().findOne({ id }, { projection: { _id: 0 } });
  if (!doc) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const user = doc as unknown as User;

  const planRequest = (user.paymentPlanRequests ?? []).find((r) => r.id === requestId);
  if (!planRequest) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  if (planRequest.status !== 'approved') {
    return NextResponse.json({ error: 'Plan is not approved' }, { status: 400 });
  }

  const paid = planRequest.installmentsPaid ?? 0;
  if (paid >= planRequest.installments) {
    return NextResponse.json({ error: 'All installments already paid' }, { status: 400 });
  }

  const kid = user.kids[planRequest.kidIndex];
  if (!kid) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const program = getProgramById(kid.program ?? '');
  if (!program) return NextResponse.json({ error: 'Student has no program assigned' }, { status: 400 });

  const installmentAmount = Math.round(program.pricePerYear / planRequest.installments);
  const installmentNumber = paid + 1;

  const record: InstallmentRecord = {
    installmentNumber,
    amount: installmentAmount,
    method: 'cash',
    status: 'succeeded',
    chargedAt: new Date().toISOString(),
    ...(note?.trim() ? { note: note.trim() } : {}),
  };

  await col().updateOne(
    { id, 'paymentPlanRequests.id': requestId },
    {
      $inc: { 'paymentPlanRequests.$.installmentsPaid': 1 },
      $push: { 'paymentPlanRequests.$.chargeHistory': { $each: [record] } },
      $set: { updatedAt: new Date().toISOString() },
    },
  );

  return NextResponse.json({
    success: true,
    installmentNumber,
    installmentsPaid: installmentNumber,
    record,
  });
}
