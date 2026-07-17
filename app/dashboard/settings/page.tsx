'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiSave } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';
import ImageUploader from '@/components/ImageUploader';
import type { StoreSettings } from '@/lib/types';

const inputCls =
  'w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-50';
const labelCls = 'mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300';
const cardCls =
  'rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50';

export default function SettingsPage() {
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

  const set = (key: keyof StoreSettings, value: unknown) =>
    setSettings((s) => (s ? { ...s, [key]: value } : s));

  const setSocial = (key: string, value: string) =>
    setSettings((s) => (s ? { ...s, socialLinks: { ...s.socialLinks, [key]: value } } : s));

  const setTracking = (key: string, value: string) =>
    setSettings((s) => (s ? { ...s, trackingCodes: { ...s.trackingCodes, [key]: value } } : s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await api.patch('/settings', {
        ...settings,
        shippingCost: Number(settings.shippingCost) || 0,
        freeShippingThreshold: Number(settings.freeShippingThreshold) || 0,
      });
      toastSuccess('Settings saved');
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
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Store Settings</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Configuration used across the storefront.</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98] disabled:opacity-70 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <FiSave size={16} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={cardCls}>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Store Information</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Store Name</label>
              <input value={settings.storeName} onChange={(e) => set('storeName', e.target.value)} className={inputCls} />
            </div>
            <ImageUploader
              value={settings.logo ? [settings.logo] : []}
              onChange={(urls) => set('logo', urls[0] || '')}
              max={1}
              label="Store Logo"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Contact Email</label>
                <input type="email" value={settings.email || ''} onChange={(e) => set('email', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Contact Phone</label>
                <input value={settings.phone || ''} onChange={(e) => set('phone', e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Address</label>
              <textarea value={settings.address || ''} onChange={(e) => set('address', e.target.value)} className={`${inputCls} min-h-20`} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={cardCls}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Currency</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Currency Code</label>
                <input value={settings.currency} onChange={(e) => set('currency', e.target.value)} className={inputCls} placeholder="BDT" />
              </div>
              <div>
                <label className={labelCls}>Currency Symbol</label>
                <input value={settings.currencySymbol} onChange={(e) => set('currencySymbol', e.target.value)} className={inputCls} placeholder="৳" />
              </div>
            </div>
          </div>

          <div className={cardCls}>
            <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Appearance</h2>
            <p className="mb-4 text-xs text-zinc-500">Theme colors used across the whole storefront — change any of them and the site updates instantly.</p>
            <div className="space-y-4">
              {(
                [
                  { key: 'primaryColor', label: 'Primary Color', hint: 'Prices, badges, links & hover accents', fallback: '#df0000' },
                  { key: 'buttonColor', label: 'Button Color', hint: 'Add to Cart / CTA buttons', fallback: '#f97316' },
                  { key: 'navbarColor', label: 'Navbar Color', hint: 'Dark navigation & utility bar background', fallback: '#0b2221' },
                  { key: 'backgroundColor', label: 'Background Color', hint: 'Page background', fallback: '#fbf9f5' },
                ] as const
              ).map(({ key, label, hint, fallback }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings[key] || fallback}
                      onChange={(e) => set(key, e.target.value)}
                      className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900"
                    />
                    <input
                      value={settings[key] || fallback}
                      onChange={(e) => set(key, e.target.value)}
                      className={inputCls}
                      placeholder={fallback}
                    />
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={cardCls}>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Default Shipping</h2>
            <p className="mb-4 mt-1 text-xs text-zinc-500">
              Used for any area that doesn&apos;t have its own rule. Manage per-area pricing in{' '}
              <Link href="/dashboard/shipping" className="font-medium text-primary hover:underline">
                Shipping Zones
              </Link>
              .
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Default Shipping Cost</label>
                <input type="number" min="0" value={settings.shippingCost} onChange={(e) => set('shippingCost', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Free Shipping Above</label>
                <input
                  type="number"
                  min="0"
                  value={settings.freeShippingThreshold}
                  onChange={(e) => set('freeShippingThreshold', e.target.value)}
                  className={inputCls}
                  placeholder="0 = disabled"
                />
              </div>
            </div>
          </div>

          <div className={cardCls}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Social Links</h2>
            <div className="space-y-4">
              {(['facebook', 'instagram', 'youtube', 'twitter'] as const).map((key) => (
                <div key={key}>
                  <label className={`${labelCls} capitalize`}>{key}</label>
                  <input
                    value={settings.socialLinks?.[key] || ''}
                    onChange={(e) => setSocial(key, e.target.value)}
                    className={inputCls}
                    placeholder={`https://${key}.com/...`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={cardCls}>
        <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Tracking &amp; Analytics</h2>
        <p className="mb-4 text-xs text-zinc-500">
          Connect Google Analytics, Google Tag Manager, Meta Pixel, and search engine verification — no developer needed.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>GA4 Measurement ID</label>
            <input
              value={settings.trackingCodes?.ga4MeasurementId || ''}
              onChange={(e) => setTracking('ga4MeasurementId', e.target.value)}
              className={inputCls}
              placeholder="G-XXXXXXXXXX"
            />
            <p className="mt-1 text-xs text-zinc-400">Google Analytics 4 property ID — Admin → Data Streams. Leave blank if GTM manages GA4 for you.</p>
          </div>
          <div>
            <label className={labelCls}>GTM Container ID</label>
            <input
              value={settings.trackingCodes?.gtmContainerId || ''}
              onChange={(e) => setTracking('gtmContainerId', e.target.value)}
              className={inputCls}
              placeholder="GTM-XXXXXXX"
            />
            <p className="mt-1 text-xs text-zinc-400">Google Tag Manager container ID — top-right of your GTM workspace.</p>
          </div>
          <div>
            <label className={labelCls}>Meta Pixel ID</label>
            <input
              value={settings.trackingCodes?.metaPixelId || ''}
              onChange={(e) => setTracking('metaPixelId', e.target.value)}
              className={inputCls}
              placeholder="123456789012345"
            />
            <p className="mt-1 text-xs text-zinc-400">Facebook/Meta Pixel numeric ID from Events Manager.</p>
          </div>
          <div>
            <label className={labelCls}>Search Console Verification</label>
            <input
              value={settings.trackingCodes?.searchConsoleVerification || ''}
              onChange={(e) => setTracking('searchConsoleVerification', e.target.value)}
              className={inputCls}
              placeholder="abc123..."
            />
            <p className="mt-1 text-xs text-zinc-400">Paste only the content value from Search Console&apos;s HTML tag method — not the full &lt;meta&gt; tag.</p>
          </div>
          <div>
            <label className={labelCls}>Bing Webmaster Verification</label>
            <input
              value={settings.trackingCodes?.bingVerification || ''}
              onChange={(e) => setTracking('bingVerification', e.target.value)}
              className={inputCls}
              placeholder="abc123..."
            />
            <p className="mt-1 text-xs text-zinc-400">Paste only the content value from Bing Webmaster Tools&apos; meta tag method.</p>
          </div>
        </div>
        <div className="mt-4">
          <label className={labelCls}>Custom Head Code</label>
          <textarea
            value={settings.trackingCodes?.customHeadCode || ''}
            onChange={(e) => setTracking('customHeadCode', e.target.value)}
            className={`${inputCls} min-h-40 font-mono text-xs`}
            placeholder={'<!-- Paste Pinterest tag, TikTok Pixel, etc. -->'}
          />
          <p className="mt-1 text-xs text-zinc-400">
            Paste full HTML — &lt;meta&gt;, &lt;link&gt;, or &lt;script&gt; tags, including the tags themselves. This runs on every
            storefront page for every visitor, so only paste code from sources you trust.
          </p>
        </div>
      </div>

      <div className={cardCls}>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Pages Content (HTML Supported)</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label className={labelCls}>About Us</label>
            <textarea
              value={settings.aboutUs || ''}
              onChange={(e) => set('aboutUs', e.target.value)}
              className={`${inputCls} min-h-32`}
              placeholder="Content for the About Us page..."
            />
          </div>
          <div>
            <label className={labelCls}>Contact Us</label>
            <textarea
              value={settings.contactUs || ''}
              onChange={(e) => set('contactUs', e.target.value)}
              className={`${inputCls} min-h-32`}
              placeholder="Content for the Contact Us page..."
            />
          </div>
          <div>
            <label className={labelCls}>Privacy Policy</label>
            <textarea
              value={settings.privacyPolicy || ''}
              onChange={(e) => set('privacyPolicy', e.target.value)}
              className={`${inputCls} min-h-48`}
              placeholder="Content for the Privacy Policy page..."
            />
          </div>
          <div>
            <label className={labelCls}>Refund Policy</label>
            <textarea
              value={settings.refundPolicy || ''}
              onChange={(e) => set('refundPolicy', e.target.value)}
              className={`${inputCls} min-h-48`}
              placeholder="Content for the Refund Policy page..."
            />
          </div>
        </div>
      </div>
    </form>
  );
}
