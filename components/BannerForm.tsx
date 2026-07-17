'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';
import ImageUploader from '@/components/ImageUploader';
import { BANNER_PLACEMENTS, type Banner, type BannerPlacement } from '@/lib/types';

const inputCls =
  'w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';
const labelCls = 'mb-1.5 block text-sm font-medium text-zinc-700';
const cardCls = 'rounded-xl border border-zinc-200 bg-white p-6 shadow-sm';

interface Props {
  banner?: Banner;
  /** Preselected placement when creating (from ?placement= query). */
  defaultPlacement?: BannerPlacement;
}

export default function BannerForm({ banner, defaultPlacement }: Props) {
  const router = useRouter();
  const isEdit = !!banner;

  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<string[]>(banner?.image ? [banner.image] : []);
  const [mobileImage, setMobileImage] = useState<string[]>(banner?.mobileImage ? [banner.mobileImage] : []);
  const [form, setForm] = useState({
    placement: banner?.placement || defaultPlacement || ('hero_slider' as BannerPlacement),
    title: banner?.title || '',
    link: banner?.link || '',
    order: banner?.order != null ? String(banner.order) : '0',
    isActive: banner?.isActive ?? true,
  });

  const meta = BANNER_PLACEMENTS.find((p) => p.key === form.placement)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image[0]) {
      toastError('Please upload the banner image');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, image: image[0], mobileImage: mobileImage[0] || '', order: Number(form.order) || 0 };
      if (isEdit) {
        await api.patch(`/banners/${banner!._id}`, payload);
        toastSuccess('Banner updated');
      } else {
        await api.post('/banners', payload);
        toastSuccess('Banner created');
      }
      router.push('/dashboard/banners');
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
          <Link href="/dashboard/banners" className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-100">
            <FiArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {isEdit ? 'Edit Banner' : `Add ${meta.label}`}
          </h1>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-70"
        >
          <FiSave size={16} /> {saving ? 'Saving...' : isEdit ? 'Update Banner' : 'Create Banner'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={cardCls}>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Banner Image</h2>
          <div className="mb-4 rounded-xl bg-primary/5 px-4 py-3 text-sm text-primary">
            📐 Recommended size for <strong>{meta.label}</strong>: <strong>{meta.size}</strong>
            <span className="mt-0.5 block text-xs text-primary/70">{meta.hint}</span>
          </div>
          <ImageUploader value={image} onChange={setImage} max={1} label="Upload Image *" />
          {image[0] && (
            <div className="mt-4">
              <p className="mb-1.5 text-sm font-medium text-zinc-700">Preview</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image[0]} alt="preview" className="w-full rounded-xl border border-zinc-200 object-cover" />
            </div>
          )}

          {form.placement === 'hero_slider' && (
            <div className="mt-6 border-t border-zinc-100 pt-6">
              <div className="mb-4 rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                📱 Optional — shown instead of the image above on mobile screens. Recommended a taller/portrait
                crop (e.g. <strong>750 × 500 px</strong>) so the slide isn&apos;t awkwardly cropped on small screens.
                Falls back to the main image if left empty.
              </div>
              <ImageUploader value={mobileImage} onChange={setMobileImage} max={1} label="Upload Mobile Image (optional)" />
              {mobileImage[0] && (
                <div className="mt-4">
                  <p className="mb-1.5 text-sm font-medium text-zinc-700">Mobile Preview</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mobileImage[0]} alt="mobile preview" className="max-w-[220px] rounded-xl border border-zinc-200 object-cover" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className={cardCls}>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Details</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Placement *</label>
              <select
                value={form.placement}
                onChange={(e) => setForm({ ...form, placement: e.target.value as BannerPlacement })}
                className={inputCls}
              >
                {BANNER_PLACEMENTS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label} ({p.size})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Title (optional)</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputCls}
                placeholder="e.g. Healthy Dates Campaign"
              />
              <p className="mt-1 text-xs text-zinc-400">Only for identifying the banner in the admin panel.</p>
            </div>
            <div>
              <label className={labelCls}>Link (where a click goes)</label>
              <input
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                className={inputCls}
                placeholder="/products/khejuri-dates  or  https://..."
              />
              <p className="mt-1 text-xs text-zinc-400">
                Customers who click this banner will be taken here. Leave empty for no link.
              </p>
            </div>
            {meta.multiple && (
              <div>
                <label className={labelCls}>Slide Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-zinc-400">Lower numbers show first in the slider.</p>
              </div>
            )}
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 px-4 py-3">
              <span className="text-sm font-medium text-zinc-700">Active (visible on the site)</span>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-5 w-5 accent-primary"
              />
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
