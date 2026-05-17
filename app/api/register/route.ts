import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByUsername, createUser, updateUser } from '@/lib/userStore';
import { stripe, assertStripeKey, stripeErrMsg } from '@/lib/stripe';
import type { User, Kid } from '@/lib/types';

/**
 * Registration endpoint.
 *
 * Order of operations is important: the Mongo user is created FIRST so we
 * never end up with orphaned Stripe customers from abandoned sign-ups.
 *
 *   1. Validate input (incl. required phone number).
 *   2. Insert user row in Mongo with registrationStatus = 'pending-payment'.
 *   3. Create Stripe customer with email/name/phone (so it's identifiable in
 *      the Stripe dashboard and we can contact the customer).
 *   4. Create a SetupIntent so the client can collect/save a card.
 *   5. Save the new stripeCustomerId on the user row.
 *   6. Return the SetupIntent client_secret so the client can confirm the card.
 *
 * If anything in steps 3-5 fails, the Mongo row still exists with
 * registrationStatus = 'pending-payment' — admin can see and follow up.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, parentName, parentAge, phone, kids } = body as {
      username: string;
      password: string;
      parentName: string;
      parentAge: number;
      phone: string;
      kids: Kid[];
    };

    // --- Input validation ---
    if (!username || !password || !parentName || parentAge == null || !phone) {
      return NextResponse.json({ error: 'All required fields must be filled in.' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    // Phone: require at least 7 digits (lenient, lets us store formatted numbers)
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) {
      return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 });
    }

    // --- Check uniqueness ---
    const existing = await getUserByUsername(username);
    if (existing) {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    }

    // --- Hash password & build user record ---
    const passwordHash = await bcrypt.hash(password, 12);
    const cleanUsername = username.toLowerCase().trim();
    const cleanParentName = parentName.trim();
    const cleanPhone = phone.trim();

    const newUser: User = {
      id: crypto.randomUUID(),
      username: cleanUsername,
      passwordHash,
      parentName: cleanParentName,
      parentAge: Number(parentAge),
      phone: cleanPhone,
      kids: (kids ?? []).map((k) => ({
        name: k.name.trim(),
        age: Number(k.age),
        rank: k.rank,
        program: k.program,
        status: 'pending' as const,
      })),
      registrationStatus: 'pending-payment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1) Persist the Mongo user first — guarantees no orphaned Stripe customers.
    await createUser(newUser);

    // 2) Create the Stripe customer with full contact info.
    try {
      assertStripeKey();
      const customer = await stripe.customers.create({
        email: cleanUsername,
        name: cleanParentName,
        phone: cleanPhone,
        metadata: { username: cleanUsername, userId: newUser.id },
      });

      const setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
        automatic_payment_methods: { enabled: true },
        metadata: { username: cleanUsername, userId: newUser.id },
      });

      // 3) Persist the new Stripe customer id on the user row.
      await updateUser({ ...newUser, stripeCustomerId: customer.id });

      return NextResponse.json({
        success: true,
        customerId: customer.id,
        clientSecret: setupIntent.client_secret,
      });
    } catch (stripeErr) {
      // The Mongo user exists — surface the Stripe error so the client can
      // show "complete payment setup" and so admin sees them as pending.
      const msg = stripeErrMsg(stripeErr);
      console.error('register: Stripe setup failed', msg, stripeErr);
      return NextResponse.json(
        { success: true, pendingPayment: true, error: msg },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
