import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import client from '@/lib/mongodb';
import { sendReminderEmail } from '@/lib/email';
import { outstandingCents } from '@/lib/paymentPlan';
import type { User } from '@/lib/types';

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
  const body = await request.json() as { requestId?: string; reason?: string };
  const { requestId, reason } = body;

  if (!requestId) {
    return NextResponse.json({ error: 'requestId required' }, { status: 400 });
  }

  const doc = await col().findOne({ id }, { projection: { _id: 0 } });
  if (!doc) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const user = doc as unknown as User;

  const planRequest = (user.paymentPlanRequests ?? []).find((r) => r.id === requestId);
  if (!planRequest) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  if (planRequest.status !== 'approved') {
    return NextResponse.json({ error: 'Only approved plans can be revoked' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const result = await col().updateOne(
    { id, 'paymentPlanRequests.id': requestId },
    {
      $set: {
        'paymentPlanRequests.$.status': 'revoked',
        'paymentPlanRequests.$.reviewedAt': now,
        'paymentPlanRequests.$.revokedReason': reason ?? '',
        updatedAt: now,
      },
    },
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'User or request not found' }, { status: 404 });
  }

  // Notify all parties (member + admin copy). Best-effort: a mail failure must
  // not roll back the revocation that already happened above.
  let notified = false;
  try {
    const balance = outstandingCents(user, planRequest);
    const balanceText = balance > 0 ? `$${(balance / 100).toFixed(2)}` : undefined;
    await sendReminderEmail({
      parentName: user.parentName,
      userEmail: user.username,
      reminderType: 'payment-plan-revoked',
      balanceText,
    });
    notified = true;
  } catch (err) {
    console.error('revoke notification failed:', err);
  }

  return NextResponse.json({ success: true, notified });
}
