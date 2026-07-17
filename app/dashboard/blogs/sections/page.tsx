'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FiPlus, FiTrash2, FiArrowLeft, FiBookOpen } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError, confirmDialog } from '@/lib/toast';
import StatusBadge from '@/components/StatusBadge';
import type { Blog } from '@/lib/types';

export default function BlogSectionsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchBlogs = useCallback(async () => {
    try {
      const data = await api.get<{ blogs: Blog[] }>('/blogs?all=true');
      setBlogs(data.blogs);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.post('/blogs', { name: name.trim() });
      toastSuccess('Blog section added');
      setName('');
      fetchBlogs();
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (b: Blog) => {
    if (!(await confirmDialog(`Delete "${b.name}"?`, 'Posts under this section will need to be reassigned.'))) return;
    try {
      await api.del(`/blogs/${b._id}`);
      toastSuccess('Blog section deleted');
      fetchBlogs();
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/blogs" className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-100">
          <FiArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Blog Sections</h1>
          <p className="mt-1 text-sm text-zinc-500">Group blog posts under sections like &quot;News&quot; or &quot;Recipes&quot;.</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex max-w-md gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. News"
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
        <button
          type="submit"
          disabled={saving}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-70"
        >
          <FiPlus size={16} /> Add
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
          </div>
        ) : blogs.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-zinc-400">
            <FiBookOpen size={28} />
            <p className="text-sm">No sections yet — add one above.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {blogs.map((b) => (
              <div key={b._id} className="flex items-center justify-between px-6 py-3">
                <span className="font-medium text-zinc-900">{b.name}</span>
                <div className="flex items-center gap-3">
                  <StatusBadge status={b.isActive ? 'active' : 'inactive'} />
                  <button onClick={() => handleDelete(b)} className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-600">
                    <FiTrash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
