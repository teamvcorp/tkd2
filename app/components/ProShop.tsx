'use client';

import { useState, useEffect } from 'react';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { SHOP_CATEGORIES, formatShopPrice } from '@/lib/shop-types';
import AddressAutocomplete from '@/app/components/AddressAutocomplete';
import type { ShopProduct } from '@/lib/shop-types';

interface PendingPurchase {
  product: ShopProduct;
  size?: string;
  fulfillment: 'ship' | 'pickup';
  shippingAddress: string;
}

export default function ProShop({ hasPaymentMethod }: { hasPaymentMethod: boolean }) {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [pendingPurchase, setPendingPurchase] = useState<PendingPurchase | null>(null);

  // Load overrides from server (images, inStock) — static data used as initial state
  useEffect(() => {
    fetch('/api/shop/products')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (Array.isArray(data)) setProducts(data as ShopProduct[]); })
      .catch(() => { /* keep static products on error */ });
  }, []);

  const openConfirm = (product: ShopProduct, size?: string) =>
    setPendingPurchase({ product, size, fulfillment: 'pickup', shippingAddress: '' });

  const handleBuy = async (productId: string) => {
    setBuying(productId);
    setError('');
    setSuccess(null);
    try {
      const res = await fetch('/api/stripe/shop-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          size: pendingPurchase?.size,
          fulfillment: pendingPurchase?.fulfillment,
          shippingAddress: pendingPurchase?.shippingAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Purchase failed. Please try again.');
      } else {
        setPendingPurchase(null);
        setSuccess(productId);
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setBuying(null);
  };

  return (
    <>
      {/* ── Confirm purchase modal ───────────────────────────────────────── */}
      {pendingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Confirm Purchase</h3>
            <p className="text-sm text-gray-600">You are about to purchase:</p>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-1">
              <p className="text-sm font-semibold text-gray-900">{pendingPurchase.product.name}</p>
              {pendingPurchase.size && (
                <p className="text-xs text-gray-500">Size: {pendingPurchase.size}</p>
              )}
              <p className="text-lg font-bold text-indigo-600">{formatShopPrice(pendingPurchase.product.price)}</p>
            </div>

            {/* ── Fulfillment */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">How would you like to receive this item?</p>
              <div className="flex gap-3">
                {(['pickup', 'ship'] as const).map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="fulfillment"
                      value={opt}
                      checked={pendingPurchase.fulfillment === opt}
                      onChange={() =>
                        setPendingPurchase((p) => p ? { ...p, fulfillment: opt } : p)
                      }
                      className="accent-indigo-600"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {opt === 'pickup' ? '🏢 Pick up in store' : '📦 Ship to me'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {pendingPurchase.fulfillment === 'ship' && (
              <div>
                <label htmlFor="shipping-address" className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
                <AddressAutocomplete
                  id="shipping-address"
                  name="shipping-address"
                  placeholder="123 Main St, Storm Lake, IA 50588"
                  value={pendingPurchase.shippingAddress}
                  onChange={(v) =>
                    setPendingPurchase((p) => p ? { ...p, shippingAddress: v } : p)
                  }
                />
              </div>
            )}

            <p className="text-xs text-gray-500">
              Your saved card on file will be charged{' '}
              <strong>{formatShopPrice(pendingPurchase.product.price)}</strong> immediately
              when you click &ldquo;Confirm &amp; Pay&rdquo;. This action cannot be undone.
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setPendingPurchase(null); setError(''); }}
                className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={buying === pendingPurchase.product.id}
                onClick={() => handleBuy(pendingPurchase.product.id)}
                className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {buying === pendingPurchase.product.id ? 'Processing…' : 'Confirm & Pay'}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="mb-12">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Pro Shop</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Gear up with official Taekwondo equipment — charged to your card on file.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <TabGroup>
        {/* Tab bar */}
        <div className="-mx-4 sm:mx-0 overflow-x-auto">
          <div className="border-b border-gray-200 px-4 sm:px-0">
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
        </div>

        {/* Panels */}
        <TabPanels>
          {SHOP_CATEGORIES.map((cat) => {
            const catProducts = products.filter((p) => p.category === cat);
            return (
              <TabPanel key={cat} className="pt-6">
                {products.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-10">
                    No products in this category yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {catProducts.map((product) => {
                      const size =
                        selectedSizes[product.id] ?? product.sizes?.[0] ?? '';

                      return (
                        <div
                          key={product.id}
                          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
                        >
                          {/* Product image */}
                          <div className="relative aspect-[4/3] w-full bg-gray-100">
                            {product.imageSrc?.startsWith('http') ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.imageSrc}
                                alt={product.imageAlt}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-300 text-xs">No image</div>
                            )}
                            {!product.inStock && (
                              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                  Out of Stock
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Card body */}
                          <div className="p-4 flex flex-col flex-1 gap-1">
                            <h3 className="font-semibold text-gray-900 text-sm leading-snug">
                              {product.name}
                            </h3>
                            <p className="text-xs text-gray-500 flex-1 leading-relaxed">
                              {product.description}
                            </p>
                            <p className="text-base font-bold text-indigo-600 mt-1">
                              {formatShopPrice(product.price)}
                            </p>

                            {/* Size selector */}
                            {product.sizes && (
                              <div className="mt-1">
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Size
                                </label>
                                <select
                                  value={size}
                                  onChange={(e) =>
                                    setSelectedSizes((prev) => ({
                                      ...prev,
                                      [product.id]: e.target.value,
                                    }))
                                  }
                                  className="block w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                  {product.sizes.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {/* Action */}
                            <div className="mt-3">
                              {success === product.id ? (
                                <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-xs font-medium text-green-700 text-center">
                                  ✓ Order placed! We&apos;ll be in touch.
                                </div>
                              ) : !hasPaymentMethod ? (
                                <p className="text-xs text-gray-400 text-center py-1">
                                  No payment method on file
                                </p>
                              ) : (
                                <button
                                  type="button"
                                  disabled={!product.inStock}
                                  onClick={() =>
                                    openConfirm(product, product.sizes ? size : undefined)
                                  }
                                  className="block w-full rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-center"
                                >
                                  {!product.inStock ? 'Out of Stock' : 'Buy Now'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabPanel>
            );
          })}
        </TabPanels>
      </TabGroup>
    </section>
    </>
  );
}
