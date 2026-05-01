import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { stripe, assertStripeKey, stripeErrMsg } from '@/lib/stripe';
import client from '@/lib/mongodb';
import { getProgramById } from '@/lib/programs';
import type { User, InstallmentRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DB = process.env.MONGODB_DATABASE ?? 'tkd';
const col = () => client.db(DB).collection('users');

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json() as { requestId?: string };
  const { requestId } = body;

  if (!requestId) {
    return NextResponse.json({ error: 'requestId required' }, { status: 400 });
  }

  const doc = await col().findOne({ id }, { projection: { _id: 0 } });
  if (!doc) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const user = doc as unknown as User;

  const planRequest = (user.paymentPlanRequests ?? []).find((r) => r.id === requestId);
  if (!planRequest) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  if (planRequest.status !== 'approved') {
    return NextResponse.json({ error: 'Plan is not approved' }, { status: 400 });
  }

  const paid = planRequest.installmentsPaid ?? 0;
  if (paid >= planRequest.installments) {
    return NextResponse.json({ error: 'All installments already charged' }, { status: 400 });
  }

  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: 'User has no Stripe customer on file' }, { status: 400 });
  }
  if (!user.stripePaymentMethodId) {
    return NextResponse.json({ error: 'User has no saved payment method' }, { status: 400 });
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
      const record: InstallmentRecord = {
        installmentNumber,
        amount: installmentAmount,
        method: 'stripe',
        status: 'succeeded',
        stripePaymentIntentId: paymentIntent.id,
        chargedAt: new Date().toISOString(),
      };
      await col().updateOne(
        { id, 'paymentPlanRequests.id': requestId },
        {
          $inc: { 'paymentPlanRequests.$.installmentsPaid': 1 },
          $push: { 'paymentPlanRequests.$.chargeHistory': record },
          $set: { updatedAt: new Date().toISOString() },
        },
      );

      return NextResponse.json({
        success: true,
        installmentNumber,
        installmentsPaid: installmentNumber,
        installments: planRequest.installments,
        record,
      });
    }

    // Requires action (3DS etc.) — log it and return status for admin to see
    const requiresActionRecord: InstallmentRecord = {
      installmentNumber,
      amount: installmentAmount,
      method: 'stripe',
      status: 'requires_action',
      stripePaymentIntentId: paymentIntent.id,
      chargedAt: new Date().toISOString(),
      failureMessage: 'Payment requires additional authentication by the customer',
    };
    await col().updateOne(
      { id, 'paymentPlanRequests.id': requestId },
      {
        $push: { 'paymentPlanRequests.$.chargeHistory': requiresActionRecord },
        $set: { updatedAt: new Date().toISOString() },
      },
    );
    return NextResponse.json({
      success: false,
      status: paymentIntent.status,
      error: 'Payment requires additional authentication by the customer',
      record: requiresActionRecord,
    }, { status: 402 });
  } catch (err) {
    const msg = stripeErrMsg(err);
    console.error('charge-installment error:', msg, err);
    // Record the failure in history
    const failRecord: InstallmentRecord = {
      installmentNumber,
      amount: installmentAmount,
      method: 'stripe',
      status: 'failed',
      chargedAt: new Date().toISOString(),
      failureMessage: msg,
    };
    await col().updateOne(
      { id, 'paymentPlanRequests.id': requestId },
      {
        $push: { 'paymentPlanRequests.$.chargeHistory': failRecord },
        $set: { updatedAt: new Date().toISOString() },
      },
    ).catch(() => {/* best-effort */});
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
