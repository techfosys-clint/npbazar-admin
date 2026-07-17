'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit2, FiTrash2, FiExternalLink, FiImage } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError, confirmDialog } from '@/lib/toast';
import StatusBadge from '@/components/StatusBadge';
import { BANNER_PLACEMENTS, type Banner } from '@/lib/types';

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBanners = useCallback(async () => {
    try {
      const data = await api.get<{ banners: Banner[] }>('/banners?all=true');
      setBanners(data.banners);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleDelete = async (b: Banner) => {
    if (!(await confirmDialog('Delete this banner?'))) return;
    try {
      await api.del(`/banners/${b._id}`);
      toastSuccess('Banner deleted');
      fetchBanners();
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Banners / Hero Images</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage the home page hero slider, side advertisement and bottom section banners. Each image can carry a link.
        </p>
      </div>

      {BANNER_PLACEMENTS.map((placement) => {
        const items = banners.filter((b) => b.placement === placement.key);
        return (
          <div key={placement.key} className="rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-zinc-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
                  {placement.label}
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {placement.size}
                  </span>
                </h2>
                <p className="mt-0.5 text-xs text-zinc-400">{placement.hint}</p>
              </div>
              <Link
                href={`/dashboard/banners/new?placement=${placement.key}`}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98]"
              >
                <FiPlus size={15} /> Add {placement.multiple ? 'Slide' : 'Banner'}
              </Link>
            </div>

            {items.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2 text-zinc-400">
                <FiImage size={24} />
                <p className="text-sm">No image yet — recommended size {placement.size}</p>
              </div>
            ) : (
              <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((b) => (
                  <div key={b._id} className="group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
                    <div className="relative aspect-[12/5] bg-zinc-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.image} alt={b.title || 'banner'} className="h-full w-full object-cover" />
                      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                        <Link
                          href={`/dashboard/banners/edit/${b._id}`}
                          className="rounded-lg bg-black/60 p-1.5 text-white transition hover:bg-primary"
                        >
                          <FiEdit2 size={13} />
                        </Link>
                        <button
                          onClick={() => handleDelete(b)}
                          className="rounded-lg bg-black/60 p-1.5 text-white transition hover:bg-red-500"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900">{b.title || 'Untitled'}</p>
                        {b.link ? (
                          <a
                            href={b.link}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 truncate text-xs text-primary hover:underline"
                          >
                            <FiExternalLink size={10} className="shrink-0" /> {b.link}
                          </a>
                        ) : (
                          <p className="text-xs text-zinc-400">No link</p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={b.isActive ? 'active' : 'inactive'} />
                        {placement.multiple && <span className="text-[10px] text-zinc-400">order {b.order}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
