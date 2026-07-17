'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiPackage, FiStar } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError, confirmDialog } from '@/lib/toast';
import Pagination from '@/components/Pagination';
import StatusBadge from '@/components/StatusBadge';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import type { Product, Collection, PaginationInfo } from '@/lib/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput);
  const [collection, setCollection] = useState('');
  const [sort, setSort] = useState('newest');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ all: 'true', page: String(page), limit: '10', sort });
      if (search) params.set('search', search);
      if (collection) params.set('collection', collection);
      if (type === 'featured') params.set('featured', 'true');
      if (type === 'bestselling') params.set('bestSelling', 'true');
      const data = await api.get<{ products: Product[]; pagination: PaginationInfo }>(`/products?${params}`);
      setProducts(data.products);
      setPagination(data.pagination);
      setSelectedIds([]); // Clear selection on fetch
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, search, collection, sort, type]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    api.get<{ collections: Collection[] }>('/collections?all=true').then((d) => setCollections(d.collections)).catch(() => {});
  }, []);

  const handleDelete = async (p: Product) => {
    if (!(await confirmDialog(`Delete "${p.name}"?`))) return;
    try {
      await api.del(`/products/${p._id}`);
      toastSuccess('Product deleted');
      fetchProducts();
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  const handleBulkDelete = async () => {
    if (!(await confirmDialog(`Delete ${selectedIds.length} products?`))) return;
    try {
      await api.post('/products/bulk-delete', { ids: selectedIds });
      toastSuccess('Products deleted');
      fetchProducts();
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  const handleBulkStatus = async (isActive: boolean) => {
    if (!(await confirmDialog(`Set ${selectedIds.length} products to ${isActive ? 'Active' : 'Inactive'}?`, 'This will update their visibility.', 'Yes, update!'))) return;
    try {
      await api.post('/products/bulk-status', { ids: selectedIds, isActive });
      toastSuccess(`Products marked as ${isActive ? 'active' : 'inactive'}`);
      fetchProducts();
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  const handleBulkDuplicate = async () => {
    if (!(await confirmDialog(`Duplicate ${selectedIds.length} products?`, `This will create copies of the selected products.`, `Yes, duplicate!`))) return;
    try {
      await api.post('/products/bulk-duplicate', { ids: selectedIds });
      toastSuccess('Products duplicated');
      fetchProducts();
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const inputCls =
    'rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-50';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Products</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {pagination ? `${pagination.total} products in catalog` : 'Manage your catalog'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mr-2">
                {selectedIds.length} selected
              </span>
              <button
                onClick={() => handleBulkStatus(true)}
                className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
              >
                Set Active
              </button>
              <button
                onClick={() => handleBulkStatus(false)}
                className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              >
                Set Inactive
              </button>
              <button
                onClick={handleBulkDuplicate}
                className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                Duplicate
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
              >
                <FiTrash2 size={16} /> Delete
              </button>
            </div>
          )}
          <Link
            href="/dashboard/products/new"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <FiPlus size={16} /> Add Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products..."
            className={`${inputCls} w-full pl-10`}
          />
        </div>
        <select
          value={collection}
          onChange={(e) => {
            setPage(1);
            setCollection(e.target.value);
          }}
          className={inputCls}
        >
          <option value="">All collections</option>
          {collections.map((c) => (
            <option key={c._id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => {
            setPage(1);
            setType(e.target.value);
          }}
          className={inputCls}
        >
          <option value="">All products</option>
          <option value="featured">⭐ Featured only</option>
          <option value="bestselling">🔥 Best selling only</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className={inputCls}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="popular">Best Selling</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-3 w-12">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:checked:bg-primary"
                    checked={products.length > 0 && selectedIds.length === products.length}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">Collections</th>
                <th className="px-6 py-3 font-medium">Price</th>
                <th className="px-6 py-3 font-medium">Stock</th>
                <th className="px-6 py-3 font-medium">Sold</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-primary dark:border-zinc-800 dark:border-t-zinc-50"></div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className={`transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${selectedIds.includes(p._id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:checked:bg-primary"
                        checked={selectedIds.includes(p._id)}
                        onChange={() => toggleSelection(p._id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.thumbnail} alt={p.name} className="h-11 w-11 rounded-lg border border-zinc-200 object-cover dark:border-zinc-800" />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                            <FiPackage size={18} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 truncate font-medium text-zinc-900 dark:text-zinc-100">
                            {p.name}
                            {p.isFeatured && <FiStar size={13} className="shrink-0 text-amber-500" title="Featured" />}
                            {p.isBestSelling && (
                              <span
                                className="shrink-0 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold text-accent"
                                title="Best selling product"
                              >
                                🔥 BEST
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-zinc-500">{p.sku || p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[160px] truncate px-6 py-4 text-zinc-600 dark:text-zinc-400" title={p.collections?.map((c) => (typeof c === 'object' ? c.name : c)).join(', ')}>
                      {p.collections && p.collections.length > 0
                        ? p.collections.map((c) => (typeof c === 'object' ? c.name : c)).join(', ')
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">৳{p.price.toLocaleString()}</p>
                      {p.comparePrice ? (
                        <p className="text-xs text-zinc-400 line-through">৳{p.comparePrice.toLocaleString()}</p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      {p.stock === null ? (
                        <span className="font-medium text-zinc-500 dark:text-zinc-400">Unlimited</span>
                      ) : (
                        <span className={p.stock <= 5 ? 'font-semibold text-red-600 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-300'}>
                          {p.stock}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{p.sold || 0}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={p.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/products/edit/${p.slug}`}
                          className="rounded-lg p-2 text-zinc-500 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40"
                        >
                          <FiEdit2 size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(p)}
                          className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
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
