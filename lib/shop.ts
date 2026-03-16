// ─── Pro Shop service layer ───────────────────────────────────────────────────
// All product data lives exclusively in Vercel Blob (shop-config/products.json).
// Use the admin dashboard (/admin) to create, edit and delete products.

import { put, list } from '@vercel/blob';

const PRODUCTS_BLOB_KEY = 'shop-config/products.json';

export type ShopCategory = 'Uniforms' | 'Sparring Gear' | 'Training Gear' | 'Extras';

export const SHOP_CATEGORIES: ShopCategory[] = [
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

// ─── Blob read / write ────────────────────────────────────────────────────────

export async function getProducts(): Promise<ShopProduct[]> {
  try {
    const { blobs } = await list({ prefix: PRODUCTS_BLOB_KEY });
    if (blobs.length === 0) return [];
    const res = await fetch(blobs[0].url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    if (!res.ok) return [];
    return (await res.json()) as ShopProduct[];
  } catch {
    return [];
  }
}

export async function saveProducts(products: ShopProduct[]): Promise<void> {
  await put(PRODUCTS_BLOB_KEY, JSON.stringify(products), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function updateProduct(
  productId: string,
  patch: Partial<ShopProduct>,
): Promise<void> {
  const products = await getProducts();
  const updated = products.map((p) => (p.id === productId ? { ...p, ...patch } : p));
  await saveProducts(updated);
}

export async function getProductById(id: string): Promise<ShopProduct | undefined> {
  const products = await getProducts();
  return products.find((p) => p.id === id);
}

export async function addProduct(product: ShopProduct): Promise<void> {
  const products = await getProducts();
  await saveProducts([...products, product]);
}

export async function deleteProduct(id: string): Promise<void> {
  const products = await getProducts();
  await saveProducts(products.filter((p) => p.id !== id));
}