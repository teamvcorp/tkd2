import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe } from '@/lib/stripe';
import { getUserByUsername, updateUser } from '@/lib/userStore';

/**
 * GET – return saved card details (brand + last4) for the current user.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const username =
      (session.user as { username?: string }).username ?? session.user.email ?? '';

    const user = await getUserByUsername(username);
    if (!user || !user.stripePaymentMethodId) {
      return NextResponse.json({ card: null });
    }

    const pm = await stripe.paymentMethods.retrieve(user.stripePaymentMethodId);
    return NextResponse.json({
      card: pm.card
        ? { brand: pm.card.brand, last4: pm.card.last4, expMonth: pm.card.exp_month, expYear: pm.card.exp_year }
        : null,
    });
  } catch (err) {
    console.error('settings/payment GET error:', err);
    return NextResponse.json({ card: null });
  }
}

/**
 * POST – create a new SetupIntent for the user's existing Stripe customer
 *        so they can update their saved payment method.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const username =
      (session.user as { username?: string }).username ?? session.user.email ?? '';

    const user = await getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    if (!user.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer on file.' }, { status: 400 });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: user.stripeCustomerId,
      automatic_payment_methods: { enabled: true },
      metadata: { username },
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });
  } catch (err) {
    console.error('settings/payment POST error:', err);
    return NextResponse.json({ error: 'Could not start card update.' }, { status: 500 });
  }
}

/**
 * PATCH – save the newly confirmed payment method ID to the user record
 *         and set it as the default on the Stripe customer.
 */
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentMethodId } = (await request.json()) as { paymentMethodId?: string };
    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Missing paymentMethodId.' }, { status: 400 });
    }

    const username =
      (session.user as { username?: string }).username ?? session.user.email ?? '';

    const user = await getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Set as the default payment method on the Stripe customer
    if (user.stripeCustomerId) {
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    }

    await updateUser({ ...user, stripePaymentMethodId: paymentMethodId });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('settings/payment PATCH error:', err);
    return NextResponse.json({ error: 'Could not save card.' }, { status: 500 });
  }
}
