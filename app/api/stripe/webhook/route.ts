import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getUserByUsername, updateUser } from '@/lib/userStore';
import client from '@/lib/mongodb';
import type { InstallmentRecord } from '@/lib/types';

/**
 * Stripe webhook handler.
 * Verifies the signature then processes relevant events.
 *
 * Events handled:
 *  - payment_intent.succeeded  → activate kid + set 12-month expiry
 *  - payment_intent.payment_failed → mark kid inactive
 */
export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature') ?? '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const { type, data } = event;

  if (type === 'payment_intent.succeeded' || type === 'payment_intent.payment_failed') {
    const pi = data.object as {
      id: string;
      amount?: number;
      metadata?: Record<string, string>;
      last_payment_error?: { message?: string };
    };
    const { username, kidIndex, type: paymentType, paymentPlan, planRequestId, installmentNumber } = pi.metadata ?? {};

    if (paymentType === 'enrollment' && username && kidIndex != null) {
      const user = await getUserByUsername(username);
      if (user) {
        const idx = Number(kidIndex);
        const kid = user.kids[idx];
        if (kid) {
          let updatedKids = user.kids;
          if (type === 'payment_intent.succeeded' && kid.status !== 'active') {
            const expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            updatedKids = user.kids.map((k, i) =>
              i === idx
                ? { ...k, status: 'active' as const, expiresAt: expiresAt.toISOString(), stripePaymentIntentId: pi.id }
                : k,
            );
          } else if (type === 'payment_intent.payment_failed') {
            updatedKids = user.kids.map((k, i) =>
              i === idx ? { ...k, status: 'inactive' as const } : k,
            );
          }

          // Use the current paymentPlanRequests (not a mapped copy) so replaceOne
          // does not overwrite chargeHistory written by the API routes.
          await updateUser({ ...user, kids: updatedKids, paymentPlanRequests: user.paymentPlanRequests });

          // Handle plan charge history AFTER the replaceOne so our $push wins.
          if (paymentPlan === 'true') {
            const DB = process.env.MONGODB_DATABASE ?? 'tkd';
            const dbCol = client.db(DB).collection('users');
            const reqId = planRequestId ?? (user.paymentPlanRequests ?? []).find(
              (r) => r.kidIndex === idx && r.status === 'approved',
            )?.id;

            if (reqId) {
              const planReq = (user.paymentPlanRequests ?? []).find((r) => r.id === reqId);

              if (type === 'payment_intent.succeeded') {
                // Dedup: if already recorded by the API route, skip
                const alreadyRecorded = (planReq?.chargeHistory ?? []).some(
                  (r) => r.stripePaymentIntentId === pi.id && r.status === 'succeeded',
                );
                if (!alreadyRecorded) {
                  // 3DS completion path: API route did not increment or record history
                  const instNum = Number(installmentNumber ?? (planReq?.installmentsPaid ?? 0) + 1);
                  const record: InstallmentRecord = {
                    installmentNumber: instNum,
                    amount: pi.amount ?? 0,
                    method: 'stripe',
                    status: 'succeeded',
                    stripePaymentIntentId: pi.id,
                    chargedAt: new Date().toISOString(),
                  };
                  await dbCol.updateOne(
                    { username: username.toLowerCase().trim(), 'paymentPlanRequests.id': reqId },
                    {
                      $inc: { 'paymentPlanRequests.$.installmentsPaid': 1 },
                      $push: { 'paymentPlanRequests.$.chargeHistory': { $each: [record] } },
                      $set: { updatedAt: new Date().toISOString() },
                    } as any,
                  );
                }
              } else if (type === 'payment_intent.payment_failed') {
                // Dedup: only record once per payment intent id
                const alreadyRecorded = (planReq?.chargeHistory ?? []).some(
                  (r) => r.stripePaymentIntentId === pi.id,
                );
                if (!alreadyRecorded) {
                  const instNum = Number(installmentNumber ?? (planReq?.installmentsPaid ?? 0) + 1);
                  const record: InstallmentRecord = {
                    installmentNumber: instNum,
                    amount: pi.amount ?? 0,
                    method: 'stripe',
                    status: 'failed',
                    stripePaymentIntentId: pi.id,
                    failureMessage: pi.last_payment_error?.message,
                    chargedAt: new Date().toISOString(),
                  };
                  await dbCol.updateOne(
                    { username: username.toLowerCase().trim(), 'paymentPlanRequests.id': reqId },
                    {
                      $push: { 'paymentPlanRequests.$.chargeHistory': { $each: [record] } },
                      $set: { updatedAt: new Date().toISOString() },
                    } as any,
                  );
                }
              }
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
