'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiSearch, FiEye, FiPlus } from 'react-icons/fi';
import api from '@/lib/api';
import { toastError } from '@/lib/toast';
import Pagination from '@/components/Pagination';
import StatusBadge from '@/components/StatusBadge';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import type { Order, PaginationInfo } from '@/lib/types';

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput);
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (status) params.set('status', status);
      if (paymentStatus) params.set('paymentStatus', paymentStatus);
      if (search) params.set('search', search);
      const data = await api.get<{ orders: Order[]; pagination: PaginationInfo }>(`/admin-orders?${params}`);
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, status, paymentStatus, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const inputCls =
    'rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-50';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Orders</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {pagination ? `${pagination.total} orders` : 'Manage customer orders'}
          </p>
        </div>
        <Link
          href="/dashboard/orders/new"
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98]"
        >
          <FiPlus size={16} /> Create Order
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by order number, customer name, mobile or email..."
            className={`${inputCls} w-full pl-10`}
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className={inputCls}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
        <select
          value={paymentStatus}
          onChange={(e) => {
            setPage(1);
            setPaymentStatus(e.target.value);
          }}
          className={inputCls}
        >
          <option value="">All payments</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Order</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-center">Items</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Total</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Payment Type</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Payment Status</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Order Status</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Date</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100/80 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
                      <p className="text-sm font-medium text-zinc-500">Loading orders...</p>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                        <FiSearch size={24} />
                      </div>
                      <p className="text-base font-medium text-zinc-900 mt-2">No orders found</p>
                      <p className="text-sm text-zinc-500">Try adjusting your filters or search term.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr 
                    key={o._id} 
                    onClick={() => router.push(`/dashboard/orders/${o._id}`)}
                    className="group cursor-pointer transition-colors duration-200 hover:bg-zinc-50/80"
                  >
                    <td className="px-6 py-4">
                      <span className="font-semibold text-zinc-900 group-hover:text-primary transition-colors">
                        {o.orderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-900">{o.user?.name || '—'}</span>
                        <span className="text-xs text-zinc-500 mt-0.5">{o.user?.mobile}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-zinc-100 px-2 text-xs font-medium text-zinc-600">
                        {o.items.reduce((s, i) => s + i.quantity, 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-zinc-900">
                        ৳{o.total.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-zinc-700">
                        {o.paymentMethod === 'cod' ? 'COD' : o.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={o.paymentStatus} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={o.orderStatus} />
                    </td>
                    <td className="px-6 py-4 text-zinc-500 text-sm whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/orders/${o._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-400 transition-all hover:bg-white hover:text-primary hover:shadow-sm border border-transparent hover:border-zinc-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="View Details"
                      >
                        <FiEye size={18} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <div className="border-t border-zinc-100 bg-zinc-50/50 p-4">
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
