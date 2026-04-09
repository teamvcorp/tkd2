// ─── Promo service layer ──────────────────────────────────────────────────────
// Single-promo CRUD. Only one promo is "current" at a time.
// SERVER-ONLY — never imported by client components.

import 'server-only';
import { unstable_noStore as noStore } from 'next/cache';
import client from './mongodb';
import type { Promo } from './promo-types';
export type { Promo } from './promo-types';
export { formatPromoPrice } from './promo-types';

const DB = process.env.MONGODB_DATABASE ?? 'tkd';
const col = () => client.db(DB).collection('promo');

export async function getPromo(): Promise<Promo | null> {
  noStore();
  const doc = await col().findOne({}, { projection: { _id: 0 } });
  return (doc as unknown as Promo) ?? null;
}

export async function upsertPromo(promo: Promo): Promise<void> {
  await col().updateOne(
    { id: promo.id },
    { $set: promo },
    { upsert: true },
  );
}

export async function updatePromo(
  id: string,
  patch: Partial<Promo>,
): Promise<void> {
  await col().updateOne({ id }, { $set: patch });
}
