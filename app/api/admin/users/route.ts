import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import client from '@/lib/mongodb';
import type { User, PublicUser } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DB = process.env.MONGODB_DATABASE ?? 'tkd';
const col = () => client.db(DB).collection('users');

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const docs = await col()
    .find({}, { projection: { _id: 0, passwordHash: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  const users: (PublicUser & { archived?: boolean })[] = (docs as unknown as Omit<User, 'passwordHash'>[]).map((u) => ({
    id: u.id,
    username: u.username,
    parentName: u.parentName,
    parentAge: u.parentAge,
    kids: u.kids ?? [],
    stripeCustomerId: u.stripeCustomerId,
    hasPaymentMethod: !!u.stripePaymentMethodId,
    purchases: u.purchases ?? [],
    archived: u.archived,
  }));

  return NextResponse.json({ users });
}
