import { unstable_noStore as noStore } from 'next/cache';
import client from './mongodb';
import type { User } from './types';

const DB = process.env.MONGODB_DATABASE ?? 'tkd';
const col = () => client.db(DB).collection('users');

export async function getUserByUsername(username: string): Promise<User | null> {
  noStore();
  const doc = await col().findOne(
    { username: username.toLowerCase().trim() },
    { projection: { _id: 0 } },
  );
  return doc as User | null;
}

export async function createUser(user: User): Promise<void> {
  await col().insertOne({ ...user, username: user.username.toLowerCase().trim() });
}

export async function updateUser(user: User): Promise<void> {
  const updated: User = { ...user, updatedAt: new Date().toISOString() };
  await col().replaceOne(
    { username: user.username.toLowerCase().trim() },
    { ...updated, username: updated.username.toLowerCase().trim() },
    { upsert: true },
  );
}
