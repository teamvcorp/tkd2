import { NextResponse } from 'next/server';
import client from '@/lib/mongodb';
import { sendReminderEmail } from '@/lib/email';
import { isFamilyCompliant } from '@/lib/paymentPlan';
import type { User } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DB = process.env.MONGODB_DATABASE ?? 'tkd';
const col = () => client.db(DB).collection('users');

/**
 * Daily cron: reminds families that payment plans must be paid consecutively.
 *
 * Sends one `payment-plan-consecutive` reminder to each family that is NOT
 * compliant (see `isFamilyCompliant`). Families with 2+ active plans only need
 * one plan on schedule to stay compliant, so they are skipped automatically.
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
  const now = new Date();

  for (const doc of docs) {
    const user = doc as unknown as User;
    scanned += 1;
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
    timestamp: now.toISOString(),
  });
}
