'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FiPlus,
  FiSearch,
  FiPackage,
  FiDollarSign,
  FiTrendingUp,
  FiArchive,
  FiEdit2,
  FiClock,
} from 'react-icons/fi';
import api from '@/lib/api';
import { toastError } from '@/lib/toast';
import StatusBadge from '@/components/StatusBadge';
import type { InventoryItem, InventoryTotals, InventoryLog } from '@/lib/types';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [totals, setTotals] = useState<InventoryTotals | null>(null);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [inv, lg] = await Promise.all([
        api.get<{ items: InventoryItem[]; totals: InventoryTotals }>('/inventory'),
        api.get<{ logs: InventoryLog[] }>('/inventory/logs?limit=15'),
      ]);
      setItems(inv.items);
      setTotals(inv.totals);
      setLogs(lg.logs);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const visible = items.filter(
    (i) =>
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  const CARDS = totals
    ? [
        { label: 'Units in Stock', value: totals.units.toLocaleString(), icon: FiPackage, color: 'text-primary bg-primary/10' },
        { label: 'Stock Value (buying cost)', value: `৳${totals.stockValue.toLocaleString()}`, icon: FiArchive, color: 'text-accent bg-accent/10' },
        { label: 'Retail Value (sale price)', value: `৳${totals.retailValue.toLocaleString()}`, icon: FiDollarSign, color: 'text-indigo-600 bg-indigo-50' },
        { label: 'Potential Profit', value: `৳${totals.potentialProfit.toLocaleString()}`, icon: FiTrendingUp, color: 'text-emerald-600 bg-emerald-50' },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Inventory</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Buying costs, stock levels, margins and stock value across the whole catalog.
          </p>
        </div>
        <Link
          href="/dashboard/inventory/stock-entry"
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98]"
        >
          <FiPlus size={16} /> Stock In / Adjust
        </Link>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((c) => (
          <div key={c.label} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${c.color}`}>
              <c.icon size={20} />
            </div>
            <p className="text-2xl font-bold tracking-tight text-zinc-900">{c.value}</p>
            <p className="mt-1 text-xs font-medium text-zinc-500">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product or SKU..."
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">Stock</th>
                <th className="px-6 py-3 font-medium">Buying Cost</th>
                <th className="px-6 py-3 font-medium">Sale Price</th>
                <th className="px-6 py-3 font-medium">Profit / Unit</th>
                <th className="px-6 py-3 font-medium">Margin</th>
                <th className="px-6 py-3 font-medium">Stock Value</th>
                <th className="px-6 py-3 text-right font-medium">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-zinc-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                visible.map((p) => (
                  <tr key={p._id} className="transition hover:bg-zinc-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.thumbnail} alt={p.name} className="h-10 w-10 rounded-lg border border-zinc-200 object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400">
                            <FiPackage size={16} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-zinc-900">{p.name}</p>
                          <p className="text-xs text-zinc-500">{p.sku || p.slug} · {p.sold} sold</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {p.stock === null ? (
                        <span className="font-medium text-zinc-500">Unlimited</span>
                      ) : (
                        <span className={p.stock === 0 ? 'font-bold text-red-600' : p.stock <= 5 ? 'font-semibold text-amber-600' : 'text-zinc-700'}>
                          {p.stock}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-700">৳{p.costPrice.toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-zinc-900">৳{p.price.toLocaleString()}</td>
                    <td className={`px-6 py-4 font-medium ${p.profitPerUnit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ৳{p.profitPerUnit.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          p.marginPercent >= 30
                            ? 'bg-emerald-100 text-emerald-700'
                            : p.marginPercent >= 10
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {p.marginPercent}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-700">৳{p.stockValue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/products/edit/${p.slug}`}
                        className="inline-flex rounded-lg p-2 text-zinc-500 transition hover:bg-blue-50 hover:text-primary"
                      >
                        <FiEdit2 size={15} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent movements */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <h2 className="flex items-center gap-2 border-b border-zinc-200 px-6 py-4 text-lg font-semibold text-zinc-900">
          <FiClock size={18} /> Recent Stock Movements
        </h2>
        {logs.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-zinc-500">No stock movements recorded yet.</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {logs.map((l) => (
              <div key={l._id} className="flex items-center gap-4 px-6 py-3">
                <StatusBadge
                  status={l.type === 'stock_in' ? 'active' : 'pending'}
                  label={l.type === 'stock_in' ? 'Stock In' : 'Adjustment'}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">{l.product?.name || '—'}</p>
                  <p className="text-xs text-zinc-500">
                    {l.note || 'No note'} · by {l.admin?.fullName || '—'} · {new Date(l.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${l.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {l.quantity > 0 ? '+' : ''}
                    {l.quantity}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {l.unitCost != null ? `@ ৳${l.unitCost}` : ''} → stock {l.stockAfter}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
