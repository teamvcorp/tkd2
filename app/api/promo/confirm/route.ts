import { NextResponse } from 'next/server';
import { stripe, assertStripeKey } from '@/lib/stripe';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = 'admin@thevacorp.com';
const FROM_EMAIL = 'tkdorder@fyht4.com';

/**
 * Called after a successful promo payment.  Verifies the PaymentIntent
 * actually succeeded, then sends an order-notification email to the admin.
 */
export async function POST(request: Request) {
  try {
    assertStripeKey();

    const { paymentIntentId } = (await request.json()) as {
      paymentIntentId: string;
    };

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'paymentIntentId is required.' },
        { status: 400 },
      );
    }

    // Verify the payment actually succeeded on Stripe's side
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment has not succeeded.' },
        { status: 400 },
      );
    }

    const meta = pi.metadata ?? {};
    const customerName = meta.customerName || 'Unknown';
    const customerEmail = meta.customerEmail || 'Unknown';
    const promoDescription = meta.promoDescription || 'Promo';
    const qty = meta.quantity || '1';
    const amount = (pi.amount / 100).toFixed(2);

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#16a34a;margin-top:0">New Promo Order</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <tr><td style="padding:6px 0;color:#6b7280;width:40%">Customer</td><td style="padding:6px 0;font-weight:600">${customerName}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Email</td><td style="padding:6px 0">${customerEmail}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Promo</td><td style="padding:6px 0;font-weight:600">${promoDescription}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Quantity</td><td style="padding:6px 0">${qty}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Amount Charged</td><td style="padding:6px 0;font-weight:600;color:#16a34a">$${amount}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Order Date</td><td style="padding:6px 0">${new Date().toLocaleString()}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Stripe PI</td><td style="padding:6px 0;font-size:12px;color:#9ca3af">${pi.id}</td></tr>
        </table>
        <p style="margin-top:20px;font-size:12px;color:#9ca3af">Sent automatically by Taekwondo of Storm Lake · Promo Orders</p>
      </div>
    `;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Promo Order: ${promoDescription} (x${qty}) – ${customerName}`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Promo confirm error:', err);
    return NextResponse.json(
      { error: 'Failed to send confirmation.' },
      { status: 500 },
    );
  }
}
