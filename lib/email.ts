import { Resend } from 'resend';
import type { Purchase } from './types';

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = 'admin@thevacorp.com';
const FROM_EMAIL = 'tkdorder@fyht4.com';

interface OrderEmailParams {
  parentName: string;
  username: string;
  purchase: Purchase;
}

export async function sendOrderEmail({ parentName, username, purchase }: OrderEmailParams) {
  const fulfillmentLine =
    purchase.fulfillment === 'ship'
      ? `<b>Fulfillment:</b> Ship to customer<br><b>Shipping Address:</b> ${purchase.shippingAddress ?? 'Not provided'}`
      : `<b>Fulfillment:</b> In-store pickup`;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="color:#4f46e5;margin-top:0">New Pro Shop Order</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <tr><td style="padding:6px 0;color:#6b7280;width:40%">Customer</td><td style="padding:6px 0;font-weight:600">${parentName}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Username</td><td style="padding:6px 0">${username}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Product</td><td style="padding:6px 0;font-weight:600">${purchase.productName}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Category</td><td style="padding:6px 0">${purchase.category}</td></tr>
        ${purchase.size ? `<tr><td style="padding:6px 0;color:#6b7280">Size</td><td style="padding:6px 0">${purchase.size}</td></tr>` : ''}
        <tr><td style="padding:6px 0;color:#6b7280">Amount Charged</td><td style="padding:6px 0;font-weight:600;color:#4f46e5">$${(purchase.amount / 100).toFixed(2)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Order Date</td><td style="padding:6px 0">${new Date(purchase.purchasedAt).toLocaleString()}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Stripe PI</td><td style="padding:6px 0;font-size:12px;color:#9ca3af">${purchase.id}</td></tr>
      </table>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;font-size:14px;line-height:1.8">
        ${fulfillmentLine}
      </div>
      <p style="margin-top:20px;font-size:12px;color:#9ca3af">Sent automatically by Taekwondo of Storm Lake · Pro Shop</p>
    </div>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `New Order: ${purchase.productName}${purchase.size ? ` (${purchase.size})` : ''} – ${parentName}`,
    html,
  });
}
