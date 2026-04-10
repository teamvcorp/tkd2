'use client';

import { useState, useEffect, useRef } from 'react';

interface PromoProduct {
  productId: string;
  name: string;
  price: number;
  stripeProductId: string;
  stripePriceId: string;
}

interface Promo {
  id: string;
  description: string;
  price: number;
  quantity: number;
  imageSrc: string;
  stripeProductId: string;
  stripePriceId: string;
  active: boolean;
  updatedAt: string;
  products?: PromoProduct[];
  notesPlaceholder?: string;
}

export default function AdminPromoClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [stripeProductId, setStripeProductId] = useState('');
  const [stripePriceId, setStripePriceId] = useState('');
  const [active, setActive] = useState(true);
  const [imageSrc, setImageSrc] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [products, setProducts] = useState<PromoProduct[]>([]);
  const [productPrices, setProductPrices] = useState<Record<string, string>>({});
  const [notesPlaceholder, setNotesPlaceholder] = useState('');
  const [pastPromos, setPastPromos] = useState<Promo[]>([]);
  const [loadingArchive, setLoadingArchive] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPromo();
    fetchArchive();
  }, []);

  async function fetchPromo() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promo');
      const data = await res.json();
      if (data.promo) {
        const p: Promo = data.promo;
        setDescription(p.description);
        setPrice((p.price / 100).toFixed(2));
        setQuantity(String(p.quantity));
        setStripeProductId(p.stripeProductId);
        setStripePriceId(p.stripePriceId);
        setActive(p.active);
        setImageSrc(p.imageSrc);
        setUpdatedAt(p.updatedAt);
        setProducts(p.products ?? []);
        setNotesPlaceholder(p.notesPlaceholder ?? '');
        const pp: Record<string, string> = {};
        for (const prod of p.products ?? []) {
          pp[prod.productId] = prod.price ? (prod.price / 100).toFixed(2) : '';
        }
        setProductPrices(pp);
      }
    } catch {
      setError('Failed to load promo.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchArchive() {
    setLoadingArchive(true);
    try {
      const res = await fetch('/api/admin/promo/archive');
      const data = await res.json();
      if (data.promos) setPastPromos(data.promos);
    } catch { /* ignore */ } finally {
      setLoadingArchive(false);
    }
  }

  function loadPastPromo(idx: number) {
    const p = pastPromos[idx];
    if (!p) return;
    setDescription(p.description);
    setPrice((p.price / 100).toFixed(2));
    setQuantity(String(p.quantity));
    setStripeProductId(p.stripeProductId);
    setStripePriceId(p.stripePriceId);
    setActive(p.active);
    setImageSrc(p.imageSrc);
    setProducts(p.products ?? []);
    setNotesPlaceholder(p.notesPlaceholder ?? '');
    const pp: Record<string, string> = {};
    for (const prod of p.products ?? []) {
      pp[prod.productId] = prod.price ? (prod.price / 100).toFixed(2) : '';
    }
    setProductPrices(pp);
    setSuccess('Past promo loaded — make edits and click Save.');
    setTimeout(() => setSuccess(''), 4000);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const priceNum = Math.round(parseFloat(price) * 100);
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Enter a valid price.');
      return;
    }
    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum < 0) {
      setError('Enter a valid quantity.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          price: priceNum,
          quantity: qtyNum,
          stripeProductId: stripeProductId.trim(),
          stripePriceId: stripePriceId.trim(),
          active,
          products,
          notesPlaceholder: notesPlaceholder.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Save failed.');
        return;
      }
      setUpdatedAt(data.promo.updatedAt);
      setSuccess('Promo saved!');
      setTimeout(() => setSuccess(''), 3000);
      fetchArchive();
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/admin/promo/image', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Image upload failed.');
        return;
      }
      setImageSrc(data.url);
      setSuccess('Image uploaded!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Image upload error.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading promo…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Current Promo</h1>
          <a href="/admin" className="text-sm text-blue-600 hover:underline">
            ← Back to Admin
          </a>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 mb-4">
            {success}
          </div>
        )}

        {/* Quick Change — load a past promo */}
        {pastPromos.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quick Change — Load a Past Promo
            </label>
            <select
              defaultValue=""
              onChange={(e) => {
                const idx = parseInt(e.target.value, 10);
                if (!isNaN(idx)) loadPastPromo(idx);
                e.target.value = '';
              }}
              className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>
                {loadingArchive ? 'Loading…' : 'Select a past promo…'}
              </option>
              {pastPromos.map((p, i) => (
                <option key={p.id} value={i}>
                  {p.description.slice(0, 60)}{p.description.length > 60 ? '…' : ''} — ${(p.price / 100).toFixed(2)}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Selecting a past promo fills the form below. Click &quot;Save Promo&quot; to apply it.
            </p>
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-6 space-y-5">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the current promo…"
            />
          </div>

          {/* Price & Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="25.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="50"
              />
            </div>
          </div>

          {/* Stripe Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stripe Product ID
              </label>
              <input
                type="text"
                value={stripeProductId}
                onChange={(e) => setStripeProductId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-gray-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="prod_xxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stripe Price ID
              </label>
              <input
                type="text"
                value={stripePriceId}
                onChange={(e) => setStripePriceId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-gray-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="price_xxx"
              />
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <input
              id="active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-700">
              Promo is active
            </label>
          </div>

          {/* Notes Placeholder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Notes Placeholder
            </label>
            <input
              type="text"
              value={notesPlaceholder}
              onChange={(e) => setNotesPlaceholder(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any special requests or notes?"
            />
            <p className="text-xs text-gray-400 mt-1">Placeholder text shown in the customer notes field on the promo page.</p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Promo Image
            </label>
            {imageSrc && (
              <img
                src={imageSrc}
                alt="Promo"
                className="w-48 h-48 object-cover rounded-lg border mb-2"
              />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploading && (
              <p className="text-sm text-gray-500 mt-1">Uploading…</p>
            )}
            <p className="text-xs text-gray-400 mt-1">Max 5 MB. Save the promo first before uploading an image.</p>
          </div>

          {/* ── Additional Products ── */}
          <div className="border-t pt-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800">Additional Products (optional)</h2>
              <button
                type="button"
                onClick={() => {
                  const id = crypto.randomUUID();
                  setProducts([
                    ...products,
                    { productId: id, name: '', price: 0, stripeProductId: '', stripePriceId: '' },
                  ]);
                  setProductPrices({ ...productPrices, [id]: '' });
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                + Add Product
              </button>
            </div>
            {products.length === 0 && (
              <p className="text-sm text-gray-400">No additional products. Click &quot;+ Add Product&quot; to add one.</p>
            )}
            {products.map((prod, idx) => (
              <div key={prod.productId} className="bg-gray-50 border rounded-lg p-4 mb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Product {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const { [prod.productId]: _, ...rest } = productPrices;
                      setProductPrices(rest);
                      setProducts(products.filter((_, i) => i !== idx));
                    }}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Product name"
                  value={prod.name}
                  onChange={(e) => {
                    const updated = [...products];
                    updated[idx] = { ...updated[idx], name: e.target.value };
                    setProducts(updated);
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Price ($)"
                    value={productPrices[prod.productId] ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProductPrices({ ...productPrices, [prod.productId]: val });
                      const cents = Math.round(parseFloat(val || '0') * 100);
                      const updated = [...products];
                      updated[idx] = { ...updated[idx], price: isNaN(cents) ? 0 : cents };
                      setProducts(updated);
                    }}
                    className="w-full border rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Stripe Product ID"
                    value={prod.stripeProductId}
                    onChange={(e) => {
                      const updated = [...products];
                      updated[idx] = { ...updated[idx], stripeProductId: e.target.value };
                      setProducts(updated);
                    }}
                    className="w-full border rounded-lg px-3 py-2 text-gray-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Stripe Price ID"
                  value={prod.stripePriceId}
                  onChange={(e) => {
                    const updated = [...products];
                    updated[idx] = { ...updated[idx], stripePriceId: e.target.value };
                    setProducts(updated);
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-gray-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {saving ? 'Saving…' : 'Save Promo'}
            </button>
            {updatedAt && (
              <span className="text-xs text-gray-400">
                Last updated: {new Date(updatedAt).toLocaleString()}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
