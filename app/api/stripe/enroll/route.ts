import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe, assertStripeKey, stripeErrMsg } from '@/lib/stripe';
import { getUserByUsername } from '@/lib/userStore';
import { getProgramById } from '@/lib/programs';

/**
 * Creates a PaymentIntent for a student enrollment and returns the clientSecret.
 * The actual kid activation happens via the Stripe webhook (payment_intent.succeeded).
 * This allows Klarna, Afterpay, and other BNPL methods via the Payment Element.
 */
export async function POST(request: Request) {
  try {
    assertStripeKey();
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { kidIndex, usePaymentPlan } = await request.json() as { kidIndex: number; usePaymentPlan?: boolean };
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
    if (!user.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer on file' }, { status: 400 });
    }

    const program = getProgramById(kid.program ?? '');
    if (!program) {
      return NextResponse.json({ error: 'Student has no program assigned' }, { status: 400 });
    }

    // Determine charge amount — full price or first installment of an approved plan
    let chargeAmount = program.pricePerYear;
    let installments: number | undefined;
    let planRequestId: string | undefined;

    if (usePaymentPlan) {
      const approvedPlan = (user.paymentPlanRequests ?? []).find(
        (r) => r.kidIndex === kidIndex && r.status === 'approved',
      );
      if (!approvedPlan) {
        return NextResponse.json({ error: 'No approved payment plan found for this student' }, { status: 400 });
      }
      chargeAmount = Math.round(program.pricePerYear / approvedPlan.installments);
      installments = approvedPlan.installments;
      planRequestId = approvedPlan.id;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeAmount,
      currency: 'usd',
      customer: user.stripeCustomerId,
      automatic_payment_methods: { enabled: true },
      description: usePaymentPlan
        ? `${program.name} – installment 1 of ${installments} for ${kid.name}`
        : `${program.name} – 1-year enrollment for ${kid.name}`,
      metadata: {
        username,
        kidIndex: String(kidIndex),
        program: program.id,
        type: 'enrollment',
        ...(usePaymentPlan && { paymentPlan: 'true', installments: String(installments), planRequestId: planRequestId ?? '' }),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: chargeAmount,
      programName: program.name,
      kidName: kid.name,
      ...(installments !== undefined && { installments }),
    });
  } catch (err) {
    const msg = stripeErrMsg(err);
    console.error('enroll error:', msg, err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
