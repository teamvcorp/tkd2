import { NextResponse } from 'next/server';
import { getHero } from '@/lib/hero';

export const dynamic = 'force-dynamic';

/* GET — return the current hero config (public, no auth required).
   Returns { hero: null } when nothing has been configured yet, in which case
   the landing page falls back to its built-in default images. */
export async function GET() {
  const hero = await getHero();
  return NextResponse.json({ hero });
}
