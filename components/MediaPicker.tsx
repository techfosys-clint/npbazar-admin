'use client';

import { useEffect, useState } from 'react';
import { FiX, FiCheck, FiSearch, FiImage, FiUploadCloud } from 'react-icons/fi';
import api from '@/lib/api';
import { toastError } from '@/lib/toast';
import { uploadImages } from '@/lib/upload';

export interface MediaFile {
  name: string;
  url: string;
  size: number;
  createdAt: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called with the chosen URLs. */
  onSelect: (urls: string[]) => void;
  /** Max images the caller can accept. */
  max?: number;
}

export const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function MediaPicker({ open, onClose, onSelect, max = 1 }: Props) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setLoading(true);
    api
      .get<{ files: MediaFile[] }>('/upload')
      .then((d) => setFiles(d.files))
      .catch((err) => toastError((err as Error).message))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const toggle = (url: string) => {
    setSelected((sel) => {
      if (sel.includes(url)) return sel.filter((u) => u !== url);
      if (sel.length >= max) {
        // Single-select behaves like a radio; multi-select blocks past the max.
        return max === 1 ? [url] : sel;
      }
      return [...sel, url];
    });
  };

  const handleUpload = async (list: FileList) => {
    setUploading(true);
    try {
      const urls = await uploadImages(list);
      // Refresh list and preselect newly uploaded images (within max).
      const d = await api.get<{ files: MediaFile[] }>('/upload');
      setFiles(d.files);
      setSelected((sel) => [...sel, ...urls].slice(0, max));
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const visible = files.filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-zinc-900">
            Media Library <span className="text-sm font-normal text-zinc-400">(select up to {max})</span>
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900">
            <FiX size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-2 border-b border-zinc-100 px-6 py-3 sm:flex-row">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files..."
              className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark">
            <FiUploadCloud size={15} />
            {uploading ? 'Uploading...' : 'Upload New'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              multiple
              hidden
              disabled={uploading}
              onChange={(e) => {
                if (e.target.files?.length) handleUpload(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-zinc-400">
              <FiImage size={32} />
              <p className="text-sm">No images found. Upload some!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {visible.map((f) => {
                const isSel = selected.includes(f.url);
                return (
                  <button
                    type="button"
                    key={f.url}
                    onClick={() => toggle(f.url)}
                    className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition ${
                      isSel ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-zinc-300'
                    }`}
                    title={f.name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.url} alt={f.name} className="h-full w-full object-cover" loading="lazy" />
                    {isSel && (
                      <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow">
                        <FiCheck size={14} />
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-1.5 py-0.5 text-left text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                      {f.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4">
          <p className="text-sm text-zinc-500">{selected.length} selected</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selected.length === 0}
              onClick={() => {
                onSelect(selected);
                onClose();
              }}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
            >
              Use Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
