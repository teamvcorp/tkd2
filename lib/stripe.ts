import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY ?? '';

export const stripe = new Stripe(key || 'sk_invalid_placeholder');

export function assertStripeKey(): void {
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set in Vercel environment variables.');
}

/** Call this in catch blocks to get a clean message from Stripe errors or generic Errors. */
export function stripeErrMsg(err: unknown): string {
  if (err instanceof Stripe.errors.StripeError) return `Stripe: ${err.message}`;
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}
