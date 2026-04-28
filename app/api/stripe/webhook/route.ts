import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getUserByUsername, updateUser } from '@/lib/userStore';

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
    const pi = data.object as { metadata?: Record<string, string>; id: string };
    const { username, kidIndex, type: paymentType, paymentPlan, planRequestId } = pi.metadata ?? {};

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

          // Bump installmentsPaid for plan payments (covers user's installment 1 via the Payment Element)
          let updatedPlanRequests = user.paymentPlanRequests;
          if (type === 'payment_intent.succeeded' && paymentPlan === 'true') {
            const reqId = planRequestId ?? (user.paymentPlanRequests ?? []).find(
              (r) => r.kidIndex === idx && r.status === 'approved',
            )?.id;
            if (reqId) {
              updatedPlanRequests = (user.paymentPlanRequests ?? []).map((r) =>
                r.id === reqId
                  ? { ...r, installmentsPaid: (r.installmentsPaid ?? 0) + 1 }
                  : r,
              );
            }
          }

          await updateUser({ ...user, kids: updatedKids, paymentPlanRequests: updatedPlanRequests });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
