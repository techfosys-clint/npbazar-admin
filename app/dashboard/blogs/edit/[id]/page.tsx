'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BlogPostForm from '@/components/BlogPostForm';
import api from '@/lib/api';
import { toastError } from '@/lib/toast';
import type { BlogPost } from '@/lib/types';

export default function EditBlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ posts: BlogPost[] }>('/blog-posts?all=true&limit=100')
      .then((d) => setPost(d.posts.find((p) => p._id === id) || null))
      .catch((err) => toastError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
      </div>
    );
  }

  if (!post) return <p className="text-center text-zinc-500">Blog post not found.</p>;

  return <BlogPostForm post={post} />;
}
