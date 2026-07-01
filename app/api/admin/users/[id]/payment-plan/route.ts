import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import client from '@/lib/mongodb';
import { sendReminderEmail } from '@/lib/email';
import { getProgramById } from '@/lib/programs';
import type { PaymentPlanRequest, User } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DB = process.env.MONGODB_DATABASE ?? 'tkd';
const col = () => client.db(DB).collection('users');

/**
 * Admin-initiated payment plan creation (e.g. a plan arranged in person or over
 * the phone). Unlike the parent flow — which lands as `pending` for review — a
 * plan created here is `approved` and active immediately, and the parent is
 * emailed a confirmation with the schedule.
 *
 * Body: { kidIndex: number; installments: 3 | 6 | 12 }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json() as { kidIndex?: number; installments?: number };
  const { kidIndex, installments } = body;

  if (typeof kidIndex !== 'number' || !Number.isInteger(kidIndex) || kidIndex < 0) {
    return NextResponse.json({ error: 'Valid kidIndex required' }, { status: 400 });
  }
  if (![3, 6, 12].includes(installments ?? 0)) {
    return NextResponse.json({ error: 'installments must be 3, 6, or 12' }, { status: 400 });
  }

  const doc = await col().findOne({ id }, { projection: { _id: 0 } });
  if (!doc) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const user = doc as unknown as User;

  const kid = user.kids?.[kidIndex];
  if (!kid) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  // Pricing (and therefore the installment amount we announce) is derived from
  // the student's program, so a program must be assigned first.
  const program = getProgramById(kid.program ?? '');
  if (!program) {
    return NextResponse.json(
      { error: 'Assign a program to this student before creating a payment plan.' },
      { status: 400 },
    );
  }

  // Mirror the parent-side guard: one active plan per student at a time.
  const existing = (user.paymentPlanRequests ?? []).find(
    (r) => r.kidIndex === kidIndex && (r.status === 'pending' || r.status === 'approved'),
  );
  if (existing) {
    return NextResponse.json(
      { error: 'This student already has an active or pending payment plan.' },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  const newRequest: PaymentPlanRequest = {
    id: randomUUID(),
    kidIndex,
    installments: installments as 3 | 6 | 12,
    installmentsPaid: 0,
    status: 'approved',
    requestedAt: now,
    reviewedAt: now, // anchors the monthly compliance cadence to today
  };

  // Typed handle so the `$push` type-checks against User.paymentPlanRequests.
  const typedCol = client.db(DB).collection<User>('users');
  await typedCol.updateOne(
    { id },
    {
      $push: { paymentPlanRequests: newRequest },
      $set: { updatedAt: now },
    },
  );

  // Confirmation email. Best-effort: a mail failure must not roll back the plan
  // that was just created (mirrors the revoke route).
  const installmentAmt = Math.round(program.pricePerYear / newRequest.installments);
  const total = installmentAmt * newRequest.installments;
  const planText = `$${(installmentAmt / 100).toFixed(2)} per month × ${newRequest.installments} payments ($${(total / 100).toFixed(2)} total)`;

  let emailSent = false;
  try {
    await sendReminderEmail({
      parentName: user.parentName,
      userEmail: user.username,
      reminderType: 'payment-plan-created',
      planText,
    });
    emailSent = true;
  } catch (err) {
    console.error('payment-plan-created notification failed:', err);
  }

  return NextResponse.json({ success: true, request: newRequest, emailSent });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json() as { requestId?: string; status?: string; installments?: number };
  const { requestId, status, installments } = body;

  if (!requestId || !['approved', 'rejected', 'pending', 'revoked'].includes(status ?? '')) {
    return NextResponse.json({ error: 'requestId and valid status required' }, { status: 400 });
  }

  if (installments !== undefined && ![3, 6, 12].includes(installments)) {
    return NextResponse.json({ error: 'installments must be 3, 6, or 12' }, { status: 400 });
  }

  const setFields: Record<string, unknown> = {
    'paymentPlanRequests.$.status': status,
    'paymentPlanRequests.$.reviewedAt': new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (installments !== undefined) {
    setFields['paymentPlanRequests.$.installments'] = installments;
  }

  const result = await col().updateOne(
    { id, 'paymentPlanRequests.id': requestId },
    { $set: setFields },
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'User or request not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
