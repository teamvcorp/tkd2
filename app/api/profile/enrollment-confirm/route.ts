import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe, assertStripeKey } from '@/lib/stripe';
import { getUserByUsername, updateUser } from '@/lib/userStore';
import client from '@/lib/mongodb';
import type { InstallmentRecord } from '@/lib/types';

const DB = process.env.MONGODB_DATABASE ?? 'tkd';

/**
 * POST /api/profile/enrollment-confirm
 * Called client-side immediately after a successful Stripe PaymentIntent for enrollment.
 * Validates the PaymentIntent with Stripe, then persists the kid's active status to DB.
 * This is the primary persistence path; the webhook acts as a backup.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { kidIndex, paymentIntentId } = (await request.json()) as {
      kidIndex?: number;
      paymentIntentId?: string;
    };

    if (typeof kidIndex !== 'number' || !paymentIntentId) {
      return NextResponse.json({ error: 'kidIndex and paymentIntentId are required' }, { status: 400 });
    }

    const username =
      (session.user as { username?: string }).username ?? session.user.email ?? '';

    const user = await getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const kid = user.kids[kidIndex];
    if (!kid) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Verify the PaymentIntent with Stripe to confirm it actually succeeded
    assertStripeKey();
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (pi.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment has not succeeded' }, { status: 400 });
    }

    // Confirm the PaymentIntent belongs to this user's customer
    if (pi.customer && pi.customer !== user.stripeCustomerId) {
      return NextResponse.json({ error: 'Payment does not belong to this account' }, { status: 403 });
    }

    // Idempotent: if already active with this PI, return success
    if (kid.status === 'active' && kid.stripePaymentIntentId === paymentIntentId) {
      return NextResponse.json({ success: true, alreadyActive: true });
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const updatedKids = user.kids.map((k, i) =>
      i === kidIndex
        ? { ...k, status: 'active' as const, expiresAt: expiresAt.toISOString(), stripePaymentIntentId: paymentIntentId }
        : k,
    );

    await updateUser({ ...user, kids: updatedKids, paymentPlanRequests: user.paymentPlanRequests });

    // If this enrollment was the first installment of a payment plan, record it
    // here (the primary path) instead of relying solely on the webhook. The
    // update is atomic-idempotent: the $elemMatch filter only matches when this
    // PaymentIntent is not already in the plan's chargeHistory, so a concurrent
    // webhook delivery cannot double-count it.
    const meta = pi.metadata ?? {};
    if (meta.paymentPlan === 'true') {
      const reqId = meta.planRequestId || (user.paymentPlanRequests ?? []).find(
        (r) => r.kidIndex === kidIndex && r.status === 'approved',
      )?.id;
      if (reqId) {
        const planReq = (user.paymentPlanRequests ?? []).find((r) => r.id === reqId);
        const instNum = Number(meta.installmentNumber ?? (planReq?.installmentsPaid ?? 0) + 1);
        const record: InstallmentRecord = {
          installmentNumber: instNum,
          amount: pi.amount ?? 0,
          method: 'stripe',
          status: 'succeeded',
          stripePaymentIntentId: pi.id,
          chargedAt: new Date().toISOString(),
        };
        await client.db(DB).collection('users').updateOne(
          {
            username: user.username.toLowerCase().trim(),
            paymentPlanRequests: { $elemMatch: { id: reqId, 'chargeHistory.stripePaymentIntentId': { $ne: pi.id } } },
          },
          {
            $inc: { 'paymentPlanRequests.$.installmentsPaid': 1 },
            $push: { 'paymentPlanRequests.$.chargeHistory': { $each: [record] } },
            $set: { updatedAt: new Date().toISOString() },
          } as any,
        );
      }
    }

    return NextResponse.json({ success: true, expiresAt: expiresAt.toISOString() });
  } catch (err) {
    console.error('enrollment-confirm error:', err);
    return NextResponse.json({ error: 'Could not confirm enrollment.' }, { status: 500 });
  }
}
