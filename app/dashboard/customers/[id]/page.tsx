'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiShoppingBag, FiDollarSign, FiTrash2 } from 'react-icons/fi';
import api from '@/lib/api';
import { toastError, toastSuccess, confirmDialog } from '@/lib/toast';
import StatusBadge from '@/components/StatusBadge';
import type { Customer, Order } from '@/lib/types';

interface Detail {
  customer: Customer;
  orders: Order[];
  stats: { orderCount: number; totalSpent: number };
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get<Detail>(`/customers/${id}`)
      .then(setData)
      .catch((err) => toastError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    const confirmed = await confirmDialog('Delete Customer?', 'Are you sure you want to delete this customer?');
    if (!confirmed) return;
    try {
      await api.del(`/customers/${id}`);
      toastSuccess('Customer deleted successfully');
      router.push('/dashboard/customers');
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-primary dark:border-zinc-800 dark:border-t-zinc-50"></div>
      </div>
    );
  }

  if (!data) {
    return <p className="text-center text-zinc-500 dark:text-zinc-400">Customer not found.</p>;
  }

  const { customer, orders, stats } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/customers"
            className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <FiArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-lg font-semibold text-white dark:bg-white dark:text-zinc-900">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {customer.name}
                <StatusBadge status={customer.isPhoneVerified ? 'verified' : 'unverified'} />
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {customer.mobile} {customer.email && `· ${customer.email}`} · joined{' '}
                {new Date(customer.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleDelete}
          className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40"
        >
          <FiTrash2 size={16} />
          Delete Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:max-w-lg">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40">
            <FiShoppingBag size={20} />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.orderCount}</p>
          <p className="mt-1 text-xs font-medium text-zinc-500">Total Orders</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
            <FiDollarSign size={20} />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">৳{stats.totalSpent.toLocaleString()}</p>
          <p className="mt-1 text-xs font-medium text-zinc-500">Total Spent</p>
        </div>
      </div>

      {/* Order history */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <h2 className="border-b border-zinc-200 px-6 py-4 text-lg font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
          Order History
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-3 font-medium">Order</th>
                <th className="px-6 py-3 font-medium">Items</th>
                <th className="px-6 py-3 font-medium">Total</th>
                <th className="px-6 py-3 font-medium">Payment</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id} className="transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/orders/${o._id}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {o.items.reduce((s, i) => s + i.quantity, 0)}
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">৳{o.total.toLocaleString()}</td>
                    <td className="px-6 py-4"><StatusBadge status={o.paymentStatus} /></td>
                    <td className="px-6 py-4"><StatusBadge status={o.orderStatus} /></td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                      {new Date(o.createdAt).toLocaleDateString()}
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
