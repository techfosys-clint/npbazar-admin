'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiSettings, FiFileText } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError, confirmDialog } from '@/lib/toast';
import Pagination from '@/components/Pagination';
import StatusBadge from '@/components/StatusBadge';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import type { Blog, BlogPost, PaginationInfo } from '@/lib/types';

export default function BlogPostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput);
  const [blogFilter, setBlogFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ all: 'true', page: String(page), limit: '15' });
      if (search) params.set('search', search);
      if (blogFilter) params.set('blog', blogFilter);
      const data = await api.get<{ posts: BlogPost[]; pagination: PaginationInfo }>(`/blog-posts?${params}`);
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, search, blogFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    api.get<{ blogs: Blog[] }>('/blogs?all=true').then((d) => setBlogs(d.blogs)).catch(() => {});
  }, []);

  const handleDelete = async (p: BlogPost) => {
    if (!(await confirmDialog(`Delete "${p.title}"?`))) return;
    try {
      await api.del(`/blog-posts/${p._id}`);
      toastSuccess('Blog post deleted');
      fetchPosts();
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  const inputCls =
    'rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Blog Posts</h1>
          <p className="mt-1 text-sm text-zinc-500">{pagination ? `${pagination.total} posts` : 'Manage your blog content'}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/blogs/sections"
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
          >
            <FiSettings size={16} /> Sections
          </Link>
          <Link
            href="/dashboard/blogs/new"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98]"
          >
            <FiPlus size={16} /> Add Blog Post
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search posts..."
            className={`${inputCls} w-full pl-10`}
          />
        </div>
        <select
          value={blogFilter}
          onChange={(e) => {
            setPage(1);
            setBlogFilter(e.target.value);
          }}
          className={inputCls}
        >
          <option value="">All sections</option>
          {blogs.map((b) => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-6 py-3 font-medium">Post</th>
                <th className="px-6 py-3 font-medium">Blog</th>
                <th className="px-6 py-3 font-medium">Author</th>
                <th className="px-6 py-3 font-medium">Visibility</th>
                <th className="px-6 py-3 font-medium">Published</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No blog posts yet. Create your first one.
                  </td>
                </tr>
              ) : (
                posts.map((p) => (
                  <tr key={p._id} className="transition hover:bg-zinc-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt={p.title} className="h-10 w-10 rounded-lg border border-zinc-200 object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400">
                            <FiFileText size={16} />
                          </div>
                        )}
                        <span className="font-medium text-zinc-900">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600">{typeof p.blog === 'object' ? p.blog.name : '—'}</td>
                    <td className="px-6 py-4 text-zinc-600">{p.author || '—'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={p.visibility === 'visible' ? 'active' : 'inactive'} label={p.visibility} />
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/blogs/edit/${p._id}`} className="rounded-lg p-2 text-zinc-500 transition hover:bg-blue-50 hover:text-primary">
                          <FiEdit2 size={16} />
                        </Link>
                        <button onClick={() => handleDelete(p)} className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-600">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
      </div>
    </div>
  );
}
