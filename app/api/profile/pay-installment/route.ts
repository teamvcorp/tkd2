import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserByUsername } from '@/lib/userStore';
import { stripe, assertStripeKey, stripeErrMsg } from '@/lib/stripe';
import client from '@/lib/mongodb';
import { getProgramById } from '@/lib/programs';
import type { InstallmentRecord } from '@/lib/types';

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

  const body = await request.json() as { requestId?: string; payRemaining?: boolean };
  const { requestId, payRemaining } = body;
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

  // Remaining balance is derived from the ledger (sum of succeeded charges), not
  // count × installmentAmount — this self-heals the rounding drift from Math.round
  // so an early payoff collects exactly what's owed and never a cent more.
  const succeededPaid = (planRequest.chargeHistory ?? [])
    .filter((r) => r.status === 'succeeded')
    .reduce((sum, r) => sum + r.amount, 0);

  let chargeAmount: number;
  let installmentNumber: number;
  if (payRemaining) {
    chargeAmount = program.pricePerYear - succeededPaid;
    if (chargeAmount <= 0) {
      return NextResponse.json({ error: 'This plan is already paid in full.' }, { status: 400 });
    }
    installmentNumber = planRequest.installments;
  } else {
    chargeAmount = Math.round(program.pricePerYear / planRequest.installments);
    installmentNumber = paid + 1;
  }

  try {
    assertStripeKey();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeAmount,
      currency: 'usd',
      customer: user.stripeCustomerId,
      payment_method: user.stripePaymentMethodId,
      confirm: true,
      off_session: true,
      description: payRemaining
        ? `${program.name} – remaining balance payoff for ${kid.name}`
        : `${program.name} – installment ${installmentNumber} of ${planRequest.installments} for ${kid.name}`,
      metadata: {
        username: user.username,
        kidIndex: String(planRequest.kidIndex),
        program: program.id,
        type: 'enrollment',
        paymentPlan: 'true',
        installments: String(planRequest.installments),
        installmentNumber: String(installmentNumber),
        planRequestId: planRequest.id,
        ...(payRemaining && { payoff: 'true' }),
      },
    });

    if (paymentIntent.status === 'succeeded') {
      const record: InstallmentRecord = {
        installmentNumber,
        amount: chargeAmount,
        method: 'stripe',
        status: 'succeeded',
        stripePaymentIntentId: paymentIntent.id,
        chargedAt: new Date().toISOString(),
      };
      // A payoff settles the whole plan, so jump straight to fully paid;
      // a single installment just advances the counter by one.
      const newInstallmentsPaid = payRemaining ? planRequest.installments : installmentNumber;
      await col().updateOne(
        { id: user.id, 'paymentPlanRequests.id': requestId },
        {
          $set: {
            'paymentPlanRequests.$.installmentsPaid': newInstallmentsPaid,
            updatedAt: new Date().toISOString(),
          },
          $push: { 'paymentPlanRequests.$.chargeHistory': { $each: [record] } },
        } as any,
      );

      return NextResponse.json({
        success: true,
        installmentNumber,
        installmentsPaid: newInstallmentsPaid,
        installments: planRequest.installments,
        paidInFull: newInstallmentsPaid >= planRequest.installments,
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
