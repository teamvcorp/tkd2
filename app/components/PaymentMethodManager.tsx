'use client';

import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentSetupStep from '@/app/components/PaymentSetupStep';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface PaymentMethodManagerProps {
  hasPaymentMethod: boolean;
  onPaymentUpdated: () => void;
  /** Shown after a successful save when the manager is the whole modal body. */
  onSaved?: () => void;
}

// Add / replace the saved card on file. Extracted from the members SettingsModal
// so the same Stripe wiring backs both the settings tab and the "Add card to
// enroll" CTA on a student card. POST → clientSecret, save card, PATCH the id.
export default function PaymentMethodManager({
  hasPaymentMethod,
  onPaymentUpdated,
  onSaved,
}: PaymentMethodManagerProps) {
  const [updatingCard, setUpdatingCard] = useState(false);
  const [cardClientSecret, setCardClientSecret] = useState('');
  const [cardError, setCardError] = useState('');
  const [cardSuccess, setCardSuccess] = useState(false);
  const [cardInfo, setCardInfo] = useState<{ brand: string; last4: string; expMonth: number; expYear: number } | null>(null);

  useEffect(() => {
    if (!hasPaymentMethod) return;
    fetch('/api/settings/payment')
      .then((r) => r.json())
      .then((d) => setCardInfo(d.card ?? null))
      .catch(() => setCardInfo(null));
  }, [hasPaymentMethod]);

  const startCardUpdate = async () => {
    setCardError('');
    setCardSuccess(false);
    setUpdatingCard(true);
    try {
      const res = await fetch('/api/settings/payment', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setCardError(data.error ?? 'Could not start card update.');
        setUpdatingCard(false);
        return;
      }
      setCardClientSecret(data.clientSecret);
    } catch {
      setCardError('Something went wrong. Please try again.');
      setUpdatingCard(false);
    }
  };

  const handleCardSaved = async (pmId: string) => {
    setCardError('');
    try {
      const res = await fetch('/api/settings/payment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: pmId }),
      });
      const data = await res.json();
      if (!res.ok) { setCardError(data.error ?? 'Could not save card.'); return; }
      setCardSuccess(true);
      setCardClientSecret('');
      setUpdatingCard(false);
      onPaymentUpdated();
      onSaved?.();
    } catch {
      setCardError('Something went wrong. Please try again.');
    }
  };

  if (cardSuccess) {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
        ✓ Card saved successfully!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {hasPaymentMethod
          ? 'You have a card saved on file. Use the button below to replace it.'
          : 'No payment method on file. Add one to enable purchases and enrollment.'}
      </p>
      {hasPaymentMethod && cardInfo && (
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
          <div className="text-2xl">💳</div>
          <div>
            <p className="text-sm font-semibold text-gray-900 capitalize">{cardInfo.brand} ···· {cardInfo.last4}</p>
            <p className="text-xs text-gray-500">Expires {cardInfo.expMonth}/{cardInfo.expYear}</p>
          </div>
        </div>
      )}
      {cardError && <p className="text-sm text-red-600">{cardError}</p>}
      {cardClientSecret && stripePromise ? (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret: cardClientSecret, appearance: { theme: 'stripe' } }}
        >
          <PaymentSetupStep
            onSuccess={handleCardSaved}
            onBack={() => { setCardClientSecret(''); setUpdatingCard(false); }}
          />
        </Elements>
      ) : (
        <button
          onClick={startCardUpdate}
          disabled={updatingCard}
          className="block w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-center"
        >
          {updatingCard ? 'Loading…' : hasPaymentMethod ? 'Replace Saved Card' : 'Add Payment Method'}
        </button>
      )}
    </div>
  );
}
