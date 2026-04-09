'use client';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import ChatWidget from './ChatWidget'

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

/* ── Stripe payment form (rendered inside <Elements>) ───────────────────────── */
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

export default function Navbar() {
    const pathname = usePathname();
    const [isModelOpen, setIsModelOpen] = useState(false);
    const [promo, setPromo] = useState<PromoData | null>(null);
    const [qty, setQty] = useState(1);
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [step, setStep] = useState<'info' | 'pay' | 'done'>('info');
    const [checkoutError, setCheckoutError] = useState('');
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    const resetModal = () => {
        setIsModelOpen(false);
        setQty(1);
        setCustomerName('');
        setCustomerEmail('');
        setClientSecret(null);
        setStep('info');
        setCheckoutError('');
        setCheckoutLoading(false);
    };

    const fetchPromo = useCallback(async () => {
        try {
            const res = await fetch('/api/promo');
            const data = await res.json();
            setPromo(data.promo ?? null);
        } catch {
            setPromo(null);
        }
    }, []);

    useEffect(() => {
        fetchPromo();
    }, [fetchPromo]);

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
                body: JSON.stringify({ quantity: qty, name: customerName.trim(), email: customerEmail.trim() }),
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
        // fire-and-forget email notification
        fetch('/api/promo/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentIntentId }),
        }).catch(() => {});
    };
    interface IsActiveFn {
        (path: string): string;
    }

    const isActive: IsActiveFn = (path) =>
        pathname === path
            ? 'inline-flex items-center border-b-2 border-indigo-500 px-1 pt-1 text-sm font-medium text-gray-400'
            : 'inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-white-500';
    
    const promoModal = isModelOpen && promo ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-40">
            <div className="relative bg-white rounded-lg w-[90%] max-w-lg mx-auto p-4 sm:p-6 max-h-[90vh] overflow-auto">
                <button
                    onClick={resetModal}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                    aria-label="Close"
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>

                {step === 'info' && (
                    <>
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
                        <p className="mt-1 text-center text-gray-600">${(promo.price / 100).toFixed(2)} each</p>

                        {/* Quantity selector */}
                        <div className="mt-4 flex items-center justify-center gap-3">
                            <label htmlFor="promo-qty" className="text-sm font-medium text-gray-700">Qty:</label>
                            <button
                                type="button"
                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                                className="w-9 h-9 flex items-center justify-center rounded bg-gray-200 text-gray-700 text-lg font-bold hover:bg-gray-300 select-none"
                            >
                                −
                            </button>
                            <input
                                id="promo-qty"
                                type="number"
                                min={1}
                                max={promo.quantity > 0 ? promo.quantity : undefined}
                                value={qty}
                                onChange={(e) => {
                                    const v = Math.max(1, parseInt(e.target.value, 10) || 1);
                                    setQty(promo.quantity > 0 ? Math.min(v, promo.quantity) : v);
                                }}
                                className="w-16 text-center border rounded px-2 py-2 text-gray-900 text-lg"
                            />
                            <button
                                type="button"
                                onClick={() => setQty((q) => promo.quantity > 0 ? Math.min(q + 1, promo.quantity) : q + 1)}
                                className="w-9 h-9 flex items-center justify-center rounded bg-gray-200 text-gray-700 text-lg font-bold hover:bg-gray-300 select-none"
                            >
                                +
                            </button>
                        </div>

                        <p className="mt-2 text-center font-semibold text-gray-800">
                            Total: ${((promo.price * qty) / 100).toFixed(2)}
                        </p>

                        {/* Customer info */}
                        <div className="mt-4 space-y-3">
                            <input
                                type="text"
                                placeholder="Your name"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                            <input
                                type="email"
                                placeholder="Your email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
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
                    </>
                )}

                {step === 'pay' && clientSecret && stripePromise && (
                    <div className="pt-2">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">Payment</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {promo.description} &times; {qty} — ${((promo.price * qty) / 100).toFixed(2)}
                        </p>
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <PromoPaymentForm
                                onSuccess={handlePaymentSuccess}
                                onCancel={() => { setStep('info'); setClientSecret(null); }}
                            />
                        </Elements>
                    </div>
                )}

                {step === 'done' && (
                    <div className="py-8 text-center">
                        <div className="text-5xl mb-4">✅</div>
                        <h3 className="text-xl font-bold text-gray-800">Order Confirmed!</h3>
                        <p className="mt-2 text-gray-600">
                            Thank you, {customerName}! A confirmation has been sent.
                        </p>
                        <button
                            type="button"
                            onClick={resetModal}
                            className="mt-6 rounded-md bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    ) : null;

    return (
        <>
            {promoModal}
            <Disclosure as="nav" className="">
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between min-w-full">
                    <div className="flex">
                        <div className="ml-2 mr-2 flex items-center md:hidden">
                            {/* Mobile menu button */}
                            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                                <span className="absolute -inset-0.5" />
                                <span className="sr-only">Open main menu</span>
                                <Bars3Icon aria-hidden="true" className="block size-6 group-data-[open]:hidden" />
                                <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-[open]:block" />
                            </DisclosureButton>
                        </div>
                        <Link href="/" className="flex shrink-0 items-center justify-start">
                            <Image
                                alt="Taekwondo of Storm Lake"
                                src="/tkdlogo.png"
                                className="h-14 w-auto"
                                width={250}
                                height={100}
                                loading="eager"
                                priority
                            />
                        </Link>

                        <div className="hidden md:ml-16 md:flex  md:space-x-8">
                            {/* Current: "border-indigo-500 text-gray-900", Default: "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700" */}
                            <Link
                                href="/"
                                className={`${isActive('/')} border-b-2 hover:border-gray-300 hover:text-gray-700`}
                                data-active={pathname === '/'}
                            >
                                Home
                            </Link>
                            <Link
                                href="/about"
                                className={`${isActive('/about')} border-b-2 hover:border-gray-300 hover:text-gray-700`}
                                data-active={pathname === '/about'}
                            >
                                About
                            </Link>
                            <Link
                                href="/classes"
                                className={`${isActive('/classes')} border-b-2 hover:border-gray-300 hover:text-gray-700`}
                                data-active={pathname === '/classes'}
                            >
                                Classes
                            </Link>
                            <Link
                                href="/contact"
                                className={`${isActive('/contact')} border-b-2 hover:border-gray-300 hover:text-gray-700`}
                                data-active={pathname === '/contact'}
                            >
                                Contact
                            </Link>
                            <Link
                                href="/members"
                                className={`${isActive('/members')} border-b-2 hover:border-gray-300 hover:text-gray-700`}
                                data-active={pathname === '/members'}
                            >
                                Member
                            </Link>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-x-3">
                        <ChatWidget />
                        {promo && (
                        <div className="shrink-0">
                            <button
                                onClick={() => setIsModelOpen(true)}
                                className="relative inline-flex items-center gap-x-1.5 rounded-md bg-green-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                            >
                                Current Promo
                            </button>
                        </div>
                        )}
                        <div className="shrink-0">
                            <Link
                                href="/members"
                                className="relative inline-flex items-center gap-x-1.5 rounded-md bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                Sign Up Today!
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <DisclosurePanel className="md:hidden">
                <div className="space-y-1 pb-3 pt-2">
                    {/* Current: "bg-indigo-50 border-indigo-500 text-indigo-700", Default: "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700" */}
                    <DisclosureButton
                        as="a"
                        href="/"
                        className="block border-l-4 border-indigo-500 bg-indigo-50 py-2 pl-3 pr-4 text-base font-medium text-indigo-700 sm:pl-5 sm:pr-6"
                    >
                        Home
                    </DisclosureButton>
                    <DisclosureButton
                        as="a"
                        href="/about"
                        className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 sm:pl-5 sm:pr-6"
                    >
                        About
                    </DisclosureButton>
                    <DisclosureButton
                        as="a"
                        href="/classes"
                        className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 sm:pl-5 sm:pr-6"
                    >
                        Classes
                    </DisclosureButton>
                    <DisclosureButton
                        as="a"
                        href="/contact"
                        className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 sm:pl-5 sm:pr-6"
                    >
                        Contact
                    </DisclosureButton>
                    <DisclosureButton
                        as="a"
                        href="/members"
                        className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 sm:pl-5 sm:pr-6"
                    >
                        Member
                    </DisclosureButton>
                </div>
               
            </DisclosurePanel>
        </Disclosure>
        </>
    )
}
