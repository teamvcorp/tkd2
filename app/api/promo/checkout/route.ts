import { NextResponse } from 'next/server';
import { stripe, assertStripeKey, stripeErrMsg } from '@/lib/stripe';
import { getPromo } from '@/lib/promo';

/**
 * Creates a Stripe PaymentIntent for the current promo.
 * No auth required — anyone can purchase the promo.
 */
export async function POST(request: Request) {
  try {
    assertStripeKey();

    const { quantity, name, email } = (await request.json()) as {
      quantity: number;
      name: string;
      email: string;
    };

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: 'Name and email are required.' },
        { status: 400 },
      );
    }

    const qty = Math.max(1, Math.floor(Number(quantity) || 1));

    const promo = await getPromo();
    if (!promo || !promo.active) {
      return NextResponse.json(
        { error: 'No active promo available.' },
        { status: 404 },
      );
    }

    if (promo.quantity > 0 && qty > promo.quantity) {
      return NextResponse.json(
        { error: `Only ${promo.quantity} left in stock.` },
        { status: 400 },
      );
    }

    const amount = promo.price * qty;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      description: `Promo: ${promo.description} (x${qty})`,
      metadata: {
        type: 'promo_order',
        promoId: promo.id,
        promoDescription: promo.description,
        quantity: String(qty),
        customerName: name.trim(),
        customerEmail: email.trim(),
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    return NextResponse.json({ error: stripeErrMsg(err) }, { status: 500 });
  }
}
