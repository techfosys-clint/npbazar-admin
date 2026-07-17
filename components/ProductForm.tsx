'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiTrash2, FiX, FiSave, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';
import api from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';
import RichTextEditor from '@/components/RichTextEditor';
import ImageUploader from '@/components/ImageUploader';
import SearchMultiSelect, { type PickerOption } from '@/components/SearchMultiSelect';
import type { Product, Brand, Variant, Collection } from '@/lib/types';

const inputCls =
  'w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';
const labelCls = 'mb-1.5 block text-sm font-medium text-zinc-700';
const cardCls = 'rounded-xl border border-zinc-200 bg-white p-6 shadow-sm';

interface Props {
  /** Existing product when editing; undefined when creating. */
  product?: Product;
}

export default function ProductForm({ product }: Props) {
  const router = useRouter();
  const isEdit = !!product;

  const [brands, setBrands] = useState<Brand[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: product?.name || '',
    shortDescription: product?.shortDescription || '',
    description: product?.description || '',
    price: product?.price ?? '',
    comparePrice: product?.comparePrice || '',
    costPrice: product?.costPrice || '',
    sku: product?.sku || '',
    stock: product?.stock ?? '',
    brand: typeof product?.brand === 'object' && product?.brand ? product.brand._id : (product?.brand as string) || '',
    isFeatured: product?.isFeatured || false,
    isBestSelling: product?.isBestSelling || false,
    isActive: product?.isActive ?? true,
    seoTitle: product?.seoTitle || '',
    seoDescription: product?.seoDescription || '',
  });
  const [thumbnail, setThumbnail] = useState<string[]>(product?.thumbnail ? [product.thumbnail] : []);
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [tags, setTags] = useState<string[]>(product?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [collections, setCollections] = useState<PickerOption[]>(
    (product?.collections || [])
      .filter((c): c is { _id: string; name: string; slug: string } => typeof c === 'object')
      .map((c) => ({ _id: c._id, label: c.name }))
  );
  const [variants, setVariants] = useState<Variant[]>(
    (product?.variants || []).map((v) => ({
      name: v.name,
      options: (v.options || []).map((o) =>
        typeof o === 'string' ? { value: o, price: null, images: [] } : { value: o.value, price: o.price ?? null, images: o.images || [] }
      ),
    }))
  );

  useEffect(() => {
    api.get<{ brands: Brand[] }>('/brands?all=true').then((d) => setBrands(d.brands)).catch(() => {});
  }, []);

  const set = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const searchCollections = async (q: string): Promise<PickerOption[]> => {
    const d = await api.get<{ collections: Collection[] }>(`/collections?all=true${q ? `&search=${encodeURIComponent(q)}` : ''}`);
    return d.collections.map((c) => ({ _id: c._id, label: c.name, sublabel: c.type === 'smart' ? 'smart' : undefined }));
  };

  const slugPreview = (form.name || 'product-name')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-');

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  // --- variant helpers ---
  const updateVariant = (i: number, patch: Partial<Variant>) => {
    setVariants((vs) => vs.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  };
  const updateOption = (vi: number, oi: number, patch: Partial<Variant['options'][number]>) => {
    setVariants((vs) =>
      vs.map((v, idx) =>
        idx === vi ? { ...v, options: v.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) } : v
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || collections.length === 0 || form.price === '') {
      toastError('Name, at least one collection, and price are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        comparePrice: Number(form.comparePrice) || 0,
        costPrice: Number(form.costPrice) || 0,
        stock: form.stock === '' ? null : Number(form.stock),
        brand: form.brand || null,
        thumbnail: thumbnail[0] || '',
        images,
        tags,
        collections: collections.map((c) => c._id),
        variants: variants
          .filter((v) => v.name.trim() && v.options.some((o) => o.value.trim()))
          .map((v) => ({
            name: v.name.trim(),
            options: v.options
              .filter((o) => o.value.trim())
              .map((o) => ({
                value: o.value.trim(),
                price: o.price ? Number(o.price) : null,
                images: o.images || [],
              })),
          })),
      };
      if (isEdit) {
        await api.patch(`/products/${product!._id}`, payload);
        toastSuccess('Product updated');
      } else {
        await api.post('/products', payload);
        toastSuccess('Product created');
      }
      router.push('/dashboard/products');
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/products"
            className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-100"
          >
            <FiArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {isEdit ? `Edit: ${product!.name}` : 'Add Product'}
          </h1>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98] disabled:opacity-70"
        >
          <FiSave size={16} />
          {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <div className={cardCls}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Product Name *</label>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="Cotton T-Shirt" required />
              </div>
              <div>
                <label className={labelCls}>Short Description</label>
                <input
                  value={form.shortDescription}
                  onChange={(e) => set('shortDescription', e.target.value.slice(0, 200))}
                  className={inputCls}
                  placeholder="One-line summary shown in listings"
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-zinc-400">{form.shortDescription.length} of 200 characters used</p>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <RichTextEditor value={form.description} onChange={(html) => set('description', html)} placeholder="Full product description..." />
              </div>
            </div>
          </div>

          <div className={cardCls}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Pricing & Inventory</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Default Price (৳) *</label>
                <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} className={inputCls} required />
                <p className="mt-1 text-xs text-zinc-400">Used when a variant has no price of its own.</p>
              </div>
              <div>
                <label className={labelCls}>Compare-at Price (৳)</label>
                <input type="number" min="0" step="0.01" value={form.comparePrice} onChange={(e) => set('comparePrice', e.target.value)} className={inputCls} placeholder="Original price for discount display" />
              </div>
              <div>
                <label className={labelCls}>Cost / Buying Price (৳)</label>
                <input type="number" min="0" step="0.01" value={form.costPrice} onChange={(e) => set('costPrice', e.target.value)} className={inputCls} placeholder="What you paid per unit" />
                {Number(form.price) > 0 && Number(form.costPrice) > 0 && (
                  <p className={`mt-1 text-xs font-medium ${Number(form.price) - Number(form.costPrice) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    Profit per unit: ৳{(Number(form.price) - Number(form.costPrice)).toLocaleString()} (
                    {Math.round(((Number(form.price) - Number(form.costPrice)) / Number(form.price)) * 100)}% margin)
                  </p>
                )}
                <p className="mt-1 text-xs text-zinc-400">Admin-only — never shown to customers. Used for profit reports.</p>
              </div>
              <div>
                <label className={labelCls}>SKU</label>
                <input value={form.sku} onChange={(e) => set('sku', e.target.value)} className={inputCls} placeholder="Leave blank to auto-generate" />
              </div>
              <div>
                <label className={labelCls}>Stock</label>
                <input type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} className={inputCls} placeholder="Leave blank for unlimited stock" />
                <p className="mt-1 text-xs text-zinc-400">Blank = unlimited stock (never runs out, not tracked).</p>
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className={`${cardCls} relative overflow-hidden`}>
            {/* Subtle background glow effect for premium feel */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-[80px]" />
            
            <div className="relative mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-zinc-100 pb-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900">Product Variants</h2>
                <p className="mt-1.5 text-sm text-zinc-500 max-w-md leading-relaxed">
                  Offer variations of this product like different sizes, colors, or materials. Each variant option can have its own specific price and images.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVariants([...variants, { name: '', options: [{ value: '', price: null, images: [] }] }])}
                className="group flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] sm:shrink-0"
              >
                <FiPlus size={18} className="transition-transform group-hover:rotate-90" />
                <span>Add Variant Type</span>
              </button>
            </div>

            <div className="relative space-y-6">
              {variants.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 py-12 text-center transition-all hover:border-zinc-300 hover:bg-zinc-50">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200 text-zinc-400">
                    <FiPlus size={28} />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900">No variants added</h3>
                  <p className="mt-2 max-w-sm text-sm text-zinc-500">
                    Does this product come in different variations? Click the button above to start adding options.
                  </p>
                </div>
              )}
              {variants.map((v, vi) => (
                <div key={vi} className="group/group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all focus-within:border-zinc-300 focus-within:ring-4 focus-within:ring-zinc-900/5 hover:border-zinc-300">
                  {/* Group Header */}
                  <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 p-4 transition-colors group-hover/group:bg-zinc-100/50">
                    <div className="flex flex-1 items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-zinc-200 text-sm font-bold text-zinc-700">
                        {vi + 1}
                      </div>
                      <div className="relative w-full max-w-[280px]">
                        <input
                          value={v.name}
                          onChange={(e) => updateVariant(vi, { name: e.target.value })}
                          className="peer w-full bg-transparent px-3 py-2 text-base font-bold text-zinc-900 placeholder-transparent outline-none transition-all focus:border-b-2 focus:border-zinc-900"
                          placeholder="e.g. Size, Color, Material"
                        />
                        <label className="pointer-events-none absolute -top-1 left-3 text-xs font-semibold text-zinc-500 transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:text-zinc-400 peer-focus:-top-1 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-zinc-900">
                          Variant Name
                        </label>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVariants(variants.filter((_, idx) => idx !== vi))}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition-all hover:bg-red-50 hover:text-red-600 hover:shadow-sm"
                      title="Remove variant type"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>

                  {/* Options List Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50/80 text-xs font-bold uppercase tracking-wider text-zinc-500 border-y border-zinc-100">
                        <tr>
                          <th className="px-5 py-4 min-w-[200px]">Option Value *</th>
                          <th className="px-5 py-4 min-w-[180px]">Additional Price (৳)</th>
                          <th className="px-5 py-4 min-w-[140px]">Image (1)</th>
                          <th className="px-5 py-4 w-16 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white">
                        {v.options.map((o, oi) => (
                          <tr key={oi} className="group/row transition-colors hover:bg-zinc-50/30">
                            <td className="px-5 py-4 align-middle">
                              <input
                                value={o.value}
                                onChange={(e) => updateOption(vi, oi, { value: e.target.value })}
                                className={`${inputCls} bg-white shadow-sm`}
                                placeholder="e.g. Small, Red..."
                              />
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={o.price ?? ''}
                                onChange={(e) => updateOption(vi, oi, { price: e.target.value === '' ? null : Number(e.target.value) })}
                                className={`${inputCls} bg-white shadow-sm`}
                                placeholder={`Default: ৳${form.price || 0}`}
                              />
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <div className="flex rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-2 transition-colors group-hover/row:border-zinc-300">
                                <ImageUploader
                                  value={o.images || []}
                                  onChange={(urls) => updateOption(vi, oi, { images: urls })}
                                  max={1}
                                  compact
                                />
                              </div>
                            </td>
                            <td className="px-5 py-4 align-middle text-right">
                              <button
                                type="button"
                                onClick={() => updateVariant(vi, { options: v.options.filter((_, j) => j !== oi) })}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition-all hover:bg-red-50 hover:text-red-600 hover:shadow-sm opacity-0 group-hover/row:opacity-100 focus:opacity-100"
                                title="Remove option"
                              >
                                <FiTrash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Add New Row Button */}
                  <div className="border-t border-zinc-100 bg-zinc-50/50 p-4">
                    <button
                      type="button"
                      onClick={() => updateVariant(vi, { options: [...v.options, { value: '', price: null, images: [] }] })}
                      className="group/add flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 bg-white py-3 text-sm font-bold text-zinc-500 shadow-sm transition-all hover:border-zinc-400 hover:text-zinc-900"
                    >
                      <FiPlus size={18} className="transition-transform group-hover/add:scale-110" />
                      <span>Add New Option</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className={cardCls}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Organization</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Brand</label>
                <select value={form.brand} onChange={(e) => set('brand', e.target.value)} className={inputCls}>
                  <option value="">No brand</option>
                  {brands.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <SearchMultiSelect
                label="Collections * (also acts as category — select one or more)"
                placeholder="Search collections to add this product to..."
                selected={collections}
                onChange={setCollections}
                fetchOptions={searchCollections}
              />
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

          <div className={cardCls}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Media</h2>
            <div className="space-y-5">
              <ImageUploader value={thumbnail} onChange={setThumbnail} max={1} label="Thumbnail (main image)" />
              <ImageUploader value={images} onChange={setImages} max={3} label="Gallery Images (up to 3)" />
            </div>
          </div>

          <div className={cardCls}>
            <h2 className="mb-1 text-lg font-semibold text-zinc-900">Search Engine Listing</h2>
            <p className="mb-4 text-xs text-zinc-400">Add a title and description to see how this product might appear in a search engine listing</p>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Page Title</label>
                <input
                  value={form.seoTitle}
                  onChange={(e) => set('seoTitle', e.target.value.slice(0, 70))}
                  className={inputCls}
                  placeholder={form.name || 'Product title'}
                  maxLength={70}
                />
                <p className="mt-1 text-xs text-zinc-400">{form.seoTitle.length} of 70 characters used</p>
              </div>
              <div>
                <label className={labelCls}>Meta Description</label>
                <textarea
                  value={form.seoDescription}
                  onChange={(e) => set('seoDescription', e.target.value.slice(0, 160))}
                  className={`${inputCls} min-h-20`}
                  placeholder={form.shortDescription || 'Brief summary for search results'}
                  maxLength={160}
                />
                <p className="mt-1 text-xs text-zinc-400">{form.seoDescription.length} of 160 characters used</p>
              </div>
              <div>
                <label className={labelCls}>URL Handle</label>
                <p className="truncate rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-500">
                  /products/<span className="font-medium text-zinc-700">{isEdit ? product!.slug : slugPreview}</span>
                </p>
                <p className="mt-1 text-xs text-zinc-400">Generated automatically from the product name.</p>
              </div>
            </div>
          </div>

          <div className={cardCls}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Status</h2>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-between">
                <span className="text-sm font-medium text-zinc-700">Active (visible in store)</span>
                <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="h-5 w-5 accent-primary" />
              </label>
              <label className="flex cursor-pointer items-center justify-between">
                <span className="text-sm font-medium text-zinc-700">Featured product</span>
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="h-5 w-5 accent-primary" />
              </label>
              <label className="flex cursor-pointer items-center justify-between">
                <span className="text-sm font-medium text-zinc-700">
                  Best selling product
                  <span className="block text-xs font-normal text-zinc-400">Shows in the storefront Best Selling section</span>
                </span>
                <input type="checkbox" checked={form.isBestSelling} onChange={(e) => set('isBestSelling', e.target.checked)} className="h-5 w-5 accent-accent" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
