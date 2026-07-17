'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';
import ImageUploader from '@/components/ImageUploader';
import type { Brand } from '@/lib/types';

const inputCls =
  'w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';
const labelCls = 'mb-1.5 block text-sm font-medium text-zinc-700';
const cardCls = 'rounded-xl border border-zinc-200 bg-white p-6 shadow-sm';

export default function BrandForm({ brand }: { brand?: Brand }) {
  const router = useRouter();
  const isEdit = !!brand;

  const [saving, setSaving] = useState(false);
  const [logo, setLogo] = useState<string[]>(brand?.logo ? [brand.logo] : []);
  const [form, setForm] = useState({
    name: brand?.name || '',
    description: brand?.description || '',
    isActive: brand?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, logo: logo[0] || '' };
      if (isEdit) {
        await api.patch(`/brands/${brand!._id}`, payload);
        toastSuccess('Brand updated');
      } else {
        await api.post('/brands', payload);
        toastSuccess('Brand created');
      }
      router.push('/dashboard/brands');
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
          <Link href="/dashboard/brands" className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-100">
            <FiArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {isEdit ? `Edit: ${brand!.name}` : 'Add Brand'}
          </h1>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-70"
        >
          <FiSave size={16} /> {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
        </button>
      </div>

      <div className={cardCls}>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} required placeholder="Nike" />
          </div>
          <ImageUploader value={logo} onChange={setLogo} max={1} label="Brand Logo" />
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputCls} min-h-24`} placeholder="Optional description" />
          </div>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 px-4 py-3">
            <span className="text-sm font-medium text-zinc-700">Active (visible in store)</span>
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-5 w-5 accent-primary" />
          </label>
        </div>
      </div>
    </form>
  );
}
