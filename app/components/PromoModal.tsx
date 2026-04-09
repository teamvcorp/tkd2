'use client';

import { useState, useEffect, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createPortal } from 'react-dom';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : null;

interface PromoData {
    id: string;
    description: string;
    price: number;
    quantity: number;
    imageSrc: string;
    active: boolean;
}

/* ── Stripe payment form ──────────────────────────────────────────────────── */
function PromoPaymentForm({ onSuccess, onCancel }: { onSuccess: (piId: string) => void; onCancel: () => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setError('');
        setProcessing(true);

        const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: 'if_required',
        });

        setProcessing(false);

        if (stripeError) {
            setError(stripeError.message ?? 'Payment failed. Please try again.');
            return;
        }

        if (paymentIntent?.status === 'succeeded') {
            onSuccess(paymentIntent.id);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    ← Back
                </button>
                <button
                    type="submit"
                    disabled={!stripe || processing}
                    className="flex-1 rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
                >
                    {processing ? 'Processing…' : 'Pay Now'}
                </button>
            </div>
        </form>
    );
}

/* ── Main promo modal component ───────────────────────────────────────────── */
export default function PromoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [promo, setPromo] = useState<PromoData | null>(null);
    const [qtyStr, setQtyStr] = useState('1');
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [step, setStep] = useState<'info' | 'pay' | 'done'>('info');
    const [checkoutError, setCheckoutError] = useState('');
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const fetchPromo = useCallback(async () => {
        try {
            const res = await fetch('/api/promo');
            const data = await res.json();
            setPromo(data.promo ?? null);
        } catch {
            setPromo(null);
        }
    }, []);

    useEffect(() => { fetchPromo(); }, [fetchPromo]);

    const resetAndClose = () => {
        setQtyStr('1');
        setCustomerName('');
        setCustomerEmail('');
        setClientSecret(null);
        setStep('info');
        setCheckoutError('');
        setCheckoutLoading(false);
        onClose();
    };

    const parsedQty = Math.max(1, parseInt(qtyStr, 10) || 1);

    const handleProceedToPayment = async () => {
        if (!customerName.trim() || !customerEmail.trim()) {
            setCheckoutError('Please enter your name and email.');
            return;
        }
        setCheckoutError('');
        setCheckoutLoading(true);
        try {
            const res = await fetch('/api/promo/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quantity: parsedQty,
                    name: customerName.trim(),
                    email: customerEmail.trim(),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setCheckoutError(data.error || 'Failed to start checkout.');
                return;
            }
            setClientSecret(data.clientSecret);
            setStep('pay');
        } catch {
            setCheckoutError('Network error. Please try again.');
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handlePaymentSuccess = async (paymentIntentId: string) => {
        setStep('done');
        fetch('/api/promo/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentIntentId }),
        }).catch(() => {});
    };

    if (!mounted || !open || !promo) return null;

    const modal = (
        <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: 9999 }}
            onClick={resetAndClose}
        >
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/50" />

            {/* modal panel – stop clicks from closing */}
            <div
                className="relative bg-white rounded-lg w-[90%] max-w-lg mx-auto p-5 sm:p-6 max-h-[90vh] overflow-auto shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={resetAndClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                    aria-label="Close"
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>

                {/* ── Step 1: Info ── */}
                {step === 'info' && (
                    <div>
                        {promo.imageSrc && (
                            <img
                                src={promo.imageSrc}
                                alt={promo.description || 'Current Promo'}
                                className="w-full rounded border object-contain"
                                style={{ maxHeight: '40vh' }}
                            />
                        )}
                        {promo.description && (
                            <p className="mt-3 text-center text-lg font-semibold text-gray-800">
                                {promo.description}
                            </p>
                        )}
                        <p className="mt-1 text-center text-gray-600">
                            ${(promo.price / 100).toFixed(2)} each
                        </p>

                        {/* Quantity */}
                        <div className="mt-4 flex items-center justify-center gap-2">
                            <label htmlFor="promo-qty" className="text-sm font-medium text-gray-700">Qty:</label>
                            <input
                                id="promo-qty"
                                type="text"
                                inputMode="numeric"
                                value={qtyStr}
                                onChange={e => setQtyStr(e.target.value)}
                                className="w-20 text-center border-2 border-gray-300 rounded-lg px-2 py-2 text-gray-900 text-lg focus:border-green-500 focus:outline-none"
                            />
                        </div>

                        <p className="mt-2 text-center font-semibold text-gray-800">
                            Total: ${((promo.price * parsedQty) / 100).toFixed(2)}
                        </p>

                        {/* Customer info */}
                        <div className="mt-4 space-y-3">
                            <input
                                type="text"
                                placeholder="Your name"
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                            <input
                                type="email"
                                placeholder="Your email"
                                value={customerEmail}
                                onChange={e => setCustomerEmail(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>

                        {checkoutError && (
                            <p className="mt-2 text-sm text-red-600">{checkoutError}</p>
                        )}

                        <button
                            type="button"
                            onClick={handleProceedToPayment}
                            disabled={checkoutLoading}
                            className="mt-4 w-full rounded-md bg-green-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
                        >
                            {checkoutLoading ? 'Loading…' : 'Proceed to Payment'}
                        </button>
                    </div>
                )}

                {/* ── Step 2: Payment ── */}
                {step === 'pay' && clientSecret && stripePromise && (
                    <div className="pt-2">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">Payment</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {promo.description} &times; {parsedQty} &mdash; ${((promo.price * parsedQty) / 100).toFixed(2)}
                        </p>
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <PromoPaymentForm
                                onSuccess={handlePaymentSuccess}
                                onCancel={() => { setStep('info'); setClientSecret(null); }}
                            />
                        </Elements>
                    </div>
                )}

                {/* ── Step 3: Done ── */}
                {step === 'done' && (
                    <div className="py-8 text-center">
                        <div className="text-5xl mb-4">✅</div>
                        <h3 className="text-xl font-bold text-gray-800">Order Confirmed!</h3>
                        <p className="mt-2 text-gray-600">
                            Thank you, {customerName}! A confirmation has been sent.
                        </p>
                        <button
                            type="button"
                            onClick={resetAndClose}
                            className="mt-6 rounded-md bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}

/* ── Hook for navbar to know if promo exists ──────────────────────────────── */
export function useHasActivePromo() {
    const [hasPromo, setHasPromo] = useState(false);

    useEffect(() => {
        fetch('/api/promo')
            .then(r => r.json())
            .then(d => setHasPromo(!!d.promo))
            .catch(() => setHasPromo(false));
    }, []);

    return hasPromo;
}
