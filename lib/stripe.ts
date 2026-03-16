import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY ?? '';

// Throws lazily at call-time rather than crashing all routes at module init.
export const stripe = new Stripe(key || 'invalid_key_placeholder');

export function assertStripeKey(): void {
  if (!key) throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}
