'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const inputCls =
  'block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600';

const btnPrimary =
  'block w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed';

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">{children}</div>
    </div>
  );
}

function ResetPasswordForm() {
  const token = useSearchParams().get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <Card>
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Invalid link</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          This password reset link is missing its token. Please request a new one from the sign-in
          page.
        </p>
        <Link href="/members" className={btnPrimary}>
          Back to sign in
        </Link>
      </Card>
    );
  }

  if (done) {
    return (
      <Card>
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Password updated</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Your password has been changed. You can now sign in with your new password.
        </p>
        <Link href="/members" className={btnPrimary}>
          Go to sign in
        </Link>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setDone(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-1 uppercase tracking-wide">
        Choose a new password
      </h2>
      <p className="text-sm text-gray-500 text-center mb-6">
        Enter a new password for your account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
            New password
          </label>
          <input
            id="new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm password
          </label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className={inputCls}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className={btnPrimary}>
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        <Link href="/members" className="text-indigo-600 font-medium hover:underline">
          Back to sign in
        </Link>
      </p>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-500 text-sm">Loading…</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
