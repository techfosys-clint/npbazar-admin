'use client';

import { useCallback, useEffect, useState } from 'react';
import { FiUploadCloud, FiTrash2, FiSearch, FiImage, FiCopy, FiCheck } from 'react-icons/fi';
import api, { API_BASE } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { uploadImages } from '@/lib/upload';
import { toastSuccess, toastError, confirmDialog } from '@/lib/toast';
import { formatSize, type MediaFile } from '@/components/MediaPicker';

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const fetchFiles = useCallback(async () => {
    try {
      const data = await api.get<{ files: MediaFile[] }>('/upload');
      setFiles(data.files);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (list: FileList | File[]) => {
    setUploading(true);
    try {
      const urls = await uploadImages(list);
      toastSuccess(`${urls.length} image${urls.length > 1 ? 's' : ''} uploaded`);
      fetchFiles();
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toastError('Could not copy');
    }
  };

  const deleteOne = async (f: MediaFile) => {
    if (!(await confirmDialog(`Delete "${f.name}"?`, 'Products using this image will show a broken link.'))) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ url: f.url }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || 'Delete failed');
      toastSuccess('Image deleted');
      setSelected((s) => s.filter((u) => u !== f.url));
      fetchFiles();
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  const deleteSelected = async () => {
    if (selected.length === 0) return;
    if (!(await confirmDialog(`Delete ${selected.length} image(s)?`, 'This cannot be undone.'))) return;
    const token = getToken();
    await Promise.allSettled(
      selected.map((url) =>
        fetch(`${API_BASE}/upload`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ url }),
        })
      )
    );
    toastSuccess('Selected images deleted');
    setSelected([]);
    fetchFiles();
  };

  const toggleSelect = (url: string) =>
    setSelected((s) => (s.includes(url) ? s.filter((u) => u !== url) : [...s, url]));

  const visible = files.filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Media Library</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {files.length} images · every image uploaded anywhere in the panel lives here
          </p>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <button
              onClick={deleteSelected}
              className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              <FiTrash2 size={16} /> Delete ({selected.length})
            </button>
          )}
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98]">
            <FiUploadCloud size={16} />
            {uploading ? 'Uploading...' : 'Bulk Upload'}
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
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by filename..."
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>

      {/* Drop zone + grid */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed p-6 transition ${
          dragOver ? 'border-primary bg-primary/5' : 'border-zinc-200 bg-white'
        }`}
      >
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-zinc-400">
            <FiImage size={40} />
            <p className="text-sm font-medium">
              {search ? 'No images match your search.' : 'No images yet — drag & drop here or click Bulk Upload.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {visible.map((f) => {
              const isSel = selected.includes(f.url);
              return (
                <div
                  key={f.url}
                  className={`group relative overflow-hidden rounded-xl border-2 bg-white shadow-sm transition ${
                    isSel ? 'border-primary ring-2 ring-primary/30' : 'border-zinc-100 hover:border-zinc-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSelect(f.url)}
                    className="relative block aspect-square w-full"
                    title={`${f.name} · click to select`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.url} alt={f.name} className="h-full w-full object-cover" loading="lazy" />
                    {isSel && (
                      <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow">
                        <FiCheck size={14} />
                      </span>
                    )}
                  </button>

                  {/* Hover actions */}
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => copyUrl(f.url)}
                      title="Copy URL"
                      className="rounded-lg bg-black/60 p-1.5 text-white transition hover:bg-primary"
                    >
                      {copied === f.url ? <FiCheck size={13} /> : <FiCopy size={13} />}
                    </button>
                    <button
                      onClick={() => deleteOne(f)}
                      title="Delete"
                      className="rounded-lg bg-black/60 p-1.5 text-white transition hover:bg-red-500"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>

                  <div className="border-t border-zinc-100 px-2.5 py-2">
                    <p className="truncate text-xs font-medium text-zinc-700" title={f.name}>{f.name}</p>
                    <p className="text-[10px] text-zinc-400">
                      {formatSize(f.size)} · {new Date(f.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
