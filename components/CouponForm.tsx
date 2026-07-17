'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiSave, FiArrowLeft, FiTag, FiGift, FiShoppingBag, FiTruck, FiRefreshCw } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';
import SearchMultiSelect, { type PickerOption } from '@/components/SearchMultiSelect';
import type { Coupon, Collection, Product, CouponDiscountType, CouponAppliesTo } from '@/lib/types';
import { DISCOUNT_TYPE_INFO } from '@/lib/types';

const inputCls =
  'w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 hover:border-zinc-300';
const labelCls = 'mb-1.5 block text-sm font-semibold text-zinc-800';
const cardCls = 'rounded-2xl border border-zinc-100 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]';

const TYPE_ICONS: Record<CouponDiscountType, typeof FiTag> = {
  amount_off_products: FiTag,
  buy_x_get_y: FiGift,
  amount_off_order: FiShoppingBag,
  free_shipping: FiTruck,
};

const toOptions = (list?: (string | { _id: string; name: string })[]): PickerOption[] =>
  (list || []).filter((x): x is { _id: string; name: string } => typeof x === 'object').map((x) => ({ _id: x._id, label: x.name }));

export default function CouponForm({ coupon }: { coupon?: Coupon }) {
  const router = useRouter();
  const isEdit = !!coupon;

  const generateCode = () => {
    const prefixes = ['DISCOUNT', 'SAVE', 'PROMO', 'SALE', 'OFFER'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 90) + 10; // 10 to 99
    setForm((prev) => ({ ...prev, code: `${prefix}${number}` }));
  };

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: coupon?.code || '',
    discountType: coupon?.discountType || ('amount_off_order' as CouponDiscountType),
    valueType: coupon?.valueType || ('percentage' as 'percentage' | 'fixed'),
    value: coupon != null ? String(coupon.value) : '',
    maxDiscount: coupon?.maxDiscount ? String(coupon.maxDiscount) : '',
    appliesTo: coupon?.appliesTo || ('all' as CouponAppliesTo),
    buyQuantity: coupon ? String(coupon.buyQuantity) : '1',
    getQuantity: coupon ? String(coupon.getQuantity) : '1',
    getDiscountType: coupon?.getDiscountType || ('free' as 'percentage' | 'free'),
    getDiscountValue: coupon ? String(coupon.getDiscountValue) : '100',
    minOrder: coupon?.minOrder ? String(coupon.minOrder) : '',
    usageLimit: coupon?.usageLimit ? String(coupon.usageLimit) : '',
    expiresAt: coupon?.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 10) : '',
    isActive: coupon?.isActive ?? true,
  });

  const [products, setProducts] = useState<PickerOption[]>(toOptions(coupon?.productIds));
  const [collections, setCollections] = useState<PickerOption[]>(toOptions(coupon?.collectionIds));
  const [useSeparateGetPool, setUseSeparateGetPool] = useState(
    (coupon?.getProductIds?.length || 0) > 0 || (coupon?.getCollectionIds?.length || 0) > 0
  );
  const [getProducts, setGetProducts] = useState<PickerOption[]>(toOptions(coupon?.getProductIds));
  const [getCollections, setGetCollections] = useState<PickerOption[]>(toOptions(coupon?.getCollectionIds));

  const searchProducts = async (q: string): Promise<PickerOption[]> => {
    const d = await api.get<{ products: Product[] }>(`/products?all=true&limit=15${q ? `&search=${encodeURIComponent(q)}` : ''}`);
    return d.products.map((p) => ({ _id: p._id, label: p.name, sublabel: `৳${p.price}` }));
  };
  const searchCollections = async (q: string): Promise<PickerOption[]> => {
    const d = await api.get<{ collections: Collection[] }>(`/collections?all=true${q ? `&search=${encodeURIComponent(q)}` : ''}`);
    return d.collections.map((c) => ({ _id: c._id, label: c.name }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      toastError('Coupon code is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        discountType: form.discountType,
        valueType: form.valueType,
        value: Number(form.value) || 0,
        maxDiscount: Number(form.maxDiscount) || 0,
        appliesTo: form.appliesTo,
        productIds: form.appliesTo === 'products' ? products.map((p) => p._id) : [],
        collectionIds: form.appliesTo === 'collections' ? collections.map((c) => c._id) : [],
        buyQuantity: Number(form.buyQuantity) || 1,
        getQuantity: Number(form.getQuantity) || 1,
        getDiscountType: form.getDiscountType,
        getDiscountValue: form.getDiscountType === 'free' ? 100 : Number(form.getDiscountValue) || 0,
        getProductIds: useSeparateGetPool ? getProducts.map((p) => p._id) : [],
        getCollectionIds: useSeparateGetPool ? getCollections.map((c) => c._id) : [],
        minOrder: Number(form.minOrder) || 0,
        usageLimit: Number(form.usageLimit) || 0,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        isActive: form.isActive,
      };
      if (isEdit) {
        await api.patch(`/coupons/${coupon!._id}`, payload);
        toastSuccess('Coupon updated');
      } else {
        await api.post('/coupons', payload);
        toastSuccess('Coupon created');
      }
      router.push('/dashboard/coupons');
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const showValueFields = form.discountType === 'amount_off_order' || form.discountType === 'amount_off_products';
  const showAppliesTo = form.discountType === 'amount_off_products' || form.discountType === 'buy_x_get_y';

  const targetPicker = (
    forCollections: boolean,
    selected: PickerOption[],
    onChange: (o: PickerOption[]) => void,
    label: string
  ) =>
    forCollections ? (
      <SearchMultiSelect label={label} placeholder="Search collections..." selected={selected} onChange={onChange} fetchOptions={searchCollections} />
    ) : (
      <SearchMultiSelect label={label} placeholder="Search products..." selected={selected} onChange={onChange} fetchOptions={searchProducts} />
    );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/coupons" className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900">
            <FiArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{isEdit ? `Edit Coupon` : 'Create Coupon'}</h1>
            {isEdit && <p className="text-sm text-zinc-500">{coupon!.code}</p>}
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:opacity-70"
        >
          <FiSave size={16} /> {saving ? 'Saving...' : 'Save Coupon'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Details */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* General Information */}
          <div className={cardCls}>
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-zinc-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100 text-xs text-zinc-500">1</span>
              General Information
            </h2>
            
            <div className="mb-6">
              <label className="mb-1.5 block text-sm font-semibold text-zinc-800">Discount Code *</label>
              <div className="flex gap-3">
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className={`${inputCls} flex-1 font-mono text-lg uppercase tracking-wider`}
                  required
                  placeholder="e.g. SUMMER25"
                />
                <button
                  type="button"
                  onClick={generateCode}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
                >
                  <FiRefreshCw size={16} />
                  Auto Generate
                </button>
              </div>
              <p className="mt-1.5 text-xs text-zinc-500">Customers will enter this code at checkout.</p>
            </div>

            <div>
              <label className={labelCls}>Discount Type</label>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {DISCOUNT_TYPE_INFO.map((t) => {
                  const Icon = TYPE_ICONS[t.key];
                  const active = form.discountType === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setForm({ ...form, discountType: t.key })}
                      className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                        active ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-zinc-100 bg-white hover:border-zinc-200'
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-primary text-white shadow-sm' : 'bg-zinc-100 text-zinc-500'}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className={`font-bold ${active ? 'text-primary' : 'text-zinc-900'}`}>{t.label}</p>
                        <p className="mt-1 text-xs text-zinc-500">{t.hint}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Configuration (Dynamic based on Type) */}
          <div className={cardCls}>
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-zinc-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100 text-xs text-zinc-500">2</span>
              Configuration
            </h2>

            <div className="space-y-6">
              {showValueFields && (
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-5">
                  <h3 className="mb-4 text-sm font-bold text-zinc-800">Discount Value</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>Value Type</label>
                      <select value={form.valueType} onChange={(e) => setForm({ ...form, valueType: e.target.value as 'percentage' | 'fixed' })} className={inputCls}>
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (৳)</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>{form.valueType === 'percentage' ? 'Percent Off *' : 'Amount Off (৳) *'}</label>
                      <input type="number" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className={inputCls} required />
                    </div>
                    {form.valueType === 'percentage' && (
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Maximum Discount Amount (৳)</label>
                        <input type="number" min="0" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} className={inputCls} placeholder="Leave 0 for no maximum cap" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {showAppliesTo && (
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-5">
                  <h3 className="mb-4 text-sm font-bold text-zinc-800">
                    {form.discountType === 'buy_x_get_y' ? 'Customer Buys (Conditions)' : 'Applies To'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Eligible Products</label>
                      <select value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value as CouponAppliesTo })} className={inputCls}>
                        <option value="all">All products in store</option>
                        <option value="products">Specific products</option>
                        <option value="collections">Specific collections</option>
                      </select>
                    </div>
                    
                    {form.appliesTo === 'products' && (
                      <div className="rounded-lg bg-white p-4 shadow-sm border border-zinc-100">
                        {targetPicker(false, products, setProducts, 'Select Eligible Products')}
                      </div>
                    )}
                    {form.appliesTo === 'collections' && (
                      <div className="rounded-lg bg-white p-4 shadow-sm border border-zinc-100">
                        {targetPicker(true, collections, setCollections, 'Select Eligible Collections')}
                      </div>
                    )}

                    {form.discountType === 'buy_x_get_y' && (
                      <div className="pt-2">
                        <label className={labelCls}>Quantity they must buy</label>
                        <input type="number" min="1" value={form.buyQuantity} onChange={(e) => setForm({ ...form, buyQuantity: e.target.value })} className={inputCls} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {form.discountType === 'buy_x_get_y' && (
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-5">
                  <h3 className="mb-4 text-sm font-bold text-zinc-800">Customer Gets (Rewards)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Quantity they get</label>
                      <input type="number" min="1" value={form.getQuantity} onChange={(e) => setForm({ ...form, getQuantity: e.target.value })} className={inputCls} />
                    </div>
                    
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition hover:bg-zinc-50">
                      <input type="checkbox" checked={useSeparateGetPool} onChange={(e) => setUseSeparateGetPool(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
                      <div>
                        <p className="text-sm font-medium text-zinc-800">Use different items for the reward</p>
                        <p className="text-xs text-zinc-500">By default, the free/discounted item is taken from the same pool they bought from.</p>
                      </div>
                    </label>

                    {useSeparateGetPool && (
                      <div className="grid gap-4 rounded-lg bg-white p-4 shadow-sm border border-zinc-100 sm:grid-cols-2">
                        {targetPicker(false, getProducts, setGetProducts, 'Reward Products')}
                        {targetPicker(true, getCollections, setGetCollections, 'Reward Collections')}
                      </div>
                    )}

                    <div className="grid gap-4 pt-2 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}>Discount Value</label>
                        <select
                          value={form.getDiscountType}
                          onChange={(e) => setForm({ ...form, getDiscountType: e.target.value as 'percentage' | 'free' })}
                          className={inputCls}
                        >
                          <option value="free">Free (100% off)</option>
                          <option value="percentage">Percentage Discount</option>
                        </select>
                      </div>
                      {form.getDiscountType === 'percentage' && (
                        <div>
                          <label className={labelCls}>Percentage Off (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={form.getDiscountValue}
                            onChange={(e) => setForm({ ...form, getDiscountValue: e.target.value })}
                            className={inputCls}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {form.discountType === 'free_shipping' && (
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-5 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FiTruck size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-800">Free Shipping</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    This coupon will automatically remove shipping fees at checkout. You can set a minimum order requirement in the sidebar.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Settings & Limits */}
        <div className="space-y-6">
          <div className={cardCls}>
            <h2 className="mb-4 text-sm font-bold text-zinc-900 uppercase tracking-wider">Status</h2>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 transition hover:bg-zinc-100/50">
              <div>
                <span className="block text-sm font-semibold text-zinc-900">Active</span>
                <span className="text-xs text-zinc-500">Enable or disable this coupon</span>
              </div>
              <div className={`relative h-6 w-11 rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-zinc-300'}`}>
                <span className={`absolute top-1 left-1 h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                <input type="checkbox" className="hidden" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              </div>
            </label>
          </div>

          <div className={cardCls}>
            <h2 className="mb-4 text-sm font-bold text-zinc-900 uppercase tracking-wider">Requirements</h2>
            <div>
              <label className={labelCls}>Minimum Order Value (৳)</label>
              <input type="number" min="0" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} className={inputCls} placeholder="0 = No minimum" />
              <p className="mt-1.5 text-xs text-zinc-500">Cart subtotal must exceed this amount.</p>
            </div>
          </div>

          <div className={cardCls}>
            <h2 className="mb-4 text-sm font-bold text-zinc-900 uppercase tracking-wider">Usage Limits</h2>
            <div>
              <label className={labelCls}>Total Usages Allowed</label>
              <input type="number" min="0" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className={inputCls} placeholder="0 = Unlimited" />
              <p className="mt-1.5 text-xs text-zinc-500">Maximum number of times this coupon can be used in total.</p>
              {isEdit && (
                <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                  <span className="font-semibold">Current Usage:</span> {coupon!.usedCount} times
                </div>
              )}
            </div>
          </div>

          <div className={cardCls}>
            <h2 className="mb-4 text-sm font-bold text-zinc-900 uppercase tracking-wider">Schedule</h2>
            <div>
              <label className={labelCls}>Expiration Date</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={inputCls} />
              <p className="mt-1.5 text-xs text-zinc-500">Leave empty if the coupon never expires.</p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
