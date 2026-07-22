// ─── Stripe Terminal settings ─────────────────────────────────────────────────
// Persists which physical reader this site currently uses. The reader itself is
// registered ONCE in the Stripe Dashboard against the shared Stripe account and
// may be shared by other sites — so we store only a *selection* here, never
// registration state. SERVER-ONLY — never imported by client components.

import 'server-only';
import { unstable_noStore as noStore } from 'next/cache';
import client from './mongodb';

const DB = process.env.MONGODB_DATABASE ?? 'tkd';
// Reuse the same single-document pattern as lib/hero.ts (keyed by `id`, not _id,
// so the app never has to deal with Mongo ObjectId construction).
const col = () => client.db(DB).collection('settings');
const KEY = 'terminal';

export interface TerminalSettings {
  /** Stripe Terminal reader id (`tmr_…`) selected for this site, if any. */
  readerId?: string;
}

/** Read the saved Terminal settings (empty object if never saved). */
export async function getTerminalSettings(): Promise<TerminalSettings> {
  noStore();
  const doc = await col().findOne({ id: KEY }, { projection: { _id: 0, id: 0 } });
  return (doc as unknown as TerminalSettings) ?? {};
}

/** Persist the selected reader id. */
export async function setTerminalReader(readerId: string): Promise<void> {
  await col().updateOne(
    { id: KEY },
    { $set: { id: KEY, readerId, updatedAt: new Date().toISOString() } },
    { upsert: true },
  );
}
