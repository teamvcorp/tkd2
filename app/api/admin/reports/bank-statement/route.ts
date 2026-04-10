import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { stripe, stripeErrMsg } from '@/lib/stripe';

/**
 * GET /api/admin/reports/bank-statement?from=UNIX&to=UNIX
 * Admin-only. Returns Stripe balance transactions (charges, fees, payouts, refunds).
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
    // Fetch account info + balance transactions in parallel
    const [account, balance] = await Promise.all([
      stripe.accounts.retrieve(),
      stripe.balance.retrieve(),
    ]);

    // Try to get connected bank account (external account for payouts)
    let bankInfo: {
      bankName: string | null;
      last4: string | null;
      routingNumber: string | null;
      accountHolderName: string | null;
      currency: string | null;
    } | null = null;

    try {
      const externalAccounts = await stripe.accounts.listExternalAccounts(
        account.id,
        { object: 'bank_account', limit: 1 },
      );
      const bank = externalAccounts.data[0];
      if (bank && bank.object === 'bank_account') {
        bankInfo = {
          bankName: bank.bank_name ?? null,
          last4: bank.last4 ?? null,
          routingNumber: bank.routing_number ?? null,
          accountHolderName: bank.account_holder_name ?? null,
          currency: bank.currency ?? null,
        };
      }
    } catch {
      // External accounts may not be available for all account types
    }

    const transactions: {
      id: string;
      type: string;
      amount: number;
      fee: number;
      net: number;
      currency: string;
      created: number;
      description: string | null;
      status: string;
    }[] = [];

    for await (const txn of stripe.balanceTransactions.list({
      created: { gte: from, lte: to },
      limit: 100,
    })) {
      transactions.push({
        id: txn.id,
        type: txn.type,
        amount: txn.amount,
        fee: txn.fee,
        net: txn.net,
        currency: txn.currency,
        created: txn.created,
        description: txn.description,
        status: txn.status,
      });
    }

    const totalGross = transactions.reduce((s, t) => s + t.amount, 0);
    const totalFees = transactions.reduce((s, t) => s + t.fee, 0);
    const totalNet = transactions.reduce((s, t) => s + t.net, 0);

    return NextResponse.json({
      ok: true,
      from,
      to,
      count: transactions.length,
      totalGross,
      totalFees,
      totalNet,
      currency: transactions[0]?.currency ?? 'usd',
      transactions,
      stripeAccount: {
        id: account.id,
        businessName: account.settings?.dashboard?.display_name ?? account.business_profile?.name ?? null,
        email: account.email ?? null,
        country: account.country ?? null,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      },
      bankInfo,
      availableBalance: balance.available.map(b => ({ amount: b.amount, currency: b.currency })),
      pendingBalance: balance.pending.map(b => ({ amount: b.amount, currency: b.currency })),
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: stripeErrMsg(err) }, { status: 500 });
  }
}
