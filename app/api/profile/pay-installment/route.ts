import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserByUsername } from '@/lib/userStore';
import { stripe, assertStripeKey, stripeErrMsg } from '@/lib/stripe';
import client from '@/lib/mongodb';
import { getProgramById } from '@/lib/programs';

export const dynamic = 'force-dynamic';

const DB = process.env.MONGODB_DATABASE ?? 'tkd';
const col = () => client.db(DB).collection('users');

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const username =
    (session.user as { username?: string }).username ?? session.user.email ?? '';

  const body = await request.json() as { requestId?: string };
  const { requestId } = body;
  if (!requestId) {
    return NextResponse.json({ error: 'requestId required' }, { status: 400 });
  }

  const user = await getUserByUsername(username);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const planRequest = (user.paymentPlanRequests ?? []).find((r) => r.id === requestId);
  if (!planRequest) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  if (planRequest.status !== 'approved') {
    return NextResponse.json({ error: 'Plan is not approved' }, { status: 400 });
  }

  const paid = planRequest.installmentsPaid ?? 0;
  if (paid >= planRequest.installments) {
    return NextResponse.json({ error: 'All installments already paid' }, { status: 400 });
  }

  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: 'No Stripe customer on file' }, { status: 400 });
  }
  if (!user.stripePaymentMethodId) {
    return NextResponse.json({ error: 'No saved payment method' }, { status: 400 });
  }

  const kid = user.kids[planRequest.kidIndex];
  if (!kid) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const program = getProgramById(kid.program ?? '');
  if (!program) return NextResponse.json({ error: 'Student has no program assigned' }, { status: 400 });

  const installmentAmount = Math.round(program.pricePerYear / planRequest.installments);
  const installmentNumber = paid + 1;

  try {
    assertStripeKey();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: installmentAmount,
      currency: 'usd',
      customer: user.stripeCustomerId,
      payment_method: user.stripePaymentMethodId,
      confirm: true,
      off_session: true,
      description: `${program.name} – installment ${installmentNumber} of ${planRequest.installments} for ${kid.name}`,
      metadata: {
        username: user.username,
        kidIndex: String(planRequest.kidIndex),
        program: program.id,
        type: 'enrollment',
        paymentPlan: 'true',
        installments: String(planRequest.installments),
        installmentNumber: String(installmentNumber),
        planRequestId: planRequest.id,
      },
    });

    if (paymentIntent.status === 'succeeded') {
      await col().updateOne(
        { id: user.id, 'paymentPlanRequests.id': requestId },
        {
          $inc: { 'paymentPlanRequests.$.installmentsPaid': 1 },
          $set: { updatedAt: new Date().toISOString() },
        },
      );

      return NextResponse.json({
        success: true,
        installmentNumber,
        installmentsPaid: installmentNumber,
        installments: planRequest.installments,
      });
    }

    // Requires 3DS — webhook will handle installmentsPaid bump if the user completes it
    return NextResponse.json({
      success: false,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret,
      error: 'Payment requires additional authentication',
    }, { status: 402 });
  } catch (err) {
    const msg = stripeErrMsg(err);
    console.error('pay-installment error:', msg, err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
