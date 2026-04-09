import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { stripe, stripeErrMsg } from '@/lib/stripe';

/**
 * GET /api/admin/reports?from=UNIX&to=UNIX
 * Admin-only. Returns successful Stripe charges within the given date range.
 */
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const from = Number(searchParams.get('from'));
  const to = Number(searchParams.get('to'));

  if (!from || !to || from >= to) {
    return NextResponse.json(
      { error: 'Invalid date range. Provide "from" and "to" as Unix timestamps.' },
      { status: 400 },
    );
  }

  try {
    const charges: {
      id: string;
      amount: number;
      currency: string;
      created: number;
      description: string | null;
      receiptEmail: string | null;
      paymentMethod: string | null;
      status: string;
    }[] = [];

    // Stripe auto-paginates; collect all successful charges in range
    for await (const charge of stripe.charges.list({
      created: { gte: from, lte: to },
      limit: 100,
    })) {
      if (charge.status !== 'succeeded') continue;
      charges.push({
        id: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        created: charge.created,
        description: charge.description,
        receiptEmail: charge.receipt_email,
        paymentMethod:
          typeof charge.payment_method === 'string'
            ? charge.payment_method
            : null,
        status: charge.status,
      });
    }

    const totalAmount = charges.reduce((sum, c) => sum + c.amount, 0);

    return NextResponse.json({
      ok: true,
      from,
      to,
      count: charges.length,
      totalAmount,
      currency: charges[0]?.currency ?? 'usd',
      charges,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: stripeErrMsg(err) }, { status: 500 });
  }
}
