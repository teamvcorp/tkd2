import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import client from '@/lib/mongodb';
import { stripe } from '@/lib/stripe';
import type { Kid } from '@/lib/types';

const DB = process.env.MONGODB_DATABASE ?? 'tkd';
const col = () => client.db(DB).collection('users');

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  if (body.parentName !== undefined) updates.parentName = String(body.parentName).trim();
  if (body.parentAge !== undefined) updates.parentAge = Number(body.parentAge);
  if (body.archived !== undefined) updates.archived = Boolean(body.archived);

  // Associate an existing (e.g. manually-created) Stripe customer with this
  // user so their card/payments live under the right customer. Validate the
  // id against Stripe and guard against linking one already used by someone else.
  if (body.stripeCustomerId !== undefined) {
    const cid = String(body.stripeCustomerId).trim();
    if (cid) {
      const clash = await col().findOne(
        { stripeCustomerId: cid, id: { $ne: id } },
        { projection: { _id: 0, id: 1 } },
      );
      if (clash) {
        return NextResponse.json(
          { error: 'That Stripe customer is already linked to another account.' },
          { status: 409 },
        );
      }
      try {
        const customer = await stripe.customers.retrieve(cid);
        if ((customer as { deleted?: boolean }).deleted) {
          return NextResponse.json({ error: 'That Stripe customer has been deleted.' }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: 'No Stripe customer found with that ID.' }, { status: 400 });
      }
      updates.stripeCustomerId = cid;
    }
  }

  if (body.kids !== undefined) {
    updates.kids = (body.kids as Kid[]).map((k) => ({
      name: String(k.name ?? '').trim(),
      age: Number(k.age ?? 0),
      rank: String(k.rank ?? 'white'),
      program: k.program || undefined,
      status: k.status ?? 'pending',
      expiresAt: k.expiresAt || undefined,
      stripePaymentIntentId: k.stripePaymentIntentId || undefined,
      avatarUrl: k.avatarUrl || undefined,
    }));
  }

  const result = await col().updateOne({ id }, { $set: updates });
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

/**
 * Permanently and fully delete a user account.
 *
 * Kids and payment-plan history are embedded in the user document, so removing
 * the document removes them too. The linked Stripe customer is deleted on a
 * best-effort basis so the email can be reused cleanly and no orphaned customer
 * is left behind. This is a hard delete with no archive requirement — the admin
 * UI gates it behind a typed confirmation.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const user = await col().findOne({ id }, { projection: { _id: 0, stripeCustomerId: 1 } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await col().deleteOne({ id });

  // Best-effort Stripe cleanup: a failure here must not leave the Mongo record
  // (already gone) out of sync — the account is considered deleted regardless.
  const customerId = (user as { stripeCustomerId?: string }).stripeCustomerId;
  if (customerId) {
    try {
      await stripe.customers.del(customerId);
    } catch (err) {
      console.error(`admin delete: Stripe customer cleanup failed for ${customerId}`, err);
    }
  }

  return NextResponse.json({ success: true });
}
