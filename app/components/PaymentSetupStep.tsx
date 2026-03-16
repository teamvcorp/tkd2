'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        Your card is saved securely with Stripe. You will only be charged when you enroll a student in a program.
      </div>

      <PaymentElement />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack} className={btnSecondary}>
          ← Back
        </button>
        <button type="submit" disabled={!stripe || loading} className={btnPrimary}>
          {loading ? 'Saving card…' : 'Save Card →'}
        </button>
      </div>
    </form>
  );
}
