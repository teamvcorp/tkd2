import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserByUsername, updateUser } from '@/lib/userStore';
import type { PublicUser, Kid } from '@/lib/types';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const username =
    (session.user as { username?: string }).username ?? session.user.email ?? '';

  const user = await getUserByUsername(username);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Auto-expire kids whose subscription has passed its end date
  const now = new Date();
  let hasChanges = false;
  const updatedKids = user.kids.map((kid) => {
    if (kid.status === 'active' && kid.expiresAt && new Date(kid.expiresAt) < now) {
      hasChanges = true;
      return { ...kid, status: 'inactive' as const };
    }
    return kid;
  });
  if (hasChanges) {
    await updateUser({ ...user, kids: updatedKids });
  }

  const publicUser: PublicUser = {
    id: user.id,
    username: user.username,
    parentName: user.parentName,
    parentAge: user.parentAge,
    kids: hasChanges ? updatedKids : user.kids,
    stripeCustomerId: user.stripeCustomerId,
    hasPaymentMethod: !!user.stripePaymentMethodId,
    purchases: user.purchases ?? [],
    paymentPlanRequests: user.paymentPlanRequests ?? [],
  };

  return NextResponse.json(publicUser);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const username =
    (session.user as { username?: string }).username ?? session.user.email ?? '';

  const user = await getUserByUsername(username);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const body = await request.json() as { addKid: Omit<Kid, 'status'> };
  if (!body.addKid?.name?.trim()) {
    return NextResponse.json({ error: 'Student name is required.' }, { status: 400 });
  }

  const newKid: Kid = {
    name: body.addKid.name.trim(),
    age: Number(body.addKid.age),
    rank: body.addKid.rank || 'white',
    program: body.addKid.program || undefined,
    status: 'pending',
  };

  await updateUser({ ...user, kids: [...user.kids, newKid] });
  return NextResponse.json({ success: true, kid: newKid });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const username =
    (session.user as { username?: string }).username ?? session.user.email ?? '';

  const user = await getUserByUsername(username);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const body = await request.json() as { kidIndex?: number };
  const { kidIndex } = body;

  if (typeof kidIndex !== 'number' || kidIndex < 0 || kidIndex >= user.kids.length) {
    return NextResponse.json({ error: 'Invalid kidIndex' }, { status: 400 });
  }

  const kid = user.kids[kidIndex];
  if (kid.status !== 'pending') {
    return NextResponse.json({ error: 'Only students with no payment history can be removed.' }, { status: 403 });
  }

  const updatedKids = user.kids.filter((_, i) => i !== kidIndex);

  // Remove any pending payment plan requests for this kid.
  // Shift kidIndex references for kids that come after the deleted one.
  const updatedRequests = (user.paymentPlanRequests ?? [])
    .filter((r) => r.kidIndex !== kidIndex)
    .map((r) => r.kidIndex > kidIndex ? { ...r, kidIndex: r.kidIndex - 1 } : r);

  await updateUser({ ...user, kids: updatedKids, paymentPlanRequests: updatedRequests });
  return NextResponse.json({ success: true });
}
