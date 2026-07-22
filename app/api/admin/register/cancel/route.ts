import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { stripe, assertStripeKey, stripeErrMsg } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/register/cancel   { readerId, paymentIntentId? }
 * Admin-only. Cancels the in-progress action on the reader (customer changed
 * their mind, wrong amount, etc.) and cancels the PaymentIntent if supplied.
 * Note: Stripe rejects cancellation once the card is authorizing
 * (`terminal_reader_busy`) — surfaced to the caller.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    assertStripeKey();
    const { readerId, paymentIntentId } = (await request.json()) as {
      readerId?: string;
      paymentIntentId?: string;
    };
    if (!readerId?.trim()) {
      return NextResponse.json({ error: 'readerId is required.' }, { status: 400 });
    }

    await stripe.terminal.readers.cancelAction(readerId.trim());

    if (paymentIntentId?.trim()) {
      await stripe.paymentIntents.cancel(paymentIntentId.trim()).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: stripeErrMsg(err) }, { status: 500 });
  }
}
