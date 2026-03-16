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

    const { kidIndex } = await request.json() as { kidIndex: number };
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

    const paymentIntent = await stripe.paymentIntents.create({
      amount: program.pricePerYear,
      currency: 'usd',
      customer: user.stripeCustomerId,
      automatic_payment_methods: { enabled: true },
      description: `${program.name} – 1-year enrollment for ${kid.name}`,
      metadata: {
        username,
        kidIndex: String(kidIndex),
        program: program.id,
        type: 'enrollment',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: program.pricePerYear,
      programName: program.name,
      kidName: kid.name,
    });
  } catch (err) {
    const msg = stripeErrMsg(err);
    console.error('enroll error:', msg, err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
