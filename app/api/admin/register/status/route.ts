import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { stripe, assertStripeKey, stripeErrMsg } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/register/status?readerId=…&paymentIntentId=…
 * Admin-only. Polled by the register page while a sale is in flight. Returns the
 * reader action status and the PaymentIntent status so the UI can show
 * waiting → succeeded / failed.
 */
export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    assertStripeKey();
    const { searchParams } = new URL(request.url);
    const readerId = searchParams.get('readerId')?.trim();
    const paymentIntentId = searchParams.get('paymentIntentId')?.trim();

    if (!readerId || !paymentIntentId) {
      return NextResponse.json(
        { error: 'readerId and paymentIntentId are required.' },
        { status: 400 },
      );
    }

    const [reader, pi] = await Promise.all([
      stripe.terminal.readers.retrieve(readerId),
      stripe.paymentIntents.retrieve(paymentIntentId),
    ]);

    // `retrieve` may return a DeletedReader — no action to report in that case.
    const action = 'deleted' in reader ? undefined : reader.action;
    // The reader's action.payment_intent is a string when unexpanded, or an
    // object when expanded — normalise to an id before comparing.
    const actionPi = action?.process_payment_intent?.payment_intent;
    const actionPiId = typeof actionPi === 'string' ? actionPi : actionPi?.id;
    // Only report the action if it belongs to THIS payment — the reader is
    // shared, so a stale/other action shouldn't be mistaken for ours.
    const actionMatchesThisPI =
      action?.type === 'process_payment_intent' && actionPiId === paymentIntentId;

    return NextResponse.json({
      readerActionStatus: actionMatchesThisPI ? action?.status ?? null : null,
      failureCode: actionMatchesThisPI ? action?.failure_code ?? null : null,
      failureMessage: actionMatchesThisPI ? action?.failure_message ?? null : null,
      paymentStatus: pi.status,
      lastPaymentError: pi.last_payment_error?.message ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: stripeErrMsg(err) }, { status: 500 });
  }
}
