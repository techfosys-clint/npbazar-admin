'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiLayers, FiZap } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError, confirmDialog } from '@/lib/toast';
import StatusBadge from '@/components/StatusBadge';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import type { Collection } from '@/lib/types';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ all: 'true' });
      if (search) params.set('search', search);
      const data = await api.get<{ collections: Collection[] }>(`/collections?${params}`);
      setCollections(data.collections);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleDelete = async (c: Collection) => {
    if (!(await confirmDialog(`Delete "${c.name}"?`, 'Products will stay, just unlinked from this collection.'))) return;
    try {
      await api.del(`/collections/${c._id}`);
      toastSuccess('Collection deleted');
      fetchCollections();
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Collections & Categories</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {collections.length} collections — organize products for browsing (a manual/smart group, optionally nested under a parent)
          </p>
        </div>
        <Link
          href="/dashboard/collections/new"
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98]"
        >
          <FiPlus size={16} /> Add Collection
        </Link>
      </div>

      <div className="relative max-w-md">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search collections..."
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-6 py-3 font-medium">Collection</th>
                <th className="px-6 py-3 font-medium">Parent</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Products</th>
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
              ) : collections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No collections yet. Create your first one.
                  </td>
                </tr>
              ) : (
                collections.map((c) => (
                  <tr key={c._id} className="transition hover:bg-zinc-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {c.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.image} alt={c.name} className="h-10 w-10 rounded-lg border border-zinc-200 object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400">
                            <FiLayers size={16} />
                          </div>
                        )}
                        <span className="font-medium text-zinc-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      {typeof c.parent === 'object' && c.parent ? c.parent.name : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600">
                        {c.type === 'smart' && <FiZap size={12} className="text-accent" />}
                        {c.type === 'smart' ? 'Smart' : 'Manual'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-600">{c.productCount ?? 0}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/collections/edit/${c._id}`} className="rounded-lg p-2 text-zinc-500 transition hover:bg-blue-50 hover:text-primary">
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
