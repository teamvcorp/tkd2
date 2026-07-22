import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { stripe, assertStripeKey, stripeErrMsg } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

// Upper bound guards against fat-finger entry (e.g. cents-vs-dollars mistakes).
// $10,000. Raise if a legitimate single in-person sale ever exceeds this.
const MAX_AMOUNT_CENTS = 1_000_000;

/**
 * POST /api/admin/register/charge   { amountCents, note?, readerId }
 * Admin-only. Server-driven Stripe Terminal payment on a physical S710 reader.
 *
 *   1. Create a card_present PaymentIntent (automatic capture).
 *   2. Push it to the reader with `processPaymentIntent` — the reader then
 *      prompts the customer to tap / insert / swipe.
 *
 * The client polls /api/admin/register/status for the outcome. The reader is
 * shared with other sites, so every charge is tagged with metadata identifying
 * this site, and a busy reader surfaces a clear message.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    assertStripeKey();

    const { amountCents, note, readerId } = (await request.json()) as {
      amountCents?: number;
      note?: string;
      readerId?: string;
    };

    if (!readerId?.trim()) {
      return NextResponse.json({ error: 'Please select a reader first.' }, { status: 400 });
    }
    if (!Number.isInteger(amountCents) || (amountCents as number) <= 0) {
      return NextResponse.json({ error: 'Enter a valid amount.' }, { status: 400 });
    }
    if ((amountCents as number) < 50) {
      // Stripe's minimum charge is $0.50 USD.
      return NextResponse.json({ error: 'Minimum charge is $0.50.' }, { status: 400 });
    }
    if ((amountCents as number) > MAX_AMOUNT_CENTS) {
      return NextResponse.json({ error: 'Amount exceeds the register limit.' }, { status: 400 });
    }

    const trimmedNote = (note ?? '').trim().slice(0, 200);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents as number,
      currency: 'usd',
      payment_method_types: ['card_present'],
      capture_method: 'automatic',
      description: `Register sale${trimmedNote ? ` – ${trimmedNote}` : ''}`,
      metadata: {
        site: 'tkd',
        source: 'admin_register',
        note: trimmedNote,
      },
    });

    try {
      await stripe.terminal.readers.processPaymentIntent(readerId.trim(), {
        payment_intent: paymentIntent.id,
        process_config: { enable_customer_cancellation: true },
      });
    } catch (err) {
      // The reader couldn't accept the job — cancel the dangling PaymentIntent so
      // it doesn't linger in `requires_payment_method`.
      await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => {});
      return NextResponse.json({ error: readerErrMsg(err) }, { status: 409 });
    }

    return NextResponse.json({ paymentIntentId: paymentIntent.id });
  } catch (err) {
    return NextResponse.json({ error: stripeErrMsg(err) }, { status: 500 });
  }
}

/** Turn Terminal-specific error codes into staff-friendly messages. */
function readerErrMsg(err: unknown): string {
  const code = (err as { code?: string })?.code;
  switch (code) {
    case 'terminal_reader_busy':
      return 'The reader is busy with another payment. Wait a moment and try again.';
    case 'terminal_reader_offline':
      return 'The reader is offline. Check that it is powered on and connected to Wi-Fi.';
    case 'terminal_reader_timeout':
      return 'The reader did not respond. Please try again.';
    default:
      return stripeErrMsg(err);
  }
}
