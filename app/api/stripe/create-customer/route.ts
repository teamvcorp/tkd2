import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

/**
 * Creates a Stripe Customer for the parent and returns a Setup Intent
 * client_secret so the client can collect and save a payment method.
 */
export async function POST(request: Request) {
  try {
    const { parentName, username } = await request.json() as {
      parentName: string;
      username: string;
    };

    if (!parentName || !username) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const customer = await stripe.customers.create({
      name: parentName,
      metadata: { username: username.toLowerCase().trim() },
    });

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
      metadata: { username: username.toLowerCase().trim() },
    });

    return NextResponse.json({
      customerId: customer.id,
      clientSecret: setupIntent.client_secret,
    });
  } catch (err) {
    console.error('create-customer error:', err);
    return NextResponse.json({ error: 'Failed to create payment profile' }, { status: 500 });
  }
}
