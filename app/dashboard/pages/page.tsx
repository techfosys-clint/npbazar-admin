'use client';

import { useEffect, useState } from 'react';
import { FiSave } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';
import RichTextEditor from '@/components/RichTextEditor';
import type { StoreSettings } from '@/lib/types';

type PageField = 'aboutUs' | 'contactUs' | 'privacyPolicy' | 'refundPolicy';

const TABS: { key: PageField; label: string; url: string }[] = [
  { key: 'aboutUs', label: 'About Us', url: '/about' },
  { key: 'contactUs', label: 'Contact Us', url: '/contact' },
  { key: 'privacyPolicy', label: 'Privacy Policy', url: '/privacy-policy' },
  { key: 'refundPolicy', label: 'Refund Policy', url: '/refund-policy' },
];

export default function StaticPagesPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState<PageField>('aboutUs');

  useEffect(() => {
    api
      .get<{ settings: StoreSettings }>('/settings')
      .then((d) => setSettings(d.settings))
      .catch((err) => toastError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const setField = (key: PageField, html: string) => setSettings((s) => (s ? { ...s, [key]: html } : s));

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await api.patch('/settings', {
        aboutUs: settings.aboutUs || '',
        contactUs: settings.contactUs || '',
        privacyPolicy: settings.privacyPolicy || '',
        refundPolicy: settings.refundPolicy || '',
      });
      toastSuccess('Page content saved');
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

  const activeTab = TABS.find((t) => t.key === active)!;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Static Pages</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Design the About Us, Contact Us, Privacy Policy and Refund Policy pages — add headings, bold text, images, links, tables.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98] disabled:opacity-70 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <FiSave size={16} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
              active === tab.key
                ? 'border-b-2 border-primary text-primary'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{activeTab.label}</h2>
          <a
            href={`https://npbazar.com${activeTab.url}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-primary hover:underline"
          >
            View live page →
          </a>
        </div>
        <RichTextEditor
          value={settings[active] || ''}
          onChange={(html) => setField(active, html)}
          placeholder={`Write the ${activeTab.label} content...`}
          height={420}
        />
      </div>
    </div>
  );
}
