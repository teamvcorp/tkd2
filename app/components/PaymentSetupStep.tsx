'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { LockClosedIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface PaymentSetupStepProps {
  onSuccess: (paymentMethodId: string) => void;
  onBack: () => void;
}

const btnPrimary =
  'block w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed';
const btnSecondary =
  'block w-full rounded-md border border-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50';

export default function PaymentSetupStep({ onSuccess, onBack }: PaymentSetupStepProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setError('');
    setLoading(true);

    const { error: stripeError, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
    });

    setLoading(false);

    if (stripeError) {
      setError(stripeError.message ?? 'Card setup failed. Please try again.');
      return;
    }

    if (setupIntent?.payment_method) {
      onSuccess(setupIntent.payment_method as string);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Prominent transparency / security panel */}
      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheckIcon className="w-5 h-5 text-indigo-600" />
          <p className="text-sm font-semibold text-indigo-900">Your card is safe — here&apos;s how.</p>
        </div>
        <ul className="space-y-1.5 text-xs text-indigo-900/90 list-none">
          <li className="flex gap-2">
            <LockClosedIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              Your card details go <strong>directly to Stripe</strong> over an encrypted connection.
              We never see or store your card number on our servers.
            </span>
          </li>
          <li className="flex gap-2">
            <LockClosedIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              Stripe is a <strong>PCI Service Provider Level 1</strong> processor (the highest
              security tier in the payments industry) and powers checkout for millions of businesses.
            </span>
          </li>
          <li className="flex gap-2">
            <LockClosedIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              After you save your card, we&apos;ll process the payment option you chose for each
              student on the previous step (pay in full, or the first of 12 monthly payments) — at the
              amounts shown there.
            </span>
          </li>
          <li className="flex gap-2">
            <LockClosedIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              You can remove or replace your card any time from your account settings.
            </span>
          </li>
        </ul>
      </div>

      <PaymentElement />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack} className={btnSecondary}>
          ← Back
        </button>
        <button type="submit" disabled={!stripe || loading} className={btnPrimary}>
          {loading ? 'Saving card…' : 'Save Card & Enroll →'}
        </button>
      </div>
    </form>
  );
}
