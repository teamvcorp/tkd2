// ─── Hero service layer ────────────────────────────────────────────────────────
// Single-document hero config for the landing page (video mode or gallery mode).
// SERVER-ONLY — never imported by client components.

import 'server-only';
import { unstable_noStore as noStore } from 'next/cache';
import client from './mongodb';
import type { HeroConfig } from './hero-types';
export type { HeroConfig, HeroItem, HeroMode } from './hero-types';

const DB = process.env.MONGODB_DATABASE ?? 'tkd';
const col = () => client.db(DB).collection('hero');

/** Read the singleton hero config (null if never saved). */
export async function getHero(): Promise<HeroConfig | null> {
  noStore();
  const doc = await col().findOne({ id: 'hero' }, { projection: { _id: 0 } });
  return (doc as unknown as HeroConfig) ?? null;
}

/** Create or fully replace the singleton hero config. */
export async function saveHero(config: HeroConfig): Promise<void> {
  await col().updateOne(
    { id: 'hero' },
    { $set: { ...config, id: 'hero' } },
    { upsert: true },
  );
}
