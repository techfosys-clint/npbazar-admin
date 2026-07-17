'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiChevronUp, FiHelpCircle } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError, confirmDialog } from '@/lib/toast';
import StatusBadge from '@/components/StatusBadge';
import type { Faq } from '@/lib/types';

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchFaqs = useCallback(async () => {
    try {
      const data = await api.get<{ faqs: Faq[] }>('/faqs?all=true');
      setFaqs(data.faqs);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const handleDelete = async (f: Faq) => {
    if (!(await confirmDialog('Delete this FAQ?'))) return;
    try {
      await api.del(`/faqs/${f._id}`);
      toastSuccess('FAQ deleted');
      fetchFaqs();
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">FAQs</h1>
          <p className="mt-1 text-sm text-zinc-500">{faqs.length} questions shown on the storefront FAQ section</p>
        </div>
        <Link
          href="/dashboard/faqs/new"
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98]"
        >
          <FiPlus size={16} /> Add FAQ
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
          </div>
        ) : faqs.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-zinc-400">
            <FiHelpCircle size={36} />
            <p className="text-sm font-medium">No FAQs yet. Add your first question.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {faqs.map((f) => {
              const isOpen = expanded === f._id;
              return (
                <div key={f._id}>
                  <div className="flex w-full items-center gap-3 px-6 py-4 transition hover:bg-zinc-50">
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : f._id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                        {f.order}
                      </span>
                      <span className="truncate font-medium text-zinc-900">{f.question}</span>
                    </button>
                    <StatusBadge status={f.isActive ? 'active' : 'inactive'} />
                    <div className="flex shrink-0 items-center gap-1">
                      <Link href={`/dashboard/faqs/edit/${f._id}`} className="rounded-lg p-2 text-zinc-500 transition hover:bg-blue-50 hover:text-primary">
                        <FiEdit2 size={15} />
                      </Link>
                      <button onClick={() => handleDelete(f)} className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-600">
                        <FiTrash2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : f._id)}
                        className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100"
                      >
                        {isOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                      </button>
                    </div>
                  </div>
                  {isOpen && (
                    <div
                      className="prose prose-sm max-w-none border-t border-dashed border-zinc-200 bg-zinc-50/60 px-6 py-4 text-sm text-zinc-700"
                      dangerouslySetInnerHTML={{ __html: f.answer }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
