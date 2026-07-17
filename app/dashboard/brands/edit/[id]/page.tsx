'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BrandForm from '@/components/BrandForm';
import api from '@/lib/api';
import { toastError } from '@/lib/toast';
import type { Brand } from '@/lib/types';

export default function EditBrandPage() {
  const { id } = useParams<{ id: string }>();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ brands: Brand[] }>('/brands?all=true')
      .then((d) => setBrand(d.brands.find((b) => b._id === id) || null))
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

  if (!brand) return <p className="text-center text-zinc-500">Brand not found.</p>;

  return <BrandForm brand={brand} />;
}
