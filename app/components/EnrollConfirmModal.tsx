'use client';

import { useState } from 'react';
import type { Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatPrice } from '@/lib/programs';

interface Props {
  stripePromise: Promise<Stripe | null> | null;
  clientSecret: string;
  kidName: string;
  programName: string;
  amount: number; // cents — already the installment amount if using a plan
  oneTimeFee?: boolean;
  paymentPlan?: { installments: number; installmentAmount: number };
  onSuccess: () => void;
  onClose: () => void;
}

function EnrollForm({
  kidName,
  programName,
  amount,
  oneTimeFee,
  paymentPlan,
  onSuccess,
  onClose,
}: Omit<Props, 'clientSecret' | 'stripePromise'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setError('');
    setLoading(true);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: typeof window !== 'undefined' ? window.location.href : '',
      },
      redirect: 'if_required',
    });

    setLoading(false);

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed. Please try again.');
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess();
    }
    // Redirect-based methods (Klarna, etc.) navigate away — user returns via return_url
    // The webhook activates the kid on payment_intent.succeeded
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Summary */}
      <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4 space-y-1">
        <p className="text-sm font-semibold text-indigo-900">{programName}</p>
        <p className="text-sm text-indigo-700">Enrolling: <span className="font-medium">{kidName}</span></p>
        {paymentPlan ? (
          <>
            <p className="text-xs text-indigo-600 font-medium">
              Payment Plan — installment 1 of {paymentPlan.installments}
            </p>
            <p className="text-xl font-bold text-indigo-900">{formatPrice(amount, oneTimeFee)}</p>
            <p className="text-xs text-gray-500">
              {formatPrice(paymentPlan.installmentAmount)} × {paymentPlan.installments} installments
            </p>
          </>
        ) : (
          <p className="text-xl font-bold text-indigo-900">{formatPrice(amount, oneTimeFee)}</p>
        )}
      </div>

      <p className="text-xs text-gray-500">
        {paymentPlan
          ? `You will be charged ${formatPrice(amount, oneTimeFee)} now. Remaining installments are billed per your plan.`
          : 'Pay in full or choose a pay-over-time option such as Klarna or Afterpay where available. You will only be charged after confirming below.'}
      </p>

      <PaymentElement />

      {error && (
        <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-md border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing…' : 'Confirm Enrollment'}
        </button>
      </div>
    </form>
  );
}

export default function EnrollConfirmModal({
  stripePromise,
  clientSecret,
  kidName,
  programName,
  amount,
  oneTimeFee,
  paymentPlan,
  onSuccess,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Confirm Enrollment</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <XMarkIcon className="w-5 h-5 text-gray-500 hover:text-gray-700" />
          </button>
        </div>
        <Elements
          stripe={stripePromise}
          options={{ clientSecret, appearance: { theme: 'stripe' } }}
        >
          <EnrollForm
            kidName={kidName}
            programName={programName}
            amount={amount}
            oneTimeFee={oneTimeFee}
            paymentPlan={paymentPlan}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </Elements>
      </div>
    </div>
  );
}
