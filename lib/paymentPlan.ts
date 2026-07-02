import type { PaymentPlanRequest, User } from './types';
import { getProgramById } from './programs';

/**
 * Payment-plan compliance helpers.
 *
 * Plans have no stored billing schedule — an admin charges each installment
 * manually. Compliance is therefore derived from a *monthly cadence* anchored
 * on the plan's approval date (`reviewedAt`, falling back to `requestedAt`):
 * one installment is expected per whole month elapsed since approval.
 */

/** Number of missed payments at which the admin UI flags a plan as eligible
 *  for revocation and the parent is emailed that the full balance is now due.
 *  Revocation itself is always a manual admin action. */
export const MISSED_PAYMENT_THRESHOLD = 3;

/** Whole calendar-ish months elapsed since the plan was approved. */
export function monthsElapsed(plan: PaymentPlanRequest, now: Date = new Date()): number {
  const anchor = plan.reviewedAt ?? plan.requestedAt;
  if (!anchor) return 0;
  const start = new Date(anchor);
  if (Number.isNaN(start.getTime())) return 0;

  let months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  // Don't count the current month until the day-of-month is reached.
  if (now.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
}

/** How many installments should have been paid by now (capped at the total). */
export function expectedPaidByNow(plan: PaymentPlanRequest, now: Date = new Date()): number {
  return Math.min(monthsElapsed(plan, now), plan.installments);
}

/** Whether a plan is "active" for compliance purposes: approved with a balance. */
function isActivePlan(plan: PaymentPlanRequest): boolean {
  return plan.status === 'approved' && (plan.installmentsPaid ?? 0) < plan.installments;
}

/** Number of payments the family is behind on this plan (0 if not applicable). */
export function missedCount(plan: PaymentPlanRequest, now: Date = new Date()): number {
  if (!isActivePlan(plan)) return 0;
  return Math.max(0, expectedPaidByNow(plan, now) - (plan.installmentsPaid ?? 0));
}

/** True when an active plan has at least one missed monthly payment. */
export function isPlanBehind(plan: PaymentPlanRequest, now: Date = new Date()): boolean {
  return missedCount(plan, now) > 0;
}

/**
 * Family-level compliance with the consecutive-payment rule.
 *
 * - 0 active plans → compliant (nothing owed).
 * - exactly 1 active plan → compliant only if that plan is current.
 * - 2+ active plans → compliant if AT LEAST ONE plan is current
 *   (the multi-child / school-permission exemption: keeping one plan
 *   consecutive keeps the whole family in compliance).
 */
export function isFamilyCompliant(user: Pick<User, 'paymentPlanRequests'>, now: Date = new Date()): boolean {
  const active = (user.paymentPlanRequests ?? []).filter(isActivePlan);
  if (active.length === 0) return true;
  // Compliant if any active plan is on schedule.
  return active.some((p) => !isPlanBehind(p, now));
}

/** Outstanding balance (in cents) remaining on a plan, using program pricing. */
export function outstandingCents(user: Pick<User, 'kids'>, plan: PaymentPlanRequest): number {
  const remaining = plan.installments - (plan.installmentsPaid ?? 0);
  if (remaining <= 0) return 0;
  const kid = user.kids[plan.kidIndex];
  const program = getProgramById(kid?.program ?? '');
  if (!program) return 0;
  return remaining * Math.round(program.pricePerYear / plan.installments);
}
