import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { listPromoArchive } from '@/lib/promo';

export const dynamic = 'force-dynamic';

/* GET — return past promos from the archive */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const promos = await listPromoArchive();
  return NextResponse.json({ promos });
}
