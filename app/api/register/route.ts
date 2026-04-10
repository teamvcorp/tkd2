import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByUsername, createUser } from '@/lib/userStore';
import type { User, Kid } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, parentName, parentAge, kids, stripeCustomerId, stripePaymentMethodId } = body as {
      username: string;
      password: string;
      parentName: string;
      parentAge: number;
      kids: Kid[];
      stripeCustomerId?: string;
      stripePaymentMethodId?: string;
    };

    // --- Input validation ---
    if (!username || !password || !parentName || parentAge == null) {
      return NextResponse.json({ error: 'All required fields must be filled in.' }, { status: 400 });
    }
    // Username must be a valid email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    // --- Check uniqueness ---
    const existing = await getUserByUsername(username);
    if (existing) {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    }

    // --- Hash password ---
    const passwordHash = await bcrypt.hash(password, 12);

    // --- Build user record ---
    const newUser: User = {
      id: crypto.randomUUID(),
      username: username.toLowerCase().trim(),
      passwordHash,
      parentName: parentName.trim(),
      parentAge: Number(parentAge),
      kids: (kids ?? []).map((k) => ({
        name: k.name.trim(),
        age: Number(k.age),
        rank: k.rank,
        program: k.program,
        status: 'pending' as const,
      })),
      stripeCustomerId,
      stripePaymentMethodId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await createUser(newUser);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
