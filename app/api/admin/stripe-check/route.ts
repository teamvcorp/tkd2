import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { stripe } from '@/lib/stripe';

/**
 * GET /api/admin/stripe-check
 * Admin-only. Returns Stripe connectivity status without exposing secrets.
 * Visit this URL while logged in as admin to diagnose Stripe 500 errors.
 */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const keyPresent = !!process.env.STRIPE_SECRET_KEY;
  const keyMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')
    ? 'live'
    : process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')
    ? 'test'
    : 'unknown/missing';
  const webhookSecretPresent = !!process.env.STRIPE_WEBHOOK_SECRET;
  const pubKeyMode = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_')
    ? 'live'
    : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_')
    ? 'test'
    : 'unknown/missing';

  if (!keyPresent) {
    return NextResponse.json({
      ok: false,
      error: 'STRIPE_SECRET_KEY is not set in environment variables.',
      keyPresent,
      keyMode,
      pubKeyMode,
      webhookSecretPresent,
    });
  }

  try {
    // Retrieve account info — the minimal call that validates the key
    const account = await stripe.accounts.retrieve();
    return NextResponse.json({
      ok: true,
      keyMode,
      pubKeyMode,
      webhookSecretPresent,
      stripeAccountId: account.id,
      stripeEmail: account.email,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      country: account.country,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      ok: false,
      error: message,
      keyMode,
      pubKeyMode,
      webhookSecretPresent,
    });
  }
}
