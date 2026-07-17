'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiSave, FiArrowLeft, FiPlus } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';
import RichTextEditor from '@/components/RichTextEditor';
import type { Faq } from '@/lib/types';

const inputCls =
  'w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';
const labelCls = 'mb-1.5 block text-sm font-medium text-zinc-700';
const cardCls = 'rounded-xl border border-zinc-200 bg-white p-6 shadow-sm';

export default function FaqForm({ faq }: { faq?: Faq }) {
  const router = useRouter();
  const isEdit = !!faq;

  const [saving, setSaving] = useState(false);
  const [stayOnPage, setStayOnPage] = useState(false);
  const [answer, setAnswer] = useState(faq?.answer || '');
  const [form, setForm] = useState({
    question: faq?.question || '',
    order: faq?.order != null ? String(faq.order) : '0',
    isActive: faq?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim() || !answer.trim()) {
      toastError('Question and answer are both required');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, answer, order: Number(form.order) || 0 };
      if (isEdit) {
        await api.patch(`/faqs/${faq!._id}`, payload);
        toastSuccess('FAQ updated');
        router.push('/dashboard/faqs');
      } else {
        await api.post('/faqs', payload);
        toastSuccess('FAQ created');
        if (stayOnPage) {
          setForm({ question: '', order: String(Number(form.order) + 1), isActive: true });
          setAnswer('');
          setStayOnPage(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          router.push('/dashboard/faqs');
        }
      }
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/faqs" className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-100">
            <FiArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{isEdit ? 'Edit FAQ' : 'Add FAQ'}</h1>
        </div>
        <div className="flex items-center gap-3">
          {!isEdit && (
            <button
              type="submit"
              onClick={() => setStayOnPage(true)}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-70 dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              <FiPlus size={16} /> Save & Add Another
            </button>
          )}
          <button
            type="submit"
            onClick={() => setStayOnPage(false)}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-70"
          >
            <FiSave size={16} /> {saving ? 'Saving...' : isEdit ? 'Update FAQ' : 'Create FAQ'}
          </button>
        </div>
      </div>

      <div className={cardCls}>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Question *</label>
            <input
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              className={inputCls}
              required
              placeholder="e.g. How long does delivery take?"
            />
          </div>
          <div>
            <label className={labelCls}>Answer *</label>
            <RichTextEditor value={answer} onChange={setAnswer} placeholder="Write the answer..." height={240} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Sort Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-zinc-400">Lower numbers appear first on the FAQ page.</p>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <label className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2.5 transition hover:border-zinc-300">
                <span className="text-sm font-medium text-zinc-700">Active (visible on the site)</span>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-5 w-5 accent-primary"
                />
              </label>
              <p className="mt-1 text-xs text-zinc-400">Toggle whether this FAQ is visible to customers.</p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
