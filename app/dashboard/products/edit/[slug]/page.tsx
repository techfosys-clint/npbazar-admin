'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProductForm from '@/components/ProductForm';
import api from '@/lib/api';
import { toastError } from '@/lib/toast';
import type { Product } from '@/lib/types';

export default function EditProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api
      .get<{ product: Product }>(`/products/${slug}`)
      .then((d) => setProduct(d.product))
      .catch((err) => toastError((err as Error).message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-primary dark:border-zinc-800 dark:border-t-zinc-50"></div>
      </div>
    );
  }

  if (!product) {
    return <p className="text-center text-zinc-500 dark:text-zinc-400">Product not found.</p>;
  }

  return <ProductForm product={product} />;
}
