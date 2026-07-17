'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiSave, FiArrowLeft, FiSearch, FiX, FiPackage } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';
import type { Product, ShippingZone, StoreSettings } from '@/lib/types';

const inputCls =
  'w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';
const labelCls = 'mb-1.5 block text-sm font-medium text-zinc-700';
const cardCls = 'rounded-xl border border-zinc-200 bg-white p-6 shadow-sm';

interface Line {
  product: Product;
  quantity: string;
  price: string; // editable unit price
  variant: Record<string, string>;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Product search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [lines, setLines] = useState<Line[]>([]);

  // Customer / shipping
  const [customer, setCustomer] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    area: '',
    city: '',
    postalCode: '',
  });
  const [customerEmail, setCustomerEmail] = useState('');

  // Charges
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [shippingCost, setShippingCost] = useState('');
  const [shippingTouched, setShippingTouched] = useState(false);
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [orderStatus, setOrderStatus] = useState('pending');
  const [note, setNote] = useState('');

  useEffect(() => {
    api.get<{ zones: ShippingZone[] }>('/shipping-zones').then((d) => setZones(d.zones)).catch(() => {});
    api.get<{ settings: StoreSettings }>('/settings').then((d) => setSettings(d.settings)).catch(() => {});
  }, []);

  // Debounced product search
  const handleQuery = (q: string) => {
    setQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const d = await api.get<{ products: Product[] }>(`/products?all=true&limit=8&search=${encodeURIComponent(q)}`);
        setResults(d.products);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const addProduct = (p: Product) => {
    if (lines.some((l) => l.product._id === p._id)) {
      toastError('Product already added — change its quantity instead');
      return;
    }
    setLines([...lines, { product: p, quantity: '1', price: String(p.price), variant: {} }]);
    setQuery('');
    setResults([]);
  };

  const updateLine = (i: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const subtotal = lines.reduce((s, l) => s + (Number(l.price) || 0) * (Number(l.quantity) || 0), 0);

  // Auto-suggest shipping from zone/city unless the admin typed a manual value.
  const autoShipping = (() => {
    const zone = zones.find((z) => z.isActive && z.city.toLowerCase() === customer.city.trim().toLowerCase());
    if (zone) {
      if (zone.freeShippingThreshold > 0 && subtotal >= zone.freeShippingThreshold) return 0;
      return zone.shippingCost;
    }
    if (!settings) return 0;
    if (settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold) return 0;
    return settings.shippingCost || 0;
  })();

  const effectiveShipping = shippingTouched && shippingCost !== '' ? Number(shippingCost) : autoShipping;
  const discountAmt = Math.min(Number(discount) || 0, subtotal);
  const total = Math.max(0, subtotal - discountAmt) + effectiveShipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      toastError('Add at least one product');
      return;
    }
    if (!customer.fullName.trim() || !customer.phone.trim()) {
      toastError('Customer name and phone are required');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post<{ order: { _id: string; orderNumber: string } }>('/admin-orders', {
        items: lines.map((l) => ({
          productId: l.product._id,
          quantity: Number(l.quantity) || 1,
          price: Number(l.price),
          variant: l.variant,
        })),
        shippingAddress: customer,
        customerEmail,
        shippingCost: effectiveShipping,
        discount: discountAmt,
        paymentMethod,
        paymentStatus,
        orderStatus,
        note,
      });
      toastSuccess(`Order ${res.order.orderNumber} created`);
      router.push(`/dashboard/orders/${res.order._id}`);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/orders" className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-100">
            <FiArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Create Order</h1>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-70"
        >
          <FiSave size={16} /> {saving ? 'Creating...' : `Create Order (৳${total.toLocaleString()})`}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: products */}
        <div className="space-y-6 lg:col-span-2">
          <div className={cardCls}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Products</h2>

            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                value={query}
                onChange={(e) => handleQuery(e.target.value)}
                placeholder="Search a product to add..."
                className={`${inputCls} pl-10`}
              />
              {(results.length > 0 || searching) && query && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
                  {searching ? (
                    <p className="px-4 py-3 text-sm text-zinc-400">Searching...</p>
                  ) : (
                    results.map((p) => (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => addProduct(p)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-zinc-50"
                      >
                        {p.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.thumbnail} alt="" className="h-9 w-9 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400">
                            <FiPackage size={14} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-900">{p.name}</p>
                          <p className="text-xs text-zinc-500">৳{p.price.toLocaleString()} · stock {p.stock === null ? 'Unlimited' : p.stock}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Lines */}
            <div className="mt-4 space-y-3">
              {lines.length === 0 && (
                <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-400">
                  No products added yet — search above.
                </p>
              )}
              {lines.map((l, i) => (
                <div key={l.product._id} className="rounded-xl border border-zinc-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {l.product.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.product.thumbnail} alt="" className="h-11 w-11 rounded-lg border border-zinc-200 object-cover" />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400">
                          <FiPackage size={16} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900">{l.product.name}</p>
                        <p className="text-xs text-zinc-500">stock {l.product.stock === null ? 'Unlimited' : l.product.stock} · default ৳{l.product.price.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase text-zinc-400">Qty</label>
                        <input
                          type="number"
                          min="1"
                          max={l.product.stock ?? undefined}
                          value={l.quantity}
                          onChange={(e) => updateLine(i, { quantity: e.target.value })}
                          className={`${inputCls} w-20`}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase text-zinc-400">Unit Price</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={l.price}
                          onChange={(e) => updateLine(i, { price: e.target.value })}
                          className={`${inputCls} w-28`}
                        />
                      </div>
                      <div className="pt-5 text-right">
                        <p className="w-24 text-sm font-bold text-zinc-900">
                          ৳{((Number(l.price) || 0) * (Number(l.quantity) || 0)).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLines(lines.filter((_, idx) => idx !== i))}
                        className="mt-5 rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  </div>
                  {(l.product.variants || []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3 border-t border-dashed border-zinc-100 pt-3">
                      {l.product.variants!.map((v) => (
                        <div key={v.name}>
                          <label className="mb-1 block text-[10px] font-semibold uppercase text-zinc-400">{v.name}</label>
                          <select
                            value={l.variant[v.name] || ''}
                            onChange={(e) =>
                              updateLine(i, { variant: { ...l.variant, [v.name]: e.target.value } })
                            }
                            className={`${inputCls} w-36`}
                          >
                            <option value="">—</option>
                            {v.options.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.value}
                                {o.price ? ` (৳${o.price})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Customer */}
          <div className={cardCls}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Customer & Delivery</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Customer Name *</label>
                <input value={customer.fullName} onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })} className={inputCls} required placeholder="Karim Uddin" />
              </div>
              <div>
                <label className={labelCls}>Phone *</label>
                <input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className={inputCls} required placeholder="01712345678" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Email (optional)</label>
                <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className={inputCls} placeholder="For sending the invoice" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Address</label>
                <input value={customer.addressLine} onChange={(e) => setCustomer({ ...customer, addressLine: e.target.value })} className={inputCls} placeholder="House 12, Road 5" />
              </div>
              <div>
                <label className={labelCls}>Area</label>
                <input value={customer.area} onChange={(e) => setCustomer({ ...customer, area: e.target.value })} className={inputCls} placeholder="Dhanmondi" />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input value={customer.city} onChange={(e) => setCustomer({ ...customer, city: e.target.value })} className={inputCls} placeholder="Dhaka" />
                <p className="mt-1 text-xs text-zinc-400">Shipping cost auto-fills from the matching shipping zone.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: totals */}
        <div className="space-y-6">
          <div className={cardCls}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Charges</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Shipping Cost (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={shippingTouched ? shippingCost : String(autoShipping)}
                  onChange={(e) => {
                    setShippingTouched(true);
                    setShippingCost(e.target.value);
                  }}
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-zinc-400">Auto: ৳{autoShipping.toLocaleString()} — edit to override.</p>
              </div>
              <div>
                <label className={labelCls}>Discount (৳)</label>
                <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} className={inputCls} placeholder="0" />
              </div>
              <div>
                <label className={labelCls}>Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as 'cod' | 'online')} className={inputCls}>
                  <option value="cod">Cash on Delivery</option>
                  <option value="online">Online / Paid</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Payment Status</label>
                  <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={inputCls}>
                    {['pending', 'paid'].map((s) => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Order Status</label>
                  <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} className={inputCls}>
                    {['pending', 'processing', 'shipped', 'delivered'].map((s) => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Note</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder="e.g. Phone order" />
              </div>
            </div>
          </div>

          <div className={`${cardCls} sticky top-6`}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Items ({lines.reduce((s, l) => s + (Number(l.quantity) || 0), 0)})</span>
                <span>৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Shipping</span>
                <span>৳{effectiveShipping.toLocaleString()}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>−৳{discountAmt.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-bold text-zinc-900">
                <span>Total</span>
                <span>৳{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
