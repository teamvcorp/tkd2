import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import client from '@/lib/mongodb';
import { stripe } from '@/lib/stripe';
import type { User, PublicUser, Kid } from '@/lib/types';

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
    phone: u.phone ?? '',
    kids: u.kids ?? [],
    stripeCustomerId: u.stripeCustomerId,
    hasPaymentMethod: !!u.stripePaymentMethodId,
    registrationStatus: u.registrationStatus,
    purchases: u.purchases ?? [],
    paymentPlanRequests: u.paymentPlanRequests ?? [],
    archived: u.archived,
  }));

  return NextResponse.json({ users });
}

/**
 * Admin-driven user creation. Used when a parent calls in or shows up in
 * person and the admin needs to set up their account without making them
 * complete the public sign-up flow.
 *
 * Body fields:
 *   - parentName, parentAge, phone, username (email)  → required
 *   - kids: optional Kid[] (each kid stored with status='pending')
 *   - password: optional. If omitted the user is created WITHOUT a password
 *     hash (locked — admin uses Reset Password to set one later).
 *   - stripeCustomerId: optional. If provided, the existing Stripe customer
 *     is linked (and its email/name/phone updated to match). If omitted, a
 *     new Stripe customer is created so the user can be charged later.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    username?: string;
    password?: string;
    parentName?: string;
    parentAge?: number | string;
    phone?: string;
    kids?: Kid[];
    stripeCustomerId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const username = String(body.username ?? '').trim().toLowerCase();
  const parentName = String(body.parentName ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const parentAge = body.parentAge === undefined || body.parentAge === ''
    ? 0
    : Number(body.parentAge);
  const password = body.password ? String(body.password) : '';
  const stripeCustomerIdInput = body.stripeCustomerId
    ? String(body.stripeCustomerId).trim()
    : '';

  // Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(username)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (!parentName) {
    return NextResponse.json({ error: 'Parent name is required.' }, { status: 400 });
  }
  if (!Number.isFinite(parentAge) || parentAge < 0 || parentAge > 120) {
    return NextResponse.json({ error: 'Parent age must be between 0 and 120.' }, { status: 400 });
  }
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) {
      return NextResponse.json({ error: 'Phone number is too short.' }, { status: 400 });
    }
  }
  if (password && password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  // Uniqueness
  const existing = await col().findOne(
    { $or: [{ username }, ...(stripeCustomerIdInput ? [{ stripeCustomerId: stripeCustomerIdInput }] : [])] },
    { projection: { _id: 0, id: 1, username: 1, stripeCustomerId: 1 } },
  );
  if (existing) {
    return NextResponse.json(
      { error: 'An account already exists for that email or Stripe customer.' },
      { status: 409 },
    );
  }

  // ── Stripe customer: link existing or create new ───────────────────────────
  let stripeCustomerId: string | undefined;
  try {
    if (stripeCustomerIdInput) {
      // Link an existing customer and sync contact info onto it.
      const c = await stripe.customers.retrieve(stripeCustomerIdInput);
      if (c.deleted) {
        return NextResponse.json({ error: 'That Stripe customer is deleted.' }, { status: 400 });
      }
      await stripe.customers.update(stripeCustomerIdInput, {
        email: username,
        name: parentName,
        phone: phone || undefined,
      });
      stripeCustomerId = stripeCustomerIdInput;
    } else {
      const created = await stripe.customers.create({
        email: username,
        name: parentName,
        phone: phone || undefined,
        metadata: { username, addedBy: 'admin' },
      });
      stripeCustomerId = created.id;
    }
  } catch (err) {
    // Non-fatal: create the Mongo user anyway so admin doesn't lose the data
    // entered, and they can link Stripe later via the contact editor.
    console.error('admin POST /users: Stripe customer step failed', err);
  }

  // ── Build + insert user ────────────────────────────────────────────────────
  const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;
  const now = new Date().toISOString();

  const newUser: User = {
    id: crypto.randomUUID(),
    username,
    // passwordHash is omitted entirely when no password provided (locked).
    ...(passwordHash ? { passwordHash } : {}) as { passwordHash: string },
    parentName,
    parentAge,
    phone,
    kids: (body.kids ?? []).map((k) => ({
      name: String(k.name ?? '').trim(),
      age: Number(k.age ?? 0),
      rank: String(k.rank ?? 'white'),
      program: k.program || undefined,
      status: 'pending' as const,
    })),
    stripeCustomerId,
    registrationStatus: 'pending-payment',
    createdAt: now,
    updatedAt: now,
  };

  await col().insertOne(newUser);

  // Strip passwordHash before returning
  const { passwordHash: _omit, ...safe } = newUser;
  void _omit;
  return NextResponse.json({ success: true, user: safe }, { status: 201 });
}
