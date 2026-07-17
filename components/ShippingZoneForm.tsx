'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';
import type { ShippingZone } from '@/lib/types';

const inputCls =
  'w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';
const labelCls = 'mb-1.5 block text-sm font-medium text-zinc-700';
const cardCls = 'rounded-xl border border-zinc-200 bg-white p-6 shadow-sm';

export default function ShippingZoneForm({ zone }: { zone?: ShippingZone }) {
  const router = useRouter();
  const isEdit = !!zone;

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: zone?.name || '',
    city: zone?.city || '',
    shippingCost: zone?.shippingCost != null ? String(zone.shippingCost) : '',
    freeShippingThreshold: zone?.freeShippingThreshold ? String(zone.freeShippingThreshold) : '',
    isActive: zone?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim() || form.shippingCost === '') {
      toastError('Zone name, area/city and shipping cost are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        city: form.city.trim(),
        shippingCost: Number(form.shippingCost),
        freeShippingThreshold: Number(form.freeShippingThreshold) || 0,
        isActive: form.isActive,
      };
      if (isEdit) {
        await api.patch(`/shipping-zones/${zone!._id}`, payload);
        toastSuccess('Shipping zone updated');
      } else {
        await api.post('/shipping-zones', payload);
        toastSuccess('Shipping zone created');
      }
      router.push('/dashboard/shipping');
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
          <Link href="/dashboard/shipping" className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-100">
            <FiArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {isEdit ? 'Edit Shipping Zone' : 'Add Shipping Zone'}
          </h1>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-70"
        >
          <FiSave size={16} /> {saving ? 'Saving...' : isEdit ? 'Update Zone' : 'Create Zone'}
        </button>
      </div>

      <div className={cardCls}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Zone Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
                required
                placeholder="e.g. Inside Dhaka"
              />
              <p className="mt-1 text-xs text-zinc-400">A friendly label for this rule — shown only in the admin panel.</p>
            </div>
            <div>
              <label className={labelCls}>Area / City *</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputCls}
                required
                placeholder="e.g. Dhaka"
              />
              <p className="mt-1 text-xs text-zinc-400">
                Must match the <strong>city</strong> the customer types at checkout (not case-sensitive).
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Shipping Cost (৳) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.shippingCost}
                onChange={(e) => setForm({ ...form, shippingCost: e.target.value })}
                className={inputCls}
                required
                placeholder="60"
              />
            </div>
            <div>
              <label className={labelCls}>Free Shipping Above (৳)</label>
              <input
                type="number"
                min="0"
                value={form.freeShippingThreshold}
                onChange={(e) => setForm({ ...form, freeShippingThreshold: e.target.value })}
                className={inputCls}
                placeholder="0 = disabled for this area"
              />
              <p className="mt-1 text-xs text-zinc-400">
                Orders from this area with a subtotal at/above this amount ship free.
              </p>
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 px-4 py-3">
            <span className="text-sm font-medium text-zinc-700">Active</span>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-5 w-5 accent-primary"
            />
          </label>
        </div>
      </div>
    </form>
  );
}
