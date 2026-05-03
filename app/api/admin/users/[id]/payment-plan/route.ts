import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import client from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

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
  const body = await request.json() as { requestId?: string; status?: string; installments?: number };
  const { requestId, status, installments } = body;

  if (!requestId || !['approved', 'rejected', 'pending'].includes(status ?? '')) {
    return NextResponse.json({ error: 'requestId and valid status required' }, { status: 400 });
  }

  if (installments !== undefined && ![3, 6, 12].includes(installments)) {
    return NextResponse.json({ error: 'installments must be 3, 6, or 12' }, { status: 400 });
  }

  const setFields: Record<string, unknown> = {
    'paymentPlanRequests.$.status': status,
    'paymentPlanRequests.$.reviewedAt': new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (installments !== undefined) {
    setFields['paymentPlanRequests.$.installments'] = installments;
  }

  const result = await col().updateOne(
    { id, 'paymentPlanRequests.id': requestId },
    { $set: setFields },
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'User or request not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
