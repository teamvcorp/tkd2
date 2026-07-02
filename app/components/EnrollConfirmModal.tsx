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
  savedCard?: { brand: string; last4: string } | null;
  onSuccess: (paymentIntentId: string) => void;
  onClose: () => void;
}

function EnrollForm({
  clientSecret,
  kidName,
  programName,
  amount,
  oneTimeFee,
  paymentPlan,
  savedCard,
  onSuccess,
  onClose,
}: Omit<Props, 'stripePromise'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe) return;

    setError('');
    setLoading(true);

    if (savedCard) {
      // Saved card already attached to the PaymentIntent server-side — just confirm.
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret);
      setLoading(false);
      if (stripeError) {
        setError(stripeError.message ?? 'Payment failed. Please try again.');
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      }
      return;
    }

    if (!elements) return;
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
      onSuccess(paymentIntent.id);
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
              Monthly Plan — payment 1 of {paymentPlan.installments}
            </p>
            <p className="text-xl font-bold text-indigo-900">{formatPrice(amount, true)}</p>
            <p className="text-xs text-gray-500">
              {formatPrice(paymentPlan.installmentAmount, true)}/mo × {paymentPlan.installments} payments
            </p>
          </>
        ) : (
          <p className="text-xl font-bold text-indigo-900">{formatPrice(amount, oneTimeFee)}</p>
        )}
      </div>

      {paymentPlan ? (
        <p className="text-xs text-gray-500">
          You&apos;ll be charged <span className="font-semibold">{formatPrice(amount, oneTimeFee)}</span> now
          (payment 1 of {paymentPlan.installments}). The remaining {paymentPlan.installments - 1} monthly
          payments of {formatPrice(paymentPlan.installmentAmount, true)} are billed each month.
          If <span className="font-semibold">3 monthly payments are missed or late, the entire remaining
          balance becomes due.</span>
        </p>
      ) : (
        <p className="text-xs text-gray-500">
          {savedCard
            ? 'Your saved card on file will be charged in full when you confirm below.'
            : 'Pay in full or choose a pay-over-time option such as Klarna or Afterpay where available. You will only be charged after confirming below.'}
        </p>
      )}

      {savedCard ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between">
          <div className="text-sm">
            <p className="font-semibold text-gray-900 capitalize">{savedCard.brand} •••• {savedCard.last4}</p>
            <p className="text-xs text-gray-500">Saved card on file</p>
          </div>
        </div>
      ) : (
        <PaymentElement />
      )}

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
  savedCard,
  onSuccess,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto my-auto">
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
            clientSecret={clientSecret}
            kidName={kidName}
            programName={programName}
            amount={amount}
            oneTimeFee={oneTimeFee}
            paymentPlan={paymentPlan}
            savedCard={savedCard}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </Elements>
      </div>
    </div>
  );
}
