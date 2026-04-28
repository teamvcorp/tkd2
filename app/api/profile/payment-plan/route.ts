import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@/auth';
import { getUserByUsername, updateUser } from '@/lib/userStore';
import type { PaymentPlanRequest } from '@/lib/types';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json() as { kidIndex?: number; installments?: number };
  const { kidIndex, installments } = body;

  if (typeof kidIndex !== 'number') {
    return NextResponse.json({ error: 'Invalid kidIndex' }, { status: 400 });
  }
  if (![3, 6, 12].includes(installments as number)) {
    return NextResponse.json({ error: 'installments must be 3, 6, or 12' }, { status: 400 });
  }

  const username =
    (session.user as { username?: string }).username ?? session.user.email ?? '';
  const user = await getUserByUsername(username);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const kid = user.kids[kidIndex];
  if (!kid) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const existing = (user.paymentPlanRequests ?? []).find(
    (r) => r.kidIndex === kidIndex && (r.status === 'pending' || r.status === 'approved'),
  );
  if (existing) {
    return NextResponse.json(
      { error: 'A payment plan request already exists for this student' },
      { status: 409 },
    );
  }

  const newRequest: PaymentPlanRequest = {
    id: randomUUID(),
    kidIndex,
    installments: installments as 3 | 6 | 12,
    installmentsPaid: 0,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };

  await updateUser({
    ...user,
    paymentPlanRequests: [...(user.paymentPlanRequests ?? []), newRequest],
  });

  return NextResponse.json({ request: newRequest });
}
