import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { stripe, assertStripeKey, stripeErrMsg } from '@/lib/stripe';
import { getTerminalSettings, setTerminalReader } from '@/lib/terminalSettings';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/register/readers
 * Admin-only. Lists the Terminal readers registered on this Stripe account and
 * returns the currently-selected reader id. Readers are registered ONCE in the
 * Stripe Dashboard (they may be shared with other sites) — we only list/select.
 */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    assertStripeKey();
    const [list, settings] = await Promise.all([
      stripe.terminal.readers.list({ limit: 100 }),
      getTerminalSettings(),
    ]);

    const readers = list.data.map((r) => ({
      id: r.id,
      label: r.label,
      deviceType: r.device_type,
      status: r.status, // 'online' | 'offline'
      location: typeof r.location === 'string' ? r.location : r.location?.id ?? null,
    }));

    return NextResponse.json({ readers, selectedReaderId: settings.readerId ?? null });
  } catch (err) {
    return NextResponse.json({ error: stripeErrMsg(err) }, { status: 500 });
  }
}

/**
 * PUT /api/admin/register/readers  { readerId }
 * Admin-only. Persists the selected reader id for this site.
 */
export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { readerId } = (await request.json()) as { readerId?: string };
    if (!readerId?.trim()) {
      return NextResponse.json({ error: 'readerId is required.' }, { status: 400 });
    }
    await setTerminalReader(readerId.trim());
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: stripeErrMsg(err) }, { status: 500 });
  }
}
