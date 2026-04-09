import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { getPromo, upsertPromo, updatePromo } from '@/lib/promo';
import type { Promo } from '@/lib/promo';

export const dynamic = 'force-dynamic';

/* GET — return the current promo (or null) */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const promo = await getPromo();
  return NextResponse.json({ promo });
}

/* POST — create or fully replace the current promo */
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as Partial<Promo>;

  if (!body.description || body.price == null || body.quantity == null) {
    return NextResponse.json(
      { error: 'description, price and quantity are required.' },
      { status: 400 },
    );
  }

  const existing = await getPromo();
  const id = existing?.id ?? crypto.randomUUID();

  const promo: Promo = {
    id,
    description: body.description,
    price: Number(body.price),
    quantity: Number(body.quantity),
    imageSrc: body.imageSrc ?? existing?.imageSrc ?? '',
    stripeProductId: body.stripeProductId ?? '',
    stripePriceId: body.stripePriceId ?? '',
    active: body.active ?? true,
    updatedAt: new Date().toISOString(),
    products: body.products ?? existing?.products ?? [],
  };

  await upsertPromo(promo);
  return NextResponse.json({ promo });
}

/* PATCH — partial update of the current promo */
export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const existing = await getPromo();
  if (!existing) {
    return NextResponse.json({ error: 'No promo exists yet.' }, { status: 404 });
  }

  const body = (await request.json()) as Partial<Promo>;
  await updatePromo(existing.id, { ...body, updatedAt: new Date().toISOString() });
  return NextResponse.json({ success: true });
}
