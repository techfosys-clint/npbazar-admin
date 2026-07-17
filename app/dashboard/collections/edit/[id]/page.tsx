'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import CollectionForm from '@/components/CollectionForm';
import api from '@/lib/api';
import { toastError } from '@/lib/toast';
import type { Collection } from '@/lib/types';

export default function EditCollectionPage() {
  const { id } = useParams<{ id: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ collections: Collection[] }>('/collections?all=true')
      .then((d) => setCollection(d.collections.find((c) => c._id === id) || null))
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

  if (!collection) return <p className="text-center text-zinc-500">Collection not found.</p>;

  return <CollectionForm collection={collection} />;
}
