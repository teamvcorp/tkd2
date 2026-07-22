'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Reader {
  id: string;
  label: string | null;
  deviceType: string;
  status: string | null; // 'online' | 'offline'
  location: string | null;
}

type SaleState = 'idle' | 'creating' | 'waiting' | 'succeeded' | 'failed' | 'canceled';

const READER_LS_KEY = 'admin_register_reader';
const POLL_MS = 1500;
const POLL_TIMEOUT_MS = 90_000; // stop polling after 90s of no result

export default function AdminRegisterClient() {
  // ── Reader selection ────────────────────────────────────────────────────────
  const [readers, setReaders] = useState<Reader[]>([]);
  const [readerId, setReaderId] = useState('');
  const [readersLoading, setReadersLoading] = useState(true);
  const [readersError, setReadersError] = useState('');

  // ── Sale form + flow ────────────────────────────────────────────────────────
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [sale, setSale] = useState<SaleState>('idle');
  const [saleMsg, setSaleMsg] = useState('');
  const paymentIntentId = useRef<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStart = useRef<number>(0);

  const selectedReader = readers.find((r) => r.id === readerId) ?? null;

  // ── Load readers on mount ─────────────────────────────────────────────────────
  const loadReaders = useCallback(async () => {
    setReadersLoading(true);
    setReadersError('');
    try {
      const res = await fetch('/api/admin/register/readers');
      const data = await res.json();
      if (!res.ok) {
        setReadersError(data.error ?? 'Could not load readers.');
        return;
      }
      const list: Reader[] = data.readers ?? [];
      setReaders(list);
      // Prefer the server-saved selection, then localStorage, then the first reader.
      const saved = data.selectedReaderId as string | null;
      const local = typeof window !== 'undefined' ? window.localStorage.getItem(READER_LS_KEY) : null;
      const pick = [saved, local, list[0]?.id].find((id) => id && list.some((r) => r.id === id));
      if (pick) setReaderId(pick);
    } catch {
      setReadersError('Could not load readers. Check your connection.');
    } finally {
      setReadersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReaders();
  }, [loadReaders]);

  // Clean up any pending poll on unmount.
  useEffect(() => () => { if (pollTimer.current) clearTimeout(pollTimer.current); }, []);

  const handleSelectReader = async (id: string) => {
    setReaderId(id);
    if (typeof window !== 'undefined') window.localStorage.setItem(READER_LS_KEY, id);
    // Persist selection server-side (best-effort; localStorage is the fallback).
    fetch('/api/admin/register/readers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readerId: id }),
    }).catch(() => {});
  };

  // ── Polling ───────────────────────────────────────────────────────────────────
  const poll = useCallback(() => {
    const piId = paymentIntentId.current;
    if (!piId || !readerId) return;

    pollTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/register/status?readerId=${encodeURIComponent(readerId)}&paymentIntentId=${encodeURIComponent(piId)}`,
        );
        const data = await res.json();

        if (data.paymentStatus === 'succeeded') {
          setSale('succeeded');
          return;
        }
        if (data.paymentStatus === 'canceled') {
          setSale('canceled');
          setSaleMsg('Sale canceled.');
          return;
        }
        if (data.readerActionStatus === 'failed') {
          setSale('failed');
          setSaleMsg(data.failureMessage ?? data.lastPaymentError ?? 'Payment failed or was declined.');
          return;
        }

        // Still in progress — keep polling until the timeout.
        if (Date.now() - pollStart.current > POLL_TIMEOUT_MS) {
          setSale('failed');
          setSaleMsg('Timed out waiting for the reader. Check the device and try again.');
          return;
        }
        poll();
      } catch {
        // Transient network error — keep trying until timeout.
        if (Date.now() - pollStart.current > POLL_TIMEOUT_MS) {
          setSale('failed');
          setSaleMsg('Lost connection while waiting for the reader.');
          return;
        }
        poll();
      }
    }, POLL_MS);
  }, [readerId]);

  // ── Charge ──────────────────────────────────────────────────────────────────
  const handleCharge = async () => {
    setSaleMsg('');
    const dollars = parseFloat(amount);
    if (isNaN(dollars) || dollars <= 0) {
      setSale('failed');
      setSaleMsg('Enter a valid amount.');
      return;
    }
    if (!readerId) {
      setSale('failed');
      setSaleMsg('Select a reader first.');
      return;
    }
    const amountCents = Math.round(dollars * 100);

    setSale('creating');
    try {
      const res = await fetch('/api/admin/register/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents, note: note.trim() || undefined, readerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSale('failed');
        setSaleMsg(data.error ?? 'Could not start the charge.');
        return;
      }
      paymentIntentId.current = data.paymentIntentId;
      pollStart.current = Date.now();
      setSale('waiting');
      poll();
    } catch {
      setSale('failed');
      setSaleMsg('Something went wrong starting the charge.');
    }
  };

  const handleCancel = async () => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    try {
      await fetch('/api/admin/register/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readerId, paymentIntentId: paymentIntentId.current }),
      });
      setSale('canceled');
      setSaleMsg('Sale canceled.');
    } catch {
      // Cancellation may be rejected if the card is already authorizing — resume polling.
      setSaleMsg('Could not cancel — the card may already be processing.');
      poll();
    }
  };

  const newSale = () => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    paymentIntentId.current = null;
    setAmount('');
    setNote('');
    setSale('idle');
    setSaleMsg('');
  };

  const busy = sale === 'creating' || sale === 'waiting';

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Register</h1>
          <a
            href="/admin"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            ← Dashboard
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
          {/* Reader selector */}
          <div>
            <label htmlFor="reader" className="block text-sm font-medium text-gray-700 mb-1">
              Card Reader
            </label>
            {readersLoading ? (
              <p className="text-sm text-gray-400">Loading readers…</p>
            ) : readers.length === 0 ? (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                No readers found. Register your S710 in the Stripe Dashboard
                (Terminal → Readers), then{' '}
                <button onClick={loadReaders} className="font-medium underline">refresh</button>.
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  id="reader"
                  value={readerId}
                  disabled={busy}
                  onChange={(e) => handleSelectReader(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {readers.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label ?? r.id} {r.status === 'online' ? '' : '(offline)'}
                    </option>
                  ))}
                </select>
                <span
                  title={selectedReader?.status ?? 'unknown'}
                  className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                    selectedReader?.status === 'online' ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              </div>
            )}
            {readersError && <p className="mt-1 text-sm text-red-600">{readersError}</p>}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">$</span>
              <input
                id="amount"
                type="number"
                min="0.50"
                step="0.01"
                inputMode="decimal"
                value={amount}
                disabled={busy}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="block w-full rounded-md border border-gray-300 bg-white pl-7 pr-3 py-2 text-lg font-semibold text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
              Note <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="note"
              type="text"
              maxLength={200}
              value={note}
              disabled={busy}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Belt test fee, sparring gloves"
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          {/* Status banner */}
          {sale === 'waiting' && (
            <div className="rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3 text-sm text-indigo-800 flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              Waiting for the customer to tap or insert their card…
            </div>
          )}
          {sale === 'creating' && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-600">
              Sending to reader…
            </div>
          )}
          {sale === 'succeeded' && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm font-medium text-green-800">
              ✓ Payment approved.
            </div>
          )}
          {(sale === 'failed' || sale === 'canceled') && saleMsg && (
            <div className={`rounded-lg px-4 py-3 text-sm ${
              sale === 'canceled'
                ? 'bg-gray-50 border border-gray-200 text-gray-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {saleMsg}
            </div>
          )}

          {/* Actions */}
          {sale === 'succeeded' || sale === 'canceled' || sale === 'failed' ? (
            <button
              type="button"
              onClick={newSale}
              className="block w-full rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              New Sale
            </button>
          ) : sale === 'waiting' ? (
            <button
              type="button"
              onClick={handleCancel}
              className="block w-full rounded-md border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel Sale
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCharge}
              disabled={busy || readersLoading || readers.length === 0 || !readerId}
              className="block w-full rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sale === 'creating' ? 'Sending…' : 'Charge on Reader'}
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Charges run on the physical reader. Transactions appear in Stripe tagged
          <span className="font-mono"> source=admin_register</span>.
        </p>
      </div>
    </div>
  );
}
