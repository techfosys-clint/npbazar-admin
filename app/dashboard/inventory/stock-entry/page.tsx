'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiSave, FiArrowLeft, FiTruck, FiTool } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';
import type { InventoryItem } from '@/lib/types';

const inputCls =
  'w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';
const labelCls = 'mb-1.5 block text-sm font-medium text-zinc-700';
const cardCls = 'rounded-xl border border-zinc-200 bg-white p-6 shadow-sm';

export default function StockEntryPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState<'stock_in' | 'adjustment'>('stock_in');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    api.get<{ items: InventoryItem[] }>('/inventory').then((d) => setItems(d.items)).catch(() => {});
  }, []);

  const selected = items.find((i) => i._id === productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity) {
      toastError('Please select a product and enter a quantity');
      return;
    }
    if (type === 'stock_in' && (unitCost === '' || Number(unitCost) < 0)) {
      toastError('Unit buying cost is required for a purchase');
      return;
    }
    setSaving(true);
    try {
      if (type === 'stock_in') {
        const res = await api.post<{ message: string }>('/inventory/stock-in', {
          productId,
          quantity: Number(quantity),
          unitCost: Number(unitCost),
          note,
        });
        toastSuccess(res.message);
      } else {
        const res = await api.post<{ message: string }>('/inventory/adjust', {
          productId,
          quantity: Number(quantity),
          note,
        });
        toastSuccess(res.message);
      }
      router.push('/dashboard/inventory');
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
          <Link href="/dashboard/inventory" className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-100">
            <FiArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Stock Entry</h1>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-70"
        >
          <FiSave size={16} /> {saving ? 'Saving...' : 'Save Entry'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={cardCls}>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Entry Type</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('stock_in')}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition ${
                type === 'stock_in' ? 'border-primary bg-primary/5 text-primary' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
              }`}
            >
              <FiTruck size={24} />
              <span className="text-sm font-semibold">Stock In (Purchase)</span>
              <span className="text-center text-xs text-zinc-400">New stock bought from a supplier</span>
            </button>
            <button
              type="button"
              onClick={() => setType('adjustment')}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition ${
                type === 'adjustment' ? 'border-accent bg-accent/5 text-accent' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
              }`}
            >
              <FiTool size={24} />
              <span className="text-sm font-semibold">Adjustment</span>
              <span className="text-center text-xs text-zinc-400">Damage, count fix, return (+ or −)</span>
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className={labelCls}>Product *</label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputCls} required>
                <option value="">Select product</option>
                {items.map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.name} {i.sku ? `(${i.sku})` : ''} — stock {i.stock === null ? 'Unlimited' : i.stock}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>{type === 'stock_in' ? 'Quantity Purchased *' : 'Quantity (+/−) *'}</label>
                <input
                  type="number"
                  step="1"
                  min={type === 'stock_in' ? 1 : undefined}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={inputCls}
                  required
                  placeholder={type === 'stock_in' ? 'e.g. 50' : 'e.g. -3 (damaged) or 5 (returned)'}
                />
              </div>
              {type === 'stock_in' && (
                <div>
                  <label className={labelCls}>Buying Cost per Unit (৳) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    className={inputCls}
                    required
                    placeholder="e.g. 450"
                  />
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>Note</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder="e.g. Supplier: Rahim Traders, Invoice #123" />
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className={cardCls}>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Preview</h2>
          {!selected ? (
            <p className="text-sm text-zinc-400">Select a product to see how this entry changes its stock and cost.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3">
                {selected.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.thumbnail} alt="" className="h-12 w-12 rounded-lg object-cover" />
                )}
                <div>
                  <p className="font-semibold text-zinc-900">{selected.name}</p>
                  <p className="text-xs text-zinc-500">Current stock: {selected.stock === null ? 'Unlimited' : selected.stock} · avg cost ৳{selected.costPrice} · sells at ৳{selected.price}</p>
                  {selected.stock === null && (
                    <p className="mt-0.5 text-xs text-amber-600">This entry will start tracking stock from 0.</p>
                  )}
                </div>
              </div>

              {quantity && (
                <div className="space-y-2 rounded-xl border border-dashed border-zinc-200 p-4">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Stock after entry</span>
                    <span className="font-bold text-zinc-900">
                      {(selected.stock ?? 0) + Number(quantity || 0)}
                    </span>
                  </div>
                  {type === 'stock_in' && unitCost !== '' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Purchase total</span>
                        <span className="font-medium text-zinc-900">
                          ৳{(Number(quantity) * Number(unitCost)).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">New average cost</span>
                        <span className="font-medium text-zinc-900">
                          ৳
                          {(
                            Math.round(
                              (((selected.stock ?? 0) * selected.costPrice + Number(quantity) * Number(unitCost)) /
                                ((selected.stock ?? 0) + Number(quantity))) * 100
                            ) / 100 || 0
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Profit per unit (at current sale price)</span>
                        <span className="font-medium text-emerald-600">
                          ৳{(selected.price - Number(unitCost)).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
