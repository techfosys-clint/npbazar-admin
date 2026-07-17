'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit2, FiTrash2, FiAward } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError, confirmDialog } from '@/lib/toast';
import StatusBadge from '@/components/StatusBadge';
import type { Brand } from '@/lib/types';

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBrands = useCallback(async () => {
    try {
      const data = await api.get<{ brands: Brand[] }>('/brands?all=true');
      setBrands(data.brands);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleDelete = async (b: Brand) => {
    if (!(await confirmDialog(`Delete "${b.name}"?`))) return;
    try {
      await api.del(`/brands/${b._id}`);
      toastSuccess('Brand deleted');
      fetchBrands();
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Brands</h1>
          <p className="mt-1 text-sm text-zinc-500">{brands.length} brands</p>
        </div>
        <Link
          href="/dashboard/brands/new"
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98]"
        >
          <FiPlus size={16} /> Add Brand
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-6 py-3 font-medium">Brand</th>
                <th className="px-6 py-3 font-medium">Slug</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">Created</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
                  </td>
                </tr>
              ) : brands.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No brands yet. Create your first one.
                  </td>
                </tr>
              ) : (
                brands.map((b) => (
                  <tr key={b._id} className="transition hover:bg-zinc-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {b.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={b.logo} alt={b.name} className="h-10 w-10 rounded-lg border border-zinc-200 object-contain" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400">
                            <FiAward size={16} />
                          </div>
                        )}
                        <span className="font-medium text-zinc-900">{b.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">{b.slug}</td>
                    <td className="max-w-xs truncate px-6 py-4 text-zinc-600">{b.description || '—'}</td>
                    <td className="px-6 py-4 text-zinc-500">
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={b.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/brands/edit/${b._id}`} className="rounded-lg p-2 text-zinc-500 transition hover:bg-blue-50 hover:text-blue-600">
                          <FiEdit2 size={16} />
                        </Link>
                        <button onClick={() => handleDelete(b)} className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-600">
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
