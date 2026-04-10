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
const archiveCol = () => client.db(DB).collection('promo_archive');

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

/** Save a promo snapshot into the archive (upsert by description to avoid duplicates). */
export async function archivePromo(promo: Promo): Promise<void> {
  await archiveCol().updateOne(
    { description: promo.description },
    { $set: { ...promo, archivedAt: new Date().toISOString() } },
    { upsert: true },
  );
}

/** List all archived promos, most recent first. */
export async function listPromoArchive(): Promise<Promo[]> {
  noStore();
  const docs = await archiveCol()
    .find({}, { projection: { _id: 0 } })
    .sort({ archivedAt: -1 })
    .limit(50)
    .toArray();
  return docs as unknown as Promo[];
}
