'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FiSearch, FiEye, FiTrash2, FiDownload } from 'react-icons/fi';
import api, { API_BASE } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { toastError, toastSuccess, confirmDialog } from '@/lib/toast';
import Pagination from '@/components/Pagination';
import StatusBadge from '@/components/StatusBadge';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import type { Customer, PaginationInfo } from '@/lib/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      const data = await api.get<{ customers: Customer[]; pagination: PaginationInfo }>(`/customers?${params}`);
      setCustomers(data.customers);
      setPagination(data.pagination);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE}/customers/export`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Could not export customers');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog('Delete Customer?', 'Are you sure you want to delete this customer?');
    if (!confirmed) return;
    try {
      await api.del(`/customers/${id}`);
      setCustomers((prev) => prev.filter((c) => c._id !== id));
      toastSuccess('Customer deleted successfully');
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Customers</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {pagination ? `${pagination.total} registered customers` : 'Storefront users'}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <FiDownload size={15} /> {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="relative max-w-md">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search name, mobile or email..."
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-50"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Mobile</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Phone Verified</th>
                <th className="px-6 py-3 font-medium">Joined</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-primary dark:border-zinc-800 dark:border-t-zinc-50"></div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white dark:bg-white dark:text-zinc-900">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{c.mobile}</td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{c.email || '—'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.isPhoneVerified ? 'verified' : 'unverified'} />
                    </td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/customers/${c._id}`}
                          className="inline-flex rounded-lg p-2 text-zinc-500 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40"
                        >
                          <FiEye size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="inline-flex rounded-lg p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                          title="Delete Customer"
                        >
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
        {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
      </div>
    </div>
  );
}
