'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiSave } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';
import ImageUploader from '@/components/ImageUploader';
import { SEO_PAGE_LABELS, type StoreSettings, type SeoPageKey } from '@/lib/types';

const inputCls =
  'w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-50';
const labelCls = 'mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300';
const cardCls = 'rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50';

type SeoState = NonNullable<StoreSettings['seo']>;

export default function SeoPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ settings: StoreSettings }>('/settings')
      .then((d) => setSettings(d.settings))
      .catch((err) => toastError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const seo: SeoState = settings?.seo || {};

  const setSeo = (key: 'metaTitle' | 'metaDescription' | 'ogImage', value: string) =>
    setSettings((s) => (s ? { ...s, seo: { ...s.seo, [key]: value } } : s));

  const setPageSeo = (page: SeoPageKey, field: 'title' | 'description', value: string) =>
    setSettings((s) =>
      s
        ? {
            ...s,
            seo: {
              ...s.seo,
              pages: { ...s.seo?.pages, [page]: { ...s.seo?.pages?.[page], [field]: value } },
            },
          }
        : s
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await api.patch('/settings', { seo: settings.seo || {} });
      toastSuccess('SEO settings saved');
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-primary dark:border-zinc-800 dark:border-t-zinc-50"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">SEO &amp; Meta</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Search engine titles/descriptions and the image shown when your site is shared on social media.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98] disabled:opacity-70 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <FiSave size={16} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className={cardCls}>
        <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Site-wide Defaults</h2>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Used as the fallback for any page below that's left blank, and as the browser tab title suffix everywhere.
        </p>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Default Meta Title</label>
            <input value={seo.metaTitle || ''} onChange={(e) => setSeo('metaTitle', e.target.value)} className={inputCls} placeholder="e.g. NP Bazar — Online Shopping in Bangladesh" />
          </div>
          <div>
            <label className={labelCls}>Default Meta Description</label>
            <textarea
              value={seo.metaDescription || ''}
              onChange={(e) => setSeo('metaDescription', e.target.value)}
              className={`${inputCls} min-h-24`}
              placeholder="One or two sentences describing your store — shown under the title in Google search results."
            />
          </div>
          <ImageUploader
            value={seo.ogImage ? [seo.ogImage] : []}
            onChange={(urls) => setSeo('ogImage', urls[0] || '')}
            max={1}
            label="Social Share Image (Open Graph)"
          />
          <p className="text-xs text-zinc-400">
            Shown as the preview image when your site or a page is shared on Facebook, WhatsApp, Twitter/X, etc.
            Leave empty to use your Store Logo (Settings → Store Information) instead. Recommended size: 1200 × 630 px.
          </p>
        </div>
      </div>

      <div className={cardCls}>
        <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Per-Page Titles &amp; Descriptions</h2>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Leave a field blank to fall back to the site-wide default above.
        </p>
        <div className="space-y-6">
          {SEO_PAGE_LABELS.map(({ key, label }) => {
            const page = seo.pages?.[key] || {};
            return (
              <div key={key} className="rounded-lg border border-zinc-100 p-4 dark:border-zinc-800">
                <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</h3>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Meta Title</label>
                    <input
                      value={page.title || ''}
                      onChange={(e) => setPageSeo(key, 'title', e.target.value)}
                      className={inputCls}
                      placeholder={label}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Meta Description</label>
                    <textarea
                      value={page.description || ''}
                      onChange={(e) => setPageSeo(key, 'description', e.target.value)}
                      className={`${inputCls} min-h-20`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Looking for a specific Product, Collection or Blog Post's SEO title/description? Those are set from that
        item's own edit page — open it from{' '}
        <Link href="/dashboard/products" className="font-medium text-primary hover:underline">Products</Link>,{' '}
        <Link href="/dashboard/collections" className="font-medium text-primary hover:underline">Collections</Link>, or{' '}
        <Link href="/dashboard/blogs" className="font-medium text-primary hover:underline">Blog Posts</Link>.
      </div>
    </form>
  );
}
