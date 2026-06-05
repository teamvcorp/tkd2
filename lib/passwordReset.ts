import 'server-only';
import crypto from 'crypto';
import { unstable_noStore as noStore } from 'next/cache';
import client from './mongodb';

/**
 * Self-service password reset tokens.
 *
 * Design notes:
 *  - The raw token (sent in the email link) is high-entropy random bytes, so we
 *    store only its SHA-256 hash. A DB leak therefore can't be used to reset
 *    anyone's password.
 *  - Tokens are single-use and expire after TOKEN_TTL_MS. We also delete any
 *    prior tokens for the same user when issuing a new one, so the latest email
 *    is the only valid link.
 *  - `expiresAt` is a real Date so a Mongo TTL index can sweep stale rows. We
 *    still re-check expiry on read in case the index isn't present.
 */

const DB = process.env.MONGODB_DATABASE ?? 'tkd';
const col = () => client.db(DB).collection('passwordResets');

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

interface ResetTokenDoc {
  tokenHash: string;
  username: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Create a reset token for the given (already-validated) username and return
 * the RAW token to embed in the email link. Invalidates any existing tokens
 * for that user first.
 */
export async function createResetToken(username: string): Promise<string> {
  const clean = username.toLowerCase().trim();
  const token = crypto.randomBytes(32).toString('hex');
  const doc: ResetTokenDoc = {
    tokenHash: hashToken(token),
    username: clean,
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    createdAt: new Date(),
  };

  await col().deleteMany({ username: clean });
  await col().insertOne(doc);
  return token;
}

/**
 * Look up the username for a raw token if it is valid and unexpired.
 * Returns null for missing/expired tokens (expired ones are cleaned up).
 */
export async function getUsernameForToken(token: string): Promise<string | null> {
  noStore();
  if (!token) return null;
  const doc = (await col().findOne({ tokenHash: hashToken(token) })) as ResetTokenDoc | null;
  if (!doc) return null;

  if (new Date(doc.expiresAt).getTime() < Date.now()) {
    await col().deleteOne({ tokenHash: doc.tokenHash });
    return null;
  }
  return doc.username;
}

/** Consume (delete) a token once a reset has succeeded. */
export async function consumeResetToken(token: string): Promise<void> {
  await col().deleteOne({ tokenHash: hashToken(token) });
}
