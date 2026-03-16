import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe, assertStripeKey, stripeErrMsg } from '@/lib/stripe';
import { getUserByUsername, updateUser } from '@/lib/userStore';
import { getProductById } from '@/lib/shop';
import type { Purchase } from '@/lib/types';
import { sendOrderEmail } from '@/lib/email';
export async function POST(request: Request) {
  try {
    assertStripeKey();
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, size, fulfillment, shippingAddress } = await request.json() as {
      productId: string;
      size?: string;
      fulfillment: 'ship' | 'pickup';
      shippingAddress?: string;
    };

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }
    if (!fulfillment) {
      return NextResponse.json({ error: 'Please choose ship or pickup.' }, { status: 400 });
    }
    if (fulfillment === 'ship' && !shippingAddress?.trim()) {
      return NextResponse.json({ error: 'Please enter a shipping address.' }, { status: 400 });
    }

    const username =
      (session.user as { username?: string }).username ?? session.user.email ?? '';

    const user = await getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    if (!user.stripeCustomerId || !user.stripePaymentMethodId) {
      return NextResponse.json({ error: 'No payment method on file.' }, { status: 400 });
    }

    const product = await getProductById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    if (!product.inStock) {
      return NextResponse.json({ error: 'This item is currently out of stock.' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: product.price,
      currency: 'usd',
      customer: user.stripeCustomerId,
      payment_method: user.stripePaymentMethodId,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      description: `Pro Shop – ${product.name}${size ? ` (Size: ${size})` : ''} [${fulfillment}]`,
      metadata: {
        username,
        productId: product.id,
        productName: product.name,
        size: size ?? '',
        category: product.category,
        fulfillment,
        shippingAddress: shippingAddress ?? '',
        type: 'shop_order',
      },
    });

    if (paymentIntent.status === 'succeeded') {
      const purchase: Purchase = {
        id: paymentIntent.id,
        productId: product.id,
        productName: product.name,
        category: product.category,
        size: size,
        fulfillment,
        shippingAddress: fulfillment === 'ship' ? shippingAddress : undefined,
        amount: product.price,
        purchasedAt: new Date().toISOString(),
      };
      const purchases = [...(user.purchases ?? []), purchase];
      await updateUser({ ...user, purchases });

      // Send admin order notification – fire-and-forget, don't block response
      sendOrderEmail({ parentName: user.parentName, username, purchase }).catch((e) =>
        console.error('Order email failed:', e),
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Payment did not complete.', stripeStatus: paymentIntent.status },
      { status: 402 },
    );
  } catch (err) {
    const msg = stripeErrMsg(err);
    console.error('shop-order error:', msg, err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
