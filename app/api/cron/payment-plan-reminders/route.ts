import { NextResponse } from 'next/server';
import client from '@/lib/mongodb';
import { sendReminderEmail } from '@/lib/email';
import {
  isFamilyCompliant,
  missedCount,
  outstandingCents,
  MISSED_PAYMENT_THRESHOLD,
} from '@/lib/paymentPlan';
import type { PaymentPlanRequest, User } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DB = process.env.MONGODB_DATABASE ?? 'tkd';
const col = () => client.db(DB).collection('users');

const isActivePlan = (p: PaymentPlanRequest) =>
  p.status === 'approved' && (p.installmentsPaid ?? 0) < p.installments;

/**
 * Daily cron: keeps payment-plan families on track.
 *
 * For each active family (not archived):
 *  1. Balance-due escalation — if any active plan has reached
 *     MISSED_PAYMENT_THRESHOLD (3) missed monthly payments and hasn't yet been
 *     notified, email the parent once that the full remaining balance is now due
 *     and stamp `balanceDueNotifiedAt` so it never re-sends. Revocation stays a
 *     manual admin action.
 *  2. Otherwise, if the family is not compliant, send the gentler
 *     `payment-plan-consecutive` reminder (families with 2+ active plans only
 *     need one plan on schedule to stay compliant).
 *
 * Secured with a bearer token (Vercel sets `Authorization: Bearer $CRON_SECRET`).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const docs = await col()
    .find(
      { 'paymentPlanRequests.status': 'approved', archived: { $ne: true } },
      { projection: { _id: 0 } },
    )
    .toArray();

  let scanned = 0;
  let remindersSent = 0;
  let balanceDueSent = 0;
  const now = new Date();

  for (const doc of docs) {
    const user = doc as unknown as User;
    scanned += 1;

    // 1. Balance-due escalation — plans that just crossed the missed threshold
    //    and haven't been notified yet.
    const crossing = (user.paymentPlanRequests ?? []).filter(
      (p) => isActivePlan(p) && !p.balanceDueNotifiedAt && missedCount(p, now) >= MISSED_PAYMENT_THRESHOLD,
    );

    if (crossing.length > 0) {
      const balance = crossing.reduce((sum, p) => sum + outstandingCents(user, p), 0);
      try {
        await sendReminderEmail({
          parentName: user.parentName,
          userEmail: user.username,
          reminderType: 'payment-plan-balance-due',
          balanceText: balance > 0 ? `$${(balance / 100).toFixed(2)}` : undefined,
        });
        const nowIso = now.toISOString();
        for (const p of crossing) {
          await col().updateOne(
            { id: user.id, 'paymentPlanRequests.id': p.id },
            { $set: { 'paymentPlanRequests.$.balanceDueNotifiedAt': nowIso, updatedAt: nowIso } },
          );
        }
        balanceDueSent += 1;
      } catch (err) {
        console.error(`balance-due notice failed for ${user.username}:`, err);
      }
      // Escalation supersedes the gentler reminder for this run.
      continue;
    }

    // 2. Consecutive-payment reminder for non-compliant families.
    if (isFamilyCompliant(user, now)) continue;
    try {
      await sendReminderEmail({
        parentName: user.parentName,
        userEmail: user.username,
        reminderType: 'payment-plan-consecutive',
      });
      remindersSent += 1;
    } catch (err) {
      console.error(`consecutive reminder failed for ${user.username}:`, err);
    }
  }

  return NextResponse.json({
    success: true,
    scanned,
    remindersSent,
    balanceDueSent,
    timestamp: now.toISOString(),
  });
}
