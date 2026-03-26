// ─── Pro Shop service layer ───────────────────────────────────────────────────
// Product data lives in MongoDB. Images remain in Vercel Blob.
// Use the admin dashboard (/admin) to create, edit and delete products.
// SERVER-ONLY — never imported by client components.

import 'server-only';
import { unstable_noStore as noStore } from 'next/cache';
import client from './mongodb';
import type { ShopProduct } from './shop-types';
export type { ShopCategory, ShopProduct } from './shop-types';
export { SHOP_CATEGORIES, formatShopPrice } from './shop-types';

const DB = process.env.MONGODB_DATABASE ?? 'tkd';
const col = () => client.db(DB).collection('products');

// ─── MongoDB read / write ─────────────────────────────────────────────────────

export async function getProducts(): Promise<ShopProduct[]> {
  noStore();
  const docs = await col().find({}, { projection: { _id: 0 } }).toArray();
  return docs as unknown as ShopProduct[];
}

export async function getProductById(id: string): Promise<ShopProduct | undefined> {
  noStore();
  const doc = await col().findOne({ id }, { projection: { _id: 0 } });
  return (doc as unknown as ShopProduct) ?? undefined;
}

export async function addProduct(product: ShopProduct): Promise<void> {
  await col().insertOne({ ...product });
}

export async function updateProduct(
  productId: string,
  patch: Partial<ShopProduct>,
): Promise<void> {
  await col().updateOne({ id: productId }, { $set: patch });
}

export async function deleteProduct(id: string): Promise<void> {
  await col().deleteOne({ id });
}

// Bulk upsert — used for imports / seeding
export async function saveProducts(products: ShopProduct[]): Promise<void> {
  if (products.length === 0) return;
  const ops = products.map((p) => ({
    updateOne: { filter: { id: p.id }, update: { $set: p }, upsert: true },
  }));
  await col().bulkWrite(ops);
}