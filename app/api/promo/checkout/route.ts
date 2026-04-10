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

    const { quantity, name, email, productId, notes } = (await request.json()) as {
      quantity: number;
      name: string;
      email: string;
      productId?: string;  // optional: buy a specific product instead of main promo
      notes?: string;      // optional customer notes / special requests
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

    let unitPrice: number;
    let itemDescription: string;

    if (productId && promo.products?.length) {
      const product = promo.products.find(p => p.productId === productId);
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found in this promo.' },
          { status: 404 },
        );
      }
      unitPrice = product.price;
      itemDescription = product.name;
    } else {
      unitPrice = promo.price;
      itemDescription = promo.description;
    }

    const amount = unitPrice * qty;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      description: `Promo: ${itemDescription} (x${qty})`,
      metadata: {
        type: 'promo_order',
        promoId: promo.id,
        promoDescription: itemDescription,
        quantity: String(qty),
        customerName: name.trim(),
        customerEmail: email.trim(),
        ...(notes?.trim() ? { customerNotes: notes.trim() } : {}),
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    return NextResponse.json({ error: stripeErrMsg(err) }, { status: 500 });
  }
}
