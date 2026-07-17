'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError, confirmDialog } from '@/lib/toast';
import StatusBadge from '@/components/StatusBadge';
import type { Coupon } from '@/lib/types';
import { DISCOUNT_TYPE_INFO } from '@/lib/types';

const typeLabel = (c: Coupon) => DISCOUNT_TYPE_INFO.find((t) => t.key === c.discountType)?.label || c.discountType;

const discountSummary = (c: Coupon) => {
  if (c.discountType === 'free_shipping') return 'Free shipping';
  if (c.discountType === 'buy_x_get_y') {
    return `Buy ${c.buyQuantity} get ${c.getQuantity} ${c.getDiscountType === 'free' ? 'free' : `${c.getDiscountValue}% off`}`;
  }
  return c.valueType === 'percentage' ? `${c.value}%` : `৳${c.value.toLocaleString()}`;
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCoupons = useCallback(async () => {
    try {
      const data = await api.get<{ coupons: Coupon[] }>('/coupons');
      setCoupons(data.coupons);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleDelete = async (c: Coupon) => {
    if (!(await confirmDialog(`Delete coupon "${c.code}"?`))) return;
    try {
      await api.del(`/coupons/${c._id}`);
      toastSuccess('Coupon deleted');
      fetchCoupons();
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  const isExpired = (c: Coupon) => c.expiresAt && new Date(c.expiresAt) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Coupons</h1>
          <p className="mt-1 text-sm text-zinc-500">{coupons.length} discount codes</p>
        </div>
        <Link
          href="/dashboard/coupons/new"
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98]"
        >
          <FiPlus size={16} /> Add Coupon
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-6 py-3 font-medium">Code</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Discount</th>
                <th className="px-6 py-3 font-medium">Min Order</th>
                <th className="px-6 py-3 font-medium">Usage</th>
                <th className="px-6 py-3 font-medium">Expires</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-zinc-500">
                    No coupons yet. Create your first one.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c._id} className="transition hover:bg-zinc-50">
                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-zinc-100 px-2.5 py-1 font-mono text-sm font-semibold text-zinc-900">
                        {c.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-zinc-600">{typeLabel(c)}</td>
                    <td className="px-6 py-4 font-medium text-zinc-900">
                      {discountSummary(c)}
                      {c.discountType !== 'free_shipping' && c.discountType !== 'buy_x_get_y' && c.valueType === 'percentage' && c.maxDiscount > 0 && (
                        <p className="text-xs font-normal text-zinc-500">max ৳{c.maxDiscount.toLocaleString()}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      {c.minOrder > 0 ? `৳${c.minOrder.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      {c.usedCount}{c.usageLimit > 0 ? ` / ${c.usageLimit}` : ''}
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={isExpired(c) ? 'cancelled' : c.isActive ? 'active' : 'inactive'}
                        label={isExpired(c) ? 'expired' : c.isActive ? 'active' : 'inactive'}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/coupons/edit/${c._id}`} className="rounded-lg p-2 text-zinc-500 transition hover:bg-blue-50 hover:text-blue-600">
                          <FiEdit2 size={16} />
                        </Link>
                        <button onClick={() => handleDelete(c)} className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-600">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
