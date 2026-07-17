'use client';

import { useCallback, useEffect, useState } from 'react';
import { FiTrash2, FiCheck, FiX, FiStar } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError, confirmDialog } from '@/lib/toast';
import StatusBadge from '@/components/StatusBadge';
import type { Review } from '@/lib/types';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'hidden'>('all');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const q = filter === 'all' ? '' : `?approved=${filter === 'approved'}`;
      const data = await api.get<{ reviews: Review[] }>(`/admin-reviews${q}`);
      setReviews(data.reviews);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const toggleApprove = async (r: Review) => {
    try {
      await api.patch(`/admin-reviews/${r._id}`, { isApproved: !r.isApproved });
      toastSuccess(r.isApproved ? 'Review hidden' : 'Review approved');
      fetchReviews();
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  const handleDelete = async (r: Review) => {
    if (!(await confirmDialog('Delete this review?'))) return;
    try {
      await api.del(`/admin-reviews/${r._id}`);
      toastSuccess('Review deleted');
      fetchReviews();
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  const Stars = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <FiStar
          key={n}
          size={14}
          className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-700'}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Reviews</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{reviews.length} reviews</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-800">
          {(['all', 'approved', 'hidden'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Rating</th>
                <th className="px-6 py-3 font-medium">Comment</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-primary dark:border-zinc-800 dark:border-t-zinc-50"></div>
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    No reviews found.
                  </td>
                </tr>
              ) : (
                reviews.map((r) => (
                  <tr key={r._id} className="transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="max-w-40 truncate px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                      {r.product?.name || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-zinc-900 dark:text-zinc-100">{r.user?.name || '—'}</p>
                      <p className="text-xs text-zinc-500">{r.user?.mobile}</p>
                    </td>
                    <td className="px-6 py-4"><Stars rating={r.rating} /></td>
                    <td className="max-w-xs truncate px-6 py-4 text-zinc-600 dark:text-zinc-400">{r.comment || '—'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.isApproved ? 'approved' : 'hidden'} />
                    </td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleApprove(r)}
                          title={r.isApproved ? 'Hide review' : 'Approve review'}
                          className={`rounded-lg p-2 transition ${
                            r.isApproved
                              ? 'text-zinc-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/40'
                              : 'text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40'
                          }`}
                        >
                          {r.isApproved ? <FiX size={16} /> : <FiCheck size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
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
      </div>
    </div>
  );
}
