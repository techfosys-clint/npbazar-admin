'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import FaqForm from '@/components/FaqForm';
import api from '@/lib/api';
import { toastError } from '@/lib/toast';
import type { Faq } from '@/lib/types';

export default function EditFaqPage() {
  const { id } = useParams<{ id: string }>();
  const [faq, setFaq] = useState<Faq | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ faqs: Faq[] }>('/faqs?all=true')
      .then((d) => setFaq(d.faqs.find((f) => f._id === id) || null))
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

  if (!faq) return <p className="text-center text-zinc-500">FAQ not found.</p>;

  return <FaqForm faq={faq} />;
}
