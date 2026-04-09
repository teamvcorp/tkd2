// ─── Promo shared types ───────────────────────────────────────────────────────
// Safe to import from both client and server components.

export interface PromoProduct {
  productId: string;          // unique within this promo
  name: string;
  price: number;              // in cents USD
  stripeProductId: string;
  stripePriceId: string;
}

export interface Promo {
  id: string;
  description: string;
  price: number;              // in cents USD (e.g. 2500 = $25.00)
  quantity: number;           // qty available
  imageSrc: string;           // Vercel Blob URL
  stripeProductId: string;    // Stripe Product ID
  stripePriceId: string;      // Stripe Price ID
  active: boolean;
  updatedAt: string;          // ISO datetime
  products?: PromoProduct[];  // optional additional items
}

export function formatPromoPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
