'use client';

import { useState, useEffect, useRef } from 'react';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { ArrowUpTrayIcon, CheckCircleIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { SHOP_CATEGORIES } from '@/lib/shop';
import type { ShopProduct, ShopCategory } from '@/lib/shop';

interface AdminProduct extends Omit<ShopProduct, 'quantity'> {
  quantity: number | null;
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  uploading,
  saving,
  saved,
  onQuantityChange,
  onInStockToggle,
  onImageUpload,
  onStripeIdsChange,
  onDelete,
}: {
  product: AdminProduct;
  uploading: boolean;
  saving: boolean;
  saved: boolean;
  onQuantityChange: (id: string, qty: number) => void;
  onInStockToggle: (id: string, inStock: boolean) => void;
  onImageUpload: (id: string, file: File) => void;
  onStripeIdsChange: (id: string, stripeProductId: string, stripePriceId: string) => void;
  onDelete: (id: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [qty, setQty] = useState(product.quantity !== null ? String(product.quantity) : '');
  const [prodId, setProdId] = useState(product.stripeProductId ?? '');
  const [priceId, setPriceId] = useState(product.stripePriceId ?? '');

  useEffect(() => {
    setQty(product.quantity !== null ? String(product.quantity) : '');
  }, [product.quantity]);

  useEffect(() => {
    setProdId(product.stripeProductId ?? '');
    setPriceId(product.stripePriceId ?? '');
  }, [product.stripeProductId, product.stripePriceId]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Image with upload overlay */}
      <div className="relative aspect-[4/3] w-full bg-gray-100 group">
        {product.imageSrc?.startsWith('http') ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageSrc} alt={product.imageAlt} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 gap-1">
            <ArrowUpTrayIcon className="w-8 h-8" />
            <span className="text-xs">No image</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity disabled:cursor-wait"
        >
          {uploading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <ArrowUpTrayIcon className="w-6 h-6 text-white" />
              <span className="text-xs text-white mt-1 font-semibold">Upload Image</span>
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImageUpload(product.id, file);
            e.target.value = '';
          }}
        />
      </div>

      {/* Controls */}
      <div className="p-3 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 leading-snug">{product.name}</p>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
                onDelete(product.id);
              }
            }}
            className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Delete product"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>

        {/* In Stock toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">In Stock</span>
          <button
            type="button"
            onClick={() => onInStockToggle(product.id, !product.inStock)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              product.inStock ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                product.inStock ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Quantity */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Qty on hand</label>
          <input
            type="number"
            min={0}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            onBlur={() => {
              const n = parseInt(qty, 10);
              if (!isNaN(n) && n >= 0) onQuantityChange(product.id, n);
            }}
            placeholder="—"
            className="w-16 rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 text-center focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Save feedback */}
        {(saving || saved) && (
          <div className={`flex items-center gap-1 text-xs ${saved ? 'text-green-600' : 'text-gray-400'}`}>
            {saved ? (
              <>
                <CheckCircleIcon className="w-3.5 h-3.5" />
                Saved
              </>
            ) : (
              'Saving…'
            )}
          </div>
        )}

        {/* Stripe IDs */}
        <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stripe IDs</p>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Product ID</label>
            <input
              type="text"
              value={prodId}
              onChange={(e) => setProdId(e.target.value)}
              onBlur={() => onStripeIdsChange(product.id, prodId.trim(), priceId.trim())}
              placeholder="prod_…"
              className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Price ID</label>
            <input
              type="text"
              value={priceId}
              onChange={(e) => setPriceId(e.target.value)}
              onBlur={() => onStripeIdsChange(product.id, prodId.trim(), priceId.trim())}
              placeholder="price_…"
              className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Page ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // ── Add-product modal state ────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCategory, setAddCategory] = useState<ShopCategory>('Uniforms');
  const [addForm, setAddForm] = useState({
    name: '', description: '', price: '', stripeProductId: '', stripePriceId: '', sizes: '',
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const saveProductFields = async (productId: string, fields: Record<string, unknown>) => {
    setSavingId(productId);
    try {
      await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      setSavedId(productId);
      setTimeout(() => setSavedId(null), 2000);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSavingId(null);
    }
  };

  const loadProducts = async () => {
    setPageLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      if (!res.ok) return;
      const data = await res.json();
      setProducts(data.products ?? []);
    } finally {
      setPageLoading(false);
    }
  };

  // Check if already authed on mount
  useEffect(() => {
    fetch('/api/admin/products').then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products ?? []);
        setAuthed(true);
      }
      setPageLoading(false);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setAuthError(data.error ?? 'Invalid password.'); return; }
      setAuthed(true);
      loadProducts();
    } catch {
      setAuthError('Something went wrong.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setAuthed(false);
    setProducts([]);
  };

  const handleInStockToggle = async (productId: string, inStock: boolean) => {
    setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, inStock } : p));
    await saveProductFields(productId, { inStock });
  };

  const handleQuantityChange = async (productId: string, quantity: number) => {
    setProducts((prev) =>
      prev.map((p) => p.id === productId ? { ...p, quantity, inStock: quantity > 0 } : p),
    );
    await saveProductFields(productId, { quantity, inStock: quantity > 0 });
  };

  const handleStripeIdsChange = async (productId: string, stripeProductId: string, stripePriceId: string) => {
    setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, stripeProductId, stripePriceId } : p));
    await saveProductFields(productId, { stripeProductId, stripePriceId });
  };

  const handleImageUpload = async (productId: string, file: File) => {
    setUploadingId(productId);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`/api/admin/products/${productId}/image`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Upload failed.'); return; }
      setProducts((prev) =>
        prev.map((p) => p.id === productId ? { ...p, imageSrc: data.url } : p),
      );
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploadingId(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' });
      if (!res.ok) {
        setError('Delete failed. Please refresh.');
        loadProducts();
      }
    } catch {
      setError('Delete failed. Please refresh.');
      loadProducts();
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    const priceVal = parseFloat(addForm.price);
    if (!addForm.name.trim()) { setAddError('Name is required.'); return; }
    if (isNaN(priceVal) || priceVal <= 0) { setAddError('Enter a valid price.'); return; }
    setAdding(true);
    try {
      const payload = {
        name: addForm.name.trim(),
        description: addForm.description.trim(),
        price: Math.round(priceVal * 100),
        category: addCategory,
        stripeProductId: addForm.stripeProductId.trim(),
        stripePriceId: addForm.stripePriceId.trim(),
        sizes: addForm.sizes ? addForm.sizes.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        inStock: true,
        quantity: null,
        imageSrc: '',
        imageAlt: addForm.name.trim(),
      };
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error ?? 'Failed to create product.'); return; }
      setProducts((prev) => [...prev, { ...data.product, quantity: data.product.quantity ?? null }]);
      setShowAddModal(false);
      setAddForm({ name: '', description: '', price: '', stripeProductId: '', stripePriceId: '', sizes: '' });
    } catch {
      setAddError('Something went wrong.');
    } finally {
      setAdding(false);
    }
  };

  // ── Loading splash ─────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  // ── Password gate ──────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-1 uppercase tracking-wide">
            Admin
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6">Pro Shop Management</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="block w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {authError && <p className="text-sm text-red-600">{authError}</p>}
            <button
              type="submit"
              disabled={authLoading}
              className="block w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {authLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-y-3 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pro Shop Admin</h1>
            <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">
              Tap or hover a product image to upload · Toggle In Stock · Set quantity
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Sign Out
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex justify-between">
            {error}
            <button onClick={() => setError('')} className="font-medium hover:underline">Dismiss</button>
          </div>
        )}

        <TabGroup>
          <div className="overflow-x-auto border-b border-gray-200 mb-6">
            <TabList className="-mb-px flex space-x-8">
              {SHOP_CATEGORIES.map((cat) => (
                <Tab
                  key={cat}
                  className="whitespace-nowrap border-b-2 border-transparent py-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 data-[selected]:border-indigo-500 data-[selected]:text-indigo-600 focus:outline-none"
                >
                  {cat}
                </Tab>
              ))}
            </TabList>
          </div>

          <TabPanels>
            {SHOP_CATEGORIES.map((cat) => {
              const catProducts = products.filter((p) => p.category === cat);
              return (
                <TabPanel key={cat}>
                  <div className="mb-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => { setAddCategory(cat); setShowAddModal(true); }}
                      className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Product
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {catProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        uploading={uploadingId === product.id}
                        saving={savingId === product.id}
                        saved={savedId === product.id}
                        onQuantityChange={handleQuantityChange}
                        onInStockToggle={handleInStockToggle}
                        onImageUpload={handleImageUpload}
                        onStripeIdsChange={handleStripeIdsChange}
                        onDelete={handleDeleteProduct}
                      />
                    ))}
                    {catProducts.length === 0 && (
                      <p className="text-sm text-gray-400 col-span-full py-8 text-center">
                        No products in this category.
                      </p>
                    )}
                  </div>
                </TabPanel>
              );
            })}
          </TabPanels>
        </TabGroup>
      </div>

      {/* ── Add Product Modal ─────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Add Product</h2>
              <button type="button" onClick={() => setShowAddModal(false)}>
                <XMarkIcon className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Name *</label>
                <input
                  type="text" required value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Description</label>
                <textarea
                  rows={2} value={addForm.description}
                  onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                  className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-700">Price (USD) *</label>
                  <input
                    type="number" step="0.01" min="0.01" required value={addForm.price}
                    onChange={(e) => setAddForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="45.00"
                    className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-700">Category</label>
                  <select
                    value={addCategory}
                    onChange={(e) => setAddCategory(e.target.value as ShopCategory)}
                    className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {SHOP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Sizes (comma-separated, optional)</label>
                <input
                  type="text" value={addForm.sizes}
                  onChange={(e) => setAddForm((f) => ({ ...f, sizes: e.target.value }))}
                  placeholder="XS, S, M, L, XL"
                  className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Stripe Product ID</label>
                <input
                  type="text" value={addForm.stripeProductId}
                  onChange={(e) => setAddForm((f) => ({ ...f, stripeProductId: e.target.value }))}
                  placeholder="prod_…"
                  className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Stripe Price ID</label>
                <input
                  type="text" value={addForm.stripePriceId}
                  onChange={(e) => setAddForm((f) => ({ ...f, stripePriceId: e.target.value }))}
                  placeholder="price_…"
                  className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              {addError && <p className="text-sm text-red-600">{addError}</p>}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {adding ? 'Adding…' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
