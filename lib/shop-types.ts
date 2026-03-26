// ─── Pro Shop shared types & constants ────────────────────────────────────────
// Safe to import from both client and server components.
// DB functions live in lib/shop.ts (server-only).

export type ShopCategory = 'Programs' | 'Uniforms' | 'Sparring Gear' | 'Training Gear' | 'Extras';

export const SHOP_CATEGORIES: ShopCategory[] = [
  'Programs',
  'Uniforms',
  'Sparring Gear',
  'Training Gear',
  'Extras',
];

export interface ShopProduct {
  id: string;
  name: string;
  description: string;
  price: number;            // in cents USD  (e.g. 4500 = $45.00)
  category: ShopCategory;
  imageSrc: string;
  imageAlt: string;
  stripeProductId: string;  // Stripe Product ID  – editable in /admin
  stripePriceId: string;    // Stripe Price ID    – editable in /admin
  sizes?: string[];
  inStock: boolean;
  quantity?: number;        // qty on hand – managed by admin
}

export function formatShopPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
