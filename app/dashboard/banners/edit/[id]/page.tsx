'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BannerForm from '@/components/BannerForm';
import api from '@/lib/api';
import { toastError } from '@/lib/toast';
import type { Banner } from '@/lib/types';

export default function EditBannerPage() {
  const { id } = useParams<{ id: string }>();
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ banners: Banner[] }>('/banners?all=true')
      .then((d) => setBanner(d.banners.find((b) => b._id === id) || null))
      .catch((err) => toastError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
      </div>
    );
  }

  if (!banner) return <p className="text-center text-zinc-500">Banner not found.</p>;

  return <BannerForm banner={banner} />;
}
