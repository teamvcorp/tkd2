import { NextResponse } from 'next/server';
import { getPromo } from '@/lib/promo';

export const dynamic = 'force-dynamic';

/* GET — return the current active promo (public, no auth required) */
export async function GET() {
  const promo = await getPromo();
  if (!promo || !promo.active) {
    return NextResponse.json({ promo: null });
  }
  return NextResponse.json({ promo });
}
