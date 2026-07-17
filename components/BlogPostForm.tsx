'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiSave, FiArrowLeft, FiPlus, FiX } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';
import RichTextEditor from '@/components/RichTextEditor';
import ImageUploader from '@/components/ImageUploader';
import type { Blog, BlogPost, AdminUser } from '@/lib/types';

const inputCls =
  'w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';
const labelCls = 'mb-1.5 block text-sm font-medium text-zinc-700';
const cardCls = 'rounded-xl border border-zinc-200 bg-white p-6 shadow-sm';

export default function BlogPostForm({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const isEdit = !!post;

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<string[]>(post?.image ? [post.image] : []);
  const [content, setContent] = useState(post?.content || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [tags, setTags] = useState<string[]>(post?.tags || []);
  const [tagInput, setTagInput] = useState('');

  const [form, setForm] = useState({
    title: post?.title || '',
    blog: typeof post?.blog === 'object' ? post.blog._id : (post?.blog as string) || '',
    author: post?.author || '',
    seoTitle: post?.seoTitle || '',
    seoDescription: post?.seoDescription || '',
    visibility: post?.visibility || ('visible' as 'visible' | 'hidden'),
  });

  useEffect(() => {
    api.get<{ blogs: Blog[] }>('/blogs?all=true').then((d) => {
      setBlogs(d.blogs);
      if (!isEdit && d.blogs.length > 0) setForm((f) => (f.blog ? f : { ...f, blog: d.blogs[0]._id }));
    }).catch(() => {});
    if (!isEdit) {
      api.get<{ admin: AdminUser }>('/admin/me').then((d) => setForm((f) => ({ ...f, author: f.author || d.admin.fullName }))).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !content.trim() || !form.blog) {
      toastError('Title, content and blog section are required');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, content, excerpt, tags, image: image[0] || '' };
      if (isEdit) {
        await api.patch(`/blog-posts/${post!._id}`, payload);
        toastSuccess('Blog post updated');
      } else {
        await api.post('/blog-posts', payload);
        toastSuccess('Blog post created');
      }
      router.push('/dashboard/blogs');
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
          <Link href="/dashboard/blogs" className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-100">
            <FiArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{isEdit ? 'Edit Blog Post' : 'Add Blog Post'}</h1>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-70"
        >
          <FiSave size={16} /> {saving ? 'Saving...' : isEdit ? 'Update Post' : 'Create Post'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className={cardCls}>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputCls}
                  required
                  placeholder="e.g., Blog about your latest products or deals"
                />
              </div>
              <div>
                <label className={labelCls}>Content *</label>
                <RichTextEditor value={content} onChange={setContent} placeholder="Write your post..." height={360} />
              </div>
            </div>
          </div>

          <div className={cardCls}>
            <h2 className="mb-1 text-lg font-semibold text-zinc-900">Excerpt</h2>
            <p className="mb-3 text-xs text-zinc-400">Add a summary of the post to appear on your home page or blog.</p>
            <RichTextEditor value={excerpt} onChange={setExcerpt} placeholder="Short summary..." height={160} />
          </div>

          <div className={cardCls}>
            <h2 className="mb-1 text-lg font-semibold text-zinc-900">Search Engine Listing</h2>
            <p className="mb-4 text-xs text-zinc-400">Add a title and description to see how this post might appear in a search engine listing</p>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Page Title</label>
                <input
                  value={form.seoTitle}
                  onChange={(e) => setForm({ ...form, seoTitle: e.target.value.slice(0, 70) })}
                  className={inputCls}
                  placeholder={form.title || 'Post title'}
                  maxLength={70}
                />
                <p className="mt-1 text-xs text-zinc-400">{form.seoTitle.length} of 70 characters used</p>
              </div>
              <div>
                <label className={labelCls}>Meta Description</label>
                <textarea
                  value={form.seoDescription}
                  onChange={(e) => setForm({ ...form, seoDescription: e.target.value.slice(0, 160) })}
                  className={`${inputCls} min-h-20`}
                  maxLength={160}
                />
                <p className="mt-1 text-xs text-zinc-400">{form.seoDescription.length} of 160 characters used</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={cardCls}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Visibility</h2>
            <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value as 'visible' | 'hidden' })} className={inputCls}>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          <div className={cardCls}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Image</h2>
            <ImageUploader value={image} onChange={setImage} max={1} />
          </div>

          <div className={cardCls}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Organization</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Author</label>
                <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className={inputCls} placeholder="Author name" />
              </div>
              <div>
                <label className={labelCls}>Blog *</label>
                <select value={form.blog} onChange={(e) => setForm({ ...form, blog: e.target.value })} className={inputCls} required>
                  <option value="">Select blog section</option>
                  {blogs.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
                {blogs.length === 0 && (
                  <p className="mt-1 text-xs text-zinc-400">
                    No sections yet —{' '}
                    <Link href="/dashboard/blogs/sections" className="font-medium text-primary hover:underline">
                      create one first
                    </Link>
                    .
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>Tags</label>
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className={inputCls}
                    placeholder="Type & press Enter"
                  />
                  <button type="button" onClick={addTag} className="shrink-0 rounded-xl border border-zinc-200 px-3 text-zinc-600 transition hover:bg-zinc-100">
                    <FiPlus size={16} />
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                        {t}
                        <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="text-zinc-400 hover:text-red-500">
                          <FiX size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
