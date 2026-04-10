'use client';

import { useState, useEffect, useRef } from 'react';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { ArrowUpTrayIcon, CheckCircleIcon, TrashIcon, PlusIcon, XMarkIcon, PencilIcon, KeyIcon, ChevronDownIcon, ChevronUpIcon, UserGroupIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { SHOP_CATEGORIES } from '@/lib/shop-types';
import type { ShopProduct, ShopCategory } from '@/lib/shop-types';
import { PROGRAMS } from '@/lib/programs';
import type { Kid } from '@/lib/types';

const BELT_OPTIONS = [
  { value: 'white', label: 'White' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'orange', label: 'Orange' },
  { value: 'green', label: 'Green' },
  { value: 'purple', label: 'Purple' },
  { value: 'lightBlue', label: 'Light Blue' },
  { value: 'darkBlue', label: 'Dark Blue' },
  { value: 'brown', label: 'Brown' },
  { value: 'red', label: 'Red' },
];

interface AdminUser {
  id: string;
  username: string;
  parentName: string;
  parentAge: number;
  kids: Kid[];
  stripeCustomerId?: string;
  hasPaymentMethod: boolean;
  archived?: boolean;
}

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
  onCategoryChange,
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
  onCategoryChange: (id: string, category: ShopCategory) => void;
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

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Category</label>
          <select
            value={product.category}
            onChange={(e) => onCategoryChange(product.id, e.target.value as ShopCategory)}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {SHOP_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
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

  // ── Users tab state ────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<'shop' | 'users'>('shop');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [editingKids, setEditingKids] = useState<Record<string, Kid[]>>({});
  const [userSavingId, setUserSavingId] = useState<string | null>(null);
  const [userSavedId, setUserSavedId] = useState<string | null>(null);
  const [resetPwUserId, setResetPwUserId] = useState<string | null>(null);
  const [resetPwValue, setResetPwValue] = useState('');
  const [resetPwLoading, setResetPwLoading] = useState(false);
  const [resetPwDone, setResetPwDone] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) return;
      const data = await res.json();
      setUsers(data.users ?? []);
      setUsersLoaded(true);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSwitchSection = (section: 'shop' | 'users') => {
    setActiveSection(section);
    if (section === 'users' && !usersLoaded) loadUsers();
  };

  const handleSaveKids = async (userId: string) => {
    const kids = editingKids[userId];
    if (!kids) return;
    setUserSavingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kids }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, kids } : u));
        setUserSavedId(userId);
        setTimeout(() => setUserSavedId(null), 2000);
      } else {
        setError('Failed to save user. Please try again.');
      }
    } catch {
      setError('Failed to save user. Please try again.');
    } finally {
      setUserSavingId(null);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!resetPwValue || resetPwValue.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setResetPwLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPwValue }),
      });
      if (res.ok) {
        setResetPwDone(userId);
        setResetPwValue('');
        setResetPwUserId(null);
        setTimeout(() => setResetPwDone(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error ?? 'Password reset failed.');
      }
    } catch {
      setError('Password reset failed.');
    } finally {
      setResetPwLoading(false);
    }
  };

  const startEditingKids = (user: AdminUser) => {
    setEditingKids((prev) => ({
      ...prev,
      [user.id]: user.kids.map((k) => ({ ...k })),
    }));
    setExpandedUserId(user.id);
  };

  const updateEditingKid = (userId: string, kidIndex: number, field: keyof Kid, value: string | number) => {
    setEditingKids((prev) => {
      const kids = [...(prev[userId] ?? [])];
      kids[kidIndex] = { ...kids[kidIndex], [field]: value };
      return { ...prev, [userId]: kids };
    });
  };

  const removeEditingKid = (userId: string, kidIndex: number) => {
    setEditingKids((prev) => {
      const kids = [...(prev[userId] ?? [])];
      kids.splice(kidIndex, 1);
      return { ...prev, [userId]: kids };
    });
  };

  const filteredUsers = users.filter((u) => {
    if (!showArchived && u.archived) return false;
    if (showArchived && !u.archived) return false;
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.parentName.toLowerCase().includes(q) ||
      u.kids.some((k) => k.name.toLowerCase().includes(q))
    );
  });

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

  const handleCategoryChange = async (productId: string, category: ShopCategory) => {
    setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, category } : p));
    await saveProductFields(productId, { category });
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
          <p className="text-sm text-gray-500 text-center mb-6">Management Dashboard</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/promo"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Promo
            </a>
            <a
              href="/admin/chat"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Chat
            </a>
            <a
              href="/admin/reports"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Reports
            </a>
            <button
              onClick={handleLogout}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Section switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => handleSwitchSection('shop')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeSection === 'shop'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <ShoppingBagIcon className="w-4 h-4" />
            Pro Shop
          </button>
          <button
            onClick={() => handleSwitchSection('users')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeSection === 'users'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <UserGroupIcon className="w-4 h-4" />
            Users
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex justify-between">
            {error}
            <button onClick={() => setError('')} className="font-medium hover:underline">Dismiss</button>
          </div>
        )}

        {/* ── Pro Shop Section ──────────────────────────────────────────── */}
        {activeSection === 'shop' && (
          <>
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
                        onCategoryChange={handleCategoryChange}
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
          </>
        )}

        {/* ── Users Section ─────────────────────────────────────────────── */}
        {activeSection === 'users' && (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search by email, parent name, or kid name…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full max-w-md rounded-md border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Show Archived
              </label>
            </div>

            {usersLoading ? (
              <div className="py-12 text-center text-gray-400 text-sm">Loading users…</div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                {userSearch ? 'No users match your search.' : 'No users found.'}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredUsers.map((user) => {
                  const isExpanded = expandedUserId === user.id;
                  const kids = editingKids[user.id] ?? user.kids;
                  return (
                    <div key={user.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      {/* User header row */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedUserId(null);
                          } else {
                            startEditingKids(user);
                          }
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {user.parentName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user.parentName}</p>
                            <p className="text-xs text-gray-500 truncate">@{user.username} · {user.kids.length} kid{user.kids.length !== 1 ? 's' : ''}{user.archived ? ' · Archived' : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {resetPwDone === user.id && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircleIcon className="w-3.5 h-3.5" /> Password reset
                            </span>
                          )}
                          {userSavedId === user.id && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircleIcon className="w-3.5 h-3.5" /> Saved
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 px-4 py-4">
                          {/* Password reset */}
                          <div className="mb-5 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                              <KeyIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reset Password</span>
                            </div>
                            {resetPwUserId === user.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="New password (min 8 chars)"
                                  value={resetPwValue}
                                  onChange={(e) => setResetPwValue(e.target.value)}
                                  className="flex-1 rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                  type="button"
                                  disabled={resetPwLoading}
                                  onClick={() => handleResetPassword(user.id)}
                                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                                >
                                  {resetPwLoading ? 'Resetting…' : 'Reset'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setResetPwUserId(null); setResetPwValue(''); }}
                                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setResetPwUserId(user.id)}
                                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                              >
                                Reset Password
                              </button>
                            )}
                          </div>

                          {/* Kids editing */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <PencilIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Students</span>
                            </div>

                            {kids.length === 0 ? (
                              <p className="text-xs text-gray-400">No students registered.</p>
                            ) : (
                              <div className="flex flex-col gap-4">
                                {kids.map((kid, idx) => (
                                  <div key={idx} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-sm font-semibold text-gray-900">{kid.name}</p>
                                      <button
                                        type="button"
                                        title="Remove student"
                                        onClick={() => {
                                          if (window.confirm(`Remove "${kid.name}" from this account? Click Save Changes to confirm.`)) {
                                            removeEditingKid(user.id, idx);
                                          }
                                        }}
                                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                      >
                                        <TrashIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                      {/* Rank */}
                                      <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600">Rank</label>
                                        <select
                                          value={kid.rank}
                                          onChange={(e) => updateEditingKid(user.id, idx, 'rank', e.target.value)}
                                          className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        >
                                          {BELT_OPTIONS.map((b) => (
                                            <option key={b.value} value={b.value}>{b.label}</option>
                                          ))}
                                        </select>
                                      </div>
                                      {/* Program */}
                                      <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600">Program</label>
                                        <select
                                          value={kid.program ?? ''}
                                          onChange={(e) => updateEditingKid(user.id, idx, 'program', e.target.value)}
                                          className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        >
                                          <option value="">None</option>
                                          {PROGRAMS.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                      {/* Status */}
                                      <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600">Status</label>
                                        <select
                                          value={kid.status ?? 'pending'}
                                          onChange={(e) => updateEditingKid(user.id, idx, 'status', e.target.value)}
                                          className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        >
                                          <option value="pending">Pending</option>
                                          <option value="active">Active</option>
                                          <option value="inactive">Inactive</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Save button */}
                            <div className="mt-4 flex items-center gap-3">
                              <button
                                type="button"
                                disabled={userSavingId === user.id}
                                onClick={() => handleSaveKids(user.id)}
                                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                              >
                                {userSavingId === user.id ? 'Saving…' : 'Save Changes'}
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  const action = user.archived ? 'unarchive' : 'archive';
                                  if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this user?`)) return;
                                  await fetch(`/api/admin/users/${user.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ archived: !user.archived }),
                                  });
                                  setUsers(users.map((u) => u.id === user.id ? { ...u, archived: !u.archived } : u));
                                  setExpandedUserId(null);
                                }}
                                className={`rounded-md border px-4 py-2 text-sm font-medium ${
                                  user.archived
                                    ? 'border-green-300 text-green-700 hover:bg-green-50'
                                    : 'border-red-300 text-red-700 hover:bg-red-50'
                                }`}
                              >
                                {user.archived ? 'Unarchive' : 'Archive'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
