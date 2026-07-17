'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FiSearch, FiShoppingCart, FiPackage, FiChevronDown, FiChevronUp, FiDollarSign } from 'react-icons/fi';
import api from '@/lib/api';
import { toastError } from '@/lib/toast';
import Pagination from '@/components/Pagination';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import type { AdminCart, PaginationInfo } from '@/lib/types';

interface CartTotals {
  carts: number;
  items: number;
  value: number;
}

export default function CartsPage() {
  const [carts, setCarts] = useState<AdminCart[]>([]);
  const [totals, setTotals] = useState<CartTotals | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchCarts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      const data = await api.get<{ carts: AdminCart[]; totals: CartTotals; pagination: PaginationInfo }>(
        `/admin-carts?${params}`
      );
      setCarts(data.carts);
      setTotals(data.totals);
      setPagination(data.pagination);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCarts();
  }, [fetchCarts]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const CARDS = totals
    ? [
        { label: 'Active Carts', value: totals.carts.toLocaleString(), icon: FiShoppingCart, color: 'text-primary bg-primary/10' },
        { label: 'Products in Carts', value: totals.items.toLocaleString(), icon: FiPackage, color: 'text-accent bg-accent/10' },
        { label: 'Potential Revenue', value: `৳${totals.value.toLocaleString()}`, icon: FiDollarSign, color: 'text-emerald-600 bg-emerald-50' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Customer Carts</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Live view of what customers have added to their carts but not ordered yet.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
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
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by customer name or mobile..."
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>

      {/* Cart list */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
          </div>
        ) : carts.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-zinc-400">
            <FiShoppingCart size={36} />
            <p className="text-sm font-medium">No active carts right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {carts.map((cart) => {
              const isOpen = expanded === cart._id;
              return (
                <div key={cart._id}>
                  {/* Row */}
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : cart._id)}
                    className="flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-zinc-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                      {cart.user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-900">{cart.user?.name || 'Unknown user'}</p>
                      <p className="text-xs text-zinc-500">{cart.user?.mobile}</p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-semibold text-zinc-900">{cart.itemCount} items</p>
                      <p className="text-xs text-zinc-500">৳{cart.value.toLocaleString()}</p>
                    </div>
                    <div className="hidden text-right md:block">
                      <p className="text-xs text-zinc-400">Last updated</p>
                      <p className="text-xs font-medium text-zinc-600">{new Date(cart.updatedAt).toLocaleString()}</p>
                    </div>
                    <span className="text-zinc-400">{isOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}</span>
                  </button>

                  {/* Expanded items */}
                  {isOpen && (
                    <div className="border-t border-dashed border-zinc-200 bg-zinc-50/60 px-6 py-4">
                      <div className="space-y-3">
                        {cart.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            {item.product.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.product.thumbnail} alt={item.product.name} className="h-11 w-11 rounded-lg border border-zinc-200 object-cover" />
                            ) : (
                              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400">
                                <FiPackage size={16} />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-zinc-900">{item.product.name}</p>
                              <p className="text-xs text-zinc-500">
                                ৳{item.unitPrice.toLocaleString()} × {item.quantity}
                                {item.variant && Object.keys(item.variant).length > 0 && (
                                  <span className="ml-2 text-zinc-400">
                                    {Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                                  </span>
                                )}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-zinc-900">
                              ৳{(item.unitPrice * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3">
                        <Link
                          href={`/dashboard/customers/${cart.user?._id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          View customer profile →
                        </Link>
                        <p className="text-sm font-bold text-zinc-900">Cart total: ৳{cart.value.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
      </div>
    </div>
  );
}
