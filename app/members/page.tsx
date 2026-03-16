'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Cog6ToothIcon, XMarkIcon, CameraIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import BeltStudy, { BELT_LABELS } from '@/app/components/BeltStudy';
import PaymentSetupStep from '@/app/components/PaymentSetupStep';
import { PROGRAMS, getProgramById, formatPrice } from '@/lib/programs';
import type { Kid, Purchase } from '@/lib/types';
import ProShop from '@/app/components/ProShop';
import EnrollConfirmModal from '@/app/components/EnrollConfirmModal';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// ─── Types ────────────────────────────────────────────────────────────────────

interface KidFormData {
  name: string;
  age: string;
  rank: string;
  program: string;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls =
  'block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600';

const btnPrimary =
  'block w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed';

const btnSecondary =
  'block w-full rounded-md border border-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600';

// ─── Login form ───────────────────────────────────────────────────────────────

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signIn('credentials', { username, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError('Invalid username or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-1 uppercase tracking-wide">
          Members Area
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Sign in to access belt study materials
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="login-username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className={btnPrimary}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          No account yet?{' '}
          <button onClick={onSwitch} className="text-indigo-600 font-medium hover:underline">
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Register form (4 steps) ──────────────────────────────────────────────────

const STEP_LABELS = ['Credentials', 'Parent Info', 'Save Card', 'Students'];

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2
  const [parentName, setParentName]  = useState('');
  const [parentAge, setParentAge]    = useState('');

  // Step 3 – Stripe
  const [stripeCustomerId, setStripeCustomerId]       = useState('');
  const [clientSecret, setClientSecret]               = useState('');
  const [paymentMethodId, setPaymentMethodId]         = useState('');

  // Step 4
  const [kids, setKids] = useState<KidFormData[]>([
    { name: '', age: '', rank: 'white', program: '' },
  ]);

  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const addKid    = () => setKids((prev) => [...prev, { name: '', age: '', rank: 'white', program: '' }]);
  const removeKid = (i: number) => setKids((prev) => prev.filter((_, idx) => idx !== i));
  const updateKid = (i: number, field: keyof KidFormData, value: string) =>
    setKids((prev) => prev.map((k, idx) => (idx === i ? { ...k, [field]: value } : k)));

  // ── Step 1 ──────────────────────────────────────────────────────────────────
  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setStep(2);
  };

  // ── Step 2 ──────────────────────────────────────────────────────────────────
  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentName, username }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Could not create payment profile.'); setLoading(false); return; }
      setStripeCustomerId(data.customerId);
      setClientSecret(data.clientSecret);
      setStep(3);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  // ── Step 3 callback (from PaymentSetupStep) ──────────────────────────────────
  const handlePaymentSaved = (pmId: string) => {
    setPaymentMethodId(pmId);
    setStep(4);
  };

  // ── Step 4 / Final submit ────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (kids.some((k) => !k.program)) { setError('Please select a program for each student.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username, password,
          parentName, parentAge: Number(parentAge),
          kids,
          stripeCustomerId,
          stripePaymentMethodId: paymentMethodId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Registration failed.'); return; }
      await signIn('credentials', { username, password, redirect: false });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-1 uppercase tracking-wide">
          Create Account
        </h2>
        <p className="text-sm text-gray-500 text-center mb-4">
          Step {step} of 4 — {STEP_LABELS[step - 1]}
        </p>

        {/* Step bar */}
        <div className="flex gap-1.5 mb-8">
          {STEP_LABELS.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${step > i ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* ─ Step 1: Credentials ─────────────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <label htmlFor="reg-username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input id="reg-username" name="username" type="text" autoComplete="username" required minLength={3}
                pattern="[a-zA-Z0-9_]+" title="Letters, numbers and underscores only"
                value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username" className={inputCls} />
            </div>
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input id="reg-password" name="password" type="password" autoComplete="new-password" required minLength={8}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters" className={inputCls} />
            </div>
            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input id="reg-confirm" name="confirm-password" type="password" autoComplete="new-password" required
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password" className={inputCls} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className={btnPrimary}>Next: Parent Info →</button>
          </form>
        )}

        {/* ─ Step 2: Parent info ─────────────────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-4">
            <div>
              <label htmlFor="parent-name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input id="parent-name" name="parent-name" type="text" autoComplete="name" required
                value={parentName} onChange={(e) => setParentName(e.target.value)}
                placeholder="Jane Smith" className={inputCls} />
            </div>
            <div>
              <label htmlFor="parent-age" className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input id="parent-age" name="parent-age" type="number" required min={18} max={120}
                value={parentAge} onChange={(e) => setParentAge(e.target.value)}
                placeholder="35" className={inputCls} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => { setError(''); setStep(1); }} className={btnSecondary}>← Back</button>
              <button type="submit" disabled={loading} className={btnPrimary}>
                {loading ? 'Setting up…' : 'Next: Save Card →'}
              </button>
            </div>
          </form>
        )}

        {/* ─ Step 3: Stripe payment setup ────────────────────────────────────── */}
        {step === 3 && clientSecret && stripePromise ? (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
            <PaymentSetupStep
              onSuccess={handlePaymentSaved}
              onBack={() => { setError(''); setStep(2); }}
            />
          </Elements>
        ) : step === 3 && (
          <p className="text-sm text-red-600">
            Stripe is not configured. Please add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
          </p>
        )}

        {/* ─ Step 4: Add students ────────────────────────────────────────────── */}
        {step === 4 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {kids.map((kid, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Student {idx + 1}</span>
                    {kids.length > 1 && (
                      <button type="button" onClick={() => removeKid(idx)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label htmlFor={`kid-${idx}-name`} className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                      <input id={`kid-${idx}-name`} name={`kid-${idx}-name`} type="text" required value={kid.name}
                        onChange={(e) => updateKid(idx, 'name', e.target.value)}
                        placeholder="Alex" className={inputCls} />
                    </div>
                    <div>
                      <label htmlFor={`kid-${idx}-age`} className="block text-xs font-medium text-gray-600 mb-1">Age</label>
                      <input id={`kid-${idx}-age`} name={`kid-${idx}-age`} type="number" required min={3} max={99} value={kid.age}
                        onChange={(e) => updateKid(idx, 'age', e.target.value)}
                        placeholder="10" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor={`kid-${idx}-rank`} className="block text-xs font-medium text-gray-600 mb-1">Current Belt Rank</label>
                    <select id={`kid-${idx}-rank`} name={`kid-${idx}-rank`} value={kid.rank} onChange={(e) => updateKid(idx, 'rank', e.target.value)} className={inputCls}>
                      {BELT_LABELS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`kid-${idx}-program`} className="block text-xs font-medium text-gray-600 mb-1">Program</label>
                    <select id={`kid-${idx}-program`} name={`kid-${idx}-program`} value={kid.program} onChange={(e) => updateKid(idx, 'program', e.target.value)} className={inputCls} required>
                      <option value="">— Select a program —</option>
                      {PROGRAMS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.description} · {formatPrice(p.pricePerYear)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addKid} className={btnSecondary}>+ Add Another Student</button>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={() => { setError(''); setStep(3); }} className={btnSecondary}>← Back</button>
              <button type="submit" disabled={loading} className={btnPrimary}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <button onClick={onSwitch} className="text-indigo-600 font-medium hover:underline">Sign in</button>
        </p>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

const beltColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
  white:     { bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-300',   label: 'White' },
  yellow:    { bg: 'bg-yellow-400', text: 'text-yellow-900', border: 'border-yellow-500', label: 'Yellow' },
  orange:    { bg: 'bg-orange-400', text: 'text-orange-900', border: 'border-orange-500', label: 'Orange' },
  green:     { bg: 'bg-green-500',  text: 'text-white',      border: 'border-green-600',  label: 'Green' },
  purple:    { bg: 'bg-purple-500', text: 'text-white',      border: 'border-purple-600', label: 'Purple' },
  lightBlue: { bg: 'bg-sky-400',    text: 'text-white',      border: 'border-sky-500',    label: 'Light Blue' },
  darkBlue:  { bg: 'bg-blue-700',   text: 'text-white',      border: 'border-blue-800',   label: 'Dark Blue' },
  brown:     { bg: 'bg-amber-800',  text: 'text-white',      border: 'border-amber-900',  label: 'Brown' },
  red:       { bg: 'bg-red-600',    text: 'text-white',      border: 'border-red-700',    label: 'Red' },
};

// ─── Image resize helper (client-side, runs before upload) ───────────────────

function resizeImageToBlob(file: File, size = 400): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas unavailable')); return; }
      // Centre-crop to square then scale to target size
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        'image/jpeg',
        0.85,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')); };
    img.src = objectUrl;
  });
}

// ─── Kid Card ─────────────────────────────────────────────────────────────────

function KidCard({
  kid,
  kidIndex,
  hasPaymentMethod,
  onView,
  onEnroll,
  onAvatarUpdated,
}: {
  kid: Kid;
  kidIndex: number;
  hasPaymentMethod: boolean;
  onView: () => void;
  onEnroll: (idx: number) => void;
  onAvatarUpdated?: (url: string) => void;
}) {
  const colors = beltColors[kid.rank] ?? beltColors.white;
  const initials = kid.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const program = getProgramById(kid.program ?? '');
  const status = kid.status ?? 'pending';
  const days = kid.expiresAt ? daysUntil(kid.expiresAt) : null;
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarError('');
    setUploading(true);
    try {
      const resized = await resizeImageToBlob(file);
      const form = new FormData();
      form.append('image', resized, 'avatar.jpg');
      const res = await fetch(`/api/kids/${kidIndex}/avatar`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) { setAvatarError(data.error ?? 'Upload failed.'); return; }
      onAvatarUpdated?.(data.url);
    } catch {
      setAvatarError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Camera icon — top-right of card */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        title="Update photo"
        className="absolute top-2 right-2 z-10 rounded-full bg-white/80 backdrop-blur-sm p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white shadow-sm transition-colors disabled:opacity-50"
      >
        {uploading
          ? <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          : <CameraIcon className="w-4 h-4" />}
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

      {/* Clickable avatar area */}
      <button
        onClick={onView}
        disabled={status !== 'active'}
        className="flex flex-col items-center gap-3 p-5 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-t-2xl group disabled:cursor-default"
      >
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-4 overflow-hidden ${colors.bg} ${colors.text} ${colors.border} shadow-inner`}>
          {kid.avatarUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={kid.avatarUrl} alt={kid.name} className="w-full h-full object-cover" />
            : initials}
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-900 text-sm">{kid.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">Age {kid.age}</p>
        </div>
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
          {colors.label} Belt
        </span>
        {status === 'active' && (
          <span className="text-xs text-indigo-500 font-medium group-hover:underline">
            View Dashboard →
          </span>
        )}
      </button>

      {/* Footer: status + action */}
      <div className="px-4 pb-4 space-y-2">
        {/* Status badge */}
        {status === 'active' && days !== null && (
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Active
            </span>
            <span className="text-xs text-gray-400">{days}d left</span>
          </div>
        )}
        {status === 'inactive' && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
            Expired
          </span>
        )}
        {status === 'pending' && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            Not enrolled
          </span>
        )}

        {/* Program label */}
        {program && (
          <p className="text-xs text-gray-500 truncate">{program.name} · {formatPrice(program.pricePerYear)}</p>
        )}

        {/* Enroll / Renew button */}
        {(status === 'pending' || status === 'inactive') && hasPaymentMethod && program && (
          <button
            onClick={() => onEnroll(kidIndex)}
            className="block w-full text-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            {status === 'inactive' ? 'Renew' : 'Enroll Now'}
          </button>
        )}
        {avatarError && (
          <p className="text-xs text-red-500">{avatarError}</p>
        )}
        {(status === 'pending' || status === 'inactive') && !hasPaymentMethod && (
          <p className="text-xs text-gray-400 text-center">No payment method on file</p>
        )}
      </div>
    </div>
  );
}

// ─── Settings Modal ───────────────────────────────────────────────────────────

function SettingsModal({
  isOpen, onClose, hasPaymentMethod, purchases, onPaymentUpdated,
}: {
  isOpen: boolean;
  onClose: () => void;
  hasPaymentMethod: boolean;
  purchases: Purchase[];
  onPaymentUpdated: () => void;
}) {
  const [tab, setTab] = useState<'payment' | 'history'>('payment');
  const [updatingCard, setUpdatingCard] = useState(false);
  const [cardClientSecret, setCardClientSecret] = useState('');
  const [cardError, setCardError] = useState('');
  const [cardSuccess, setCardSuccess] = useState(false);

  if (!isOpen) return null;

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
    } catch {
      setCardError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Account Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="size-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 gap-6">
          {(['payment', 'history'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'payment' ? 'Payment Method' : 'Order History'}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'payment' && (
            <div className="space-y-4">
              {cardSuccess ? (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                  ✓ Card updated successfully!
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    {hasPaymentMethod
                      ? 'You have a card saved on file. Use the button below to replace it.'
                      : 'No payment method on file. Add one to enable purchases and enrollment.'}
                  </p>
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
                </>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div>
              {purchases.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-10">No purchases yet.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {[...purchases].reverse().map((p) => (
                    <div key={p.id} className="py-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.productName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {p.category}{p.size ? ` · Size: ${p.size}` : ''} ·{' '}
                          {p.fulfillment === 'ship' ? '📦 Shipped' : '🏢 Pickup'} ·{' '}
                          {new Date(p.purchasedAt).toLocaleDateString()}
                        </p>
                        {p.shippingAddress && (
                          <p className="text-xs text-gray-400">{p.shippingAddress}</p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                        ${(p.amount / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Family Dashboard ─────────────────────────────────────────────────────────

function FamilyDashboard({
  parentName, kids, hasPaymentMethod, purchases, onSelectKid, onKidsUpdated, onPaymentUpdated,
}: {
  parentName: string;
  kids: Kid[];
  hasPaymentMethod: boolean;
  purchases: Purchase[];
  onSelectKid: (kid: Kid) => void;
  onKidsUpdated: (kids: Kid[]) => void;
  onPaymentUpdated: () => void;
}) {
  const [enrolling, setEnrolling] = useState<number | null>(null);
  const [enrollError, setEnrollError] = useState('');
  const [enrollModal, setEnrollModal] = useState<{
    kidIndex: number;
    clientSecret: string;
    kidName: string;
    programName: string;
    amount: number;
  } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [newKid, setNewKid] = useState({ name: '', age: '', rank: 'white', program: '' });
  const [addingKid, setAddingKid] = useState(false);
  const [addKidError, setAddKidError] = useState('');

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddKidError('');
    if (!newKid.name.trim()) { setAddKidError('Name is required.'); return; }
    setAddingKid(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addKid: { ...newKid, age: Number(newKid.age) } }),
      });
      const data = await res.json();
      if (!res.ok) { setAddKidError(data.error ?? 'Failed to add student.'); return; }
      onKidsUpdated([...kids, data.kid]);
      setAddStudentOpen(false);
      setNewKid({ name: '', age: '', rank: 'white', program: '' });
    } catch {
      setAddKidError('Something went wrong. Please try again.');
    } finally {
      setAddingKid(false);
    }
  };

  const handleEnroll = async (kidIndex: number) => {
    setEnrolling(kidIndex);
    setEnrollError('');
    try {
      const res = await fetch('/api/stripe/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kidIndex }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEnrollError(data.error ?? 'Enrollment failed.');
      } else {
        setEnrollModal({
          kidIndex,
          clientSecret: data.clientSecret,
          kidName: data.kidName,
          programName: data.programName,
          amount: data.amount,
        });
      }
    } catch {
      setEnrollError('Something went wrong. Please try again.');
    }
    setEnrolling(null);
  };

  const handleEnrollSuccess = () => {
    if (!enrollModal) return;
    const { kidIndex } = enrollModal;
    // Optimistically mark as active; webhook will persist the change
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    const updated = kids.map((k, i) =>
      i === kidIndex ? { ...k, status: 'active' as const, expiresAt: expiresAt.toISOString() } : k,
    );
    onKidsUpdated(updated);
    setEnrollModal(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          hasPaymentMethod={hasPaymentMethod}
          purchases={purchases}
          onPaymentUpdated={onPaymentUpdated}
        />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hi, {parentName}!</h1>
            <p className="text-sm text-gray-500 mt-0.5">Select an active student to view their dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddStudentOpen(true)}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 flex items-center gap-1"
            >
              <PlusIcon className="size-4" />
              Add Student
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded-md border border-gray-300 p-2 text-gray-500 hover:bg-gray-100"
              title="Account settings"
            >
              <Cog6ToothIcon className="size-5" />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/members' })}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        </div>

        {enrollError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
            {enrollError}
          </div>
        )}

        {enrollModal && (
          <EnrollConfirmModal
            stripePromise={stripePromise}
            clientSecret={enrollModal.clientSecret}
            kidName={enrollModal.kidName}
            programName={enrollModal.programName}
            amount={enrollModal.amount}
            onSuccess={handleEnrollSuccess}
            onClose={() => setEnrollModal(null)}
          />
        )}

        <ProShop hasPaymentMethod={hasPaymentMethod} />

        {/* ── Add Student Modal ─────────────────────────────────────────── */}
        {addStudentOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Add Student</h2>
                <button type="button" onClick={() => setAddStudentOpen(false)}>
                  <XMarkIcon className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                </button>
              </div>
              <form onSubmit={handleAddStudent} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="add-student-name" className="text-xs font-medium text-gray-700">Name *</label>
                  <input id="add-student-name" name="student-name" type="text" required value={newKid.name}
                    autoComplete="off"
                    onChange={(e) => setNewKid((k) => ({ ...k, name: e.target.value }))}
                    className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="add-student-age" className="text-xs font-medium text-gray-700">Age</label>
                    <input id="add-student-age" name="student-age" type="number" min={3} max={18} value={newKid.age}
                      onChange={(e) => setNewKid((k) => ({ ...k, age: e.target.value }))}
                      className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="add-student-rank" className="text-xs font-medium text-gray-700">Belt Rank</label>
                    <select id="add-student-rank" name="student-rank" value={newKid.rank} onChange={(e) => setNewKid((k) => ({ ...k, rank: e.target.value }))}
                      className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                      {Object.entries(beltColors).map(([val, c]) => (
                        <option key={val} value={val}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="add-student-program" className="text-xs font-medium text-gray-700">Program</label>
                  <select id="add-student-program" name="student-program" value={newKid.program} onChange={(e) => setNewKid((k) => ({ ...k, program: e.target.value }))}
                    className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    <option value="">— Select a program —</option>
                    {PROGRAMS.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} · {formatPrice(p.pricePerYear)}</option>
                    ))}
                  </select>
                </div>
                {addKidError && <p className="text-sm text-red-600">{addKidError}</p>}
                <div className="flex justify-end gap-3 pt-1">
                  <button type="button" onClick={() => setAddStudentOpen(false)}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                    Cancel
                  </button>
                  <button type="submit" disabled={addingKid}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                    {addingKid ? 'Adding…' : 'Add Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {kids.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-16">No students on this account yet. Add one above.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {kids.map((kid, i) => (
              <div key={i} className={enrolling === i ? 'opacity-60 pointer-events-none' : ''}>
                <KidCard
                  kid={kid}
                  kidIndex={i}
                  hasPaymentMethod={hasPaymentMethod}
                  onView={() => onSelectKid(kid)}
                  onEnroll={handleEnroll}
                  onAvatarUpdated={(url) => {
                    const updated = kids.map((k, j) => j === i ? { ...k, avatarUrl: url } : k);
                    onKidsUpdated(updated);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Kid Dashboard ────────────────────────────────────────────────────────────

function KidDashboard({ kid, onBack }: { kid: Kid; onBack: () => void }) {
  return (
    <BeltStudy
      userName={kid.name}
      initialBelt={kid.rank}
      showSignOut={false}
      onBack={onBack}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MembersPage() {
  const { data: session, status } = useSession();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [kids, setKids] = useState<Kid[]>([]);
  const [parentName, setParentName] = useState('');
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null);

  const loadProfile = () => {
    setProfileLoading(true);
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        setKids(data.kids ?? []);
        setParentName(data.parentName ?? session?.user?.name ?? 'Member');
        setHasPaymentMethod(!!data.hasPaymentMethod);
        setPurchases(data.purchases ?? []);
      })
      .finally(() => setProfileLoading(false));
  };

  useEffect(() => {
    if (!session) return;
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (status === 'loading' || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 text-sm">Loading…</div>
      </div>
    );
  }

  if (!session) {
    return authView === 'login'
      ? <LoginForm onSwitch={() => setAuthView('register')} />
      : <RegisterForm onSwitch={() => setAuthView('login')} />;
  }

  if (selectedKid) {
    return <KidDashboard kid={selectedKid} onBack={() => setSelectedKid(null)} />;
  }

  return (
    <FamilyDashboard
      parentName={parentName}
      kids={kids}
      hasPaymentMethod={hasPaymentMethod}
      purchases={purchases}
      onSelectKid={setSelectedKid}
      onKidsUpdated={(updated) => setKids(updated)}
      onPaymentUpdated={loadProfile}
    />
  );
}