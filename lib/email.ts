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

// ─── Reminder Email ───────────────────────────────────────────────────────────

const REMINDER_SUBJECTS: Record<string, string> = {
  'finish-signup': 'Complete Your Enrollment – Taekwondo of Storm Lake',
  'payment-due-soon': 'Upcoming Payment Reminder – Taekwondo of Storm Lake',
  'payment-past-due': 'Action Required: Past Due Payment – Taekwondo of Storm Lake',
};

const REMINDER_BODIES: Record<string, (parentName: string) => string> = {
  'finish-signup': (parentName) => `
    <p>Dear ${parentName},</p>
    <p>We noticed that your enrollment with <strong>Taekwondo of Storm Lake</strong> is not yet complete. We'd love to have your family join us on the mat!</p>
    <p>Please log in to your account and finish setting up your profile, including adding your students and payment information, so we can get your training started.</p>
    <p>If you have any questions or need assistance, don't hesitate to reply to this email — we're happy to help.</p>
    <p>We look forward to seeing you in class!</p>
  `,
  'payment-due-soon': (parentName) => `
    <p>Dear ${parentName},</p>
    <p>This is a friendly reminder that a payment for your <strong>Taekwondo of Storm Lake</strong> enrollment will be coming due soon.</p>
    <p>Please ensure your payment information is current in your account so there is no interruption to your training schedule.</p>
    <p>If you have any questions regarding your account or payment, please don't hesitate to contact us.</p>
    <p>Thank you for being part of our community!</p>
  `,
  'payment-past-due': (parentName) => `
    <p>Dear ${parentName},</p>
    <p>Our records indicate that a payment on your <strong>Taekwondo of Storm Lake</strong> account is currently past due.</p>
    <p>To avoid any interruption to your training, please log in to your account and update your payment information at your earliest convenience.</p>
    <p>If you believe this is an error, or if you'd like to discuss a payment arrangement, please reply to this email and we will be happy to assist you.</p>
    <p>Thank you for your prompt attention to this matter.</p>
  `,
};

interface ReminderEmailParams {
  parentName: string;
  userEmail: string;
  reminderType: string;
}

export async function sendReminderEmail({ parentName, userEmail, reminderType }: ReminderEmailParams) {
  const subject = REMINDER_SUBJECTS[reminderType];
  const bodyFn = REMINDER_BODIES[reminderType];
  if (!subject || !bodyFn) throw new Error('Invalid reminder type');

  const bodyHtml = bodyFn(parentName);
  const reminderLabel = {
    'finish-signup': 'Finish Sign Up',
    'payment-due-soon': 'Payment Coming Due',
    'payment-past-due': 'Payment Past Due',
  }[reminderType] ?? reminderType;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;color:#374151">
      <h2 style="color:#4f46e5;margin-top:0">Taekwondo of Storm Lake</h2>
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
      <p style="font-size:12px;color:#9ca3af;margin:0">
        Taekwondo of Storm Lake &middot; Storm Lake, IA<br/>
        To unsubscribe or manage your communications, reply to this email.
      </p>
    </div>
  `;

  // Send to member
  await resend.emails.send({
    from: FROM_EMAIL,
    to: userEmail,
    subject,
    html,
  });

  // Confirmation copy to admin
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `[Reminder Sent] ${reminderLabel} → ${parentName} (${userEmail})`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;color:#374151">
        <h2 style="color:#4f46e5;margin-top:0">Reminder Confirmation</h2>
        <p>A <strong>${reminderLabel}</strong> reminder was sent to:</p>
        <ul>
          <li><strong>Name:</strong> ${parentName}</li>
          <li><strong>Email:</strong> ${userEmail}</li>
        </ul>
        <p style="font-size:12px;color:#9ca3af">Sent automatically from the admin dashboard.</p>
      </div>
    `,
  });
}
