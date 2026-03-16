import { put, list } from '@vercel/blob';
import type { User } from './types';

const USER_PREFIX = 'tkd-users/';

/**
 * Fetches a user record from Vercel Blob by username.
 * Runs server-side only (requires BLOB_READ_WRITE_TOKEN).
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const prefix = `${USER_PREFIX}${username.toLowerCase().trim()}.json`;
    const { blobs } = await list({ prefix });
    if (blobs.length === 0) return null;

    // Sort descending so we always read the most recently written version
    const latest = blobs.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    )[0];
    const res = await fetch(latest.url, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as User;
  } catch {
    return null;
  }
}

/**
 * Persists a new user record to Vercel Blob.
 * Blob key: tkd-users/{username}.json
 */
export async function createUser(user: User): Promise<void> {
  await put(`${USER_PREFIX}${user.username.toLowerCase().trim()}.json`, JSON.stringify(user), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}

/**
 * Updates an existing user record (overwrites the blob).
 */
export async function updateUser(user: User): Promise<void> {
  const updated: User = { ...user, updatedAt: new Date().toISOString() };
  await put(`${USER_PREFIX}${user.username.toLowerCase().trim()}.json`, JSON.stringify(updated), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}
