# Stripe Terminal — Server-Driven Integration Notes (S710 / S700 smart reader)

Reference notes for the admin **Register** feature (`/admin/register`). Saved locally
so future work doesn't re-research. Verified against Stripe docs + stripe-node v20.

## Model
- **Server-driven** flow for smart readers (Stripe Reader S700 / S710 / WisePOS E).
  All calls go through the Node SDK on the server — no client-side Terminal JS SDK,
  no connection tokens.
- A reader is **registered once** to the Stripe account under a Terminal **Location**
  (do this in the Stripe Dashboard → Terminal → Readers). Every app on that same
  Stripe account then sees it via `terminal.readers.list()`.
- The physical reader is a single device: only **one payment at a time**. A second
  concurrent charge (e.g. from another site sharing the reader) fails with
  `terminal_reader_busy`.

## Flow (as implemented here)
1. Create PaymentIntent:
   ```js
   stripe.paymentIntents.create({
     amount,                              // integer cents
     currency: 'usd',
     payment_method_types: ['card_present'],
     capture_method: 'automatic',         // simple register → capture immediately
     description,
     metadata: { site: 'tkd', source: 'admin_register', note },
   })
   ```
2. Push to reader (reader prompts customer to tap/insert/swipe):
   ```js
   stripe.terminal.readers.processPaymentIntent(readerId, {
     payment_intent: pi.id,
     process_config: { enable_customer_cancellation: true },
   })
   ```
3. Poll for the outcome (this app polls; webhooks are an alternative):
   ```js
   stripe.terminal.readers.retrieve(readerId)  // reader.action.status / .failure_code
   stripe.paymentIntents.retrieve(pi.id)       // pi.status
   ```
   - `reader.action.status`: `in_progress` → `succeeded` | `failed`
   - Confirm the action is ours: `action.type === 'process_payment_intent'` and
     `action.process_payment_intent.payment_intent === pi.id` (reader is shared).
   - Automatic capture ⇒ on success `pi.status === 'succeeded'` (no separate capture).
4. Cancel an in-flight action:
   ```js
   stripe.terminal.readers.cancelAction(readerId)
   ```
   Rejected once the card is authorizing (`terminal_reader_busy`).

### Manual capture variant (NOT used here)
`capture_method: 'manual'` → after auth, `stripe.paymentIntents.capture(pi.id)` within
2 days, else the authorization expires.

## Error codes to handle
| Code | Meaning | UX |
|------|---------|----|
| `terminal_reader_busy` | Reader mid-payment (maybe another site) | "Busy, try again" |
| `terminal_reader_offline` | Powered off / no network | "Check power & Wi-Fi" |
| `terminal_reader_timeout` | No response | "Try again" |
| `card_declined` | Card declined | Reuse same PI, ask for another card |

## Testing (test mode)
- Test-mode keys drive only a **simulated reader** (create one in the Dashboard).
- Simulate card presentment: `stripe.terminal.readers.presentPaymentMethod(readerId,
  { simulated_options: { type: 'visa_ok' } })` (or a declined variant).
- A **physical** S710 taking real cards requires **live-mode** keys.

## This project
- Server infra reused: `lib/stripe.ts` (`stripe`, `assertStripeKey`, `stripeErrMsg`).
- Reader selection persisted in Mongo `settings` collection via `lib/terminalSettings.ts`
  (doc `{ id: 'terminal', readerId }`), with a `localStorage` fallback in the client.
- Routes (all admin-guarded via `isAdminAuthenticated()`):
  - `GET/PUT /api/admin/register/readers` — list readers / save selection
  - `POST   /api/admin/register/charge`   — create PI + processPaymentIntent
  - `GET    /api/admin/register/status`   — poll reader + PI
  - `POST   /api/admin/register/cancel`   — cancelAction (+ cancel PI)
- No other payment flow or the existing webhook was modified. Register PIs carry
  `metadata.source=admin_register` so they're distinguishable from enrollment/plan/promo.

## Security
- Never expose the secret key client-side; all Terminal calls are server-only.
- Existing webhook signature verification unchanged (`STRIPE_WEBHOOK_SECRET`).
