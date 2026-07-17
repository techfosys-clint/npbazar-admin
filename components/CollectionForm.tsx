'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiSave, FiArrowLeft, FiPlus, FiX } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';
import RichTextEditor from '@/components/RichTextEditor';
import ImageUploader from '@/components/ImageUploader';
import SearchMultiSelect, { type PickerOption } from '@/components/SearchMultiSelect';
import type { Collection, CollectionCondition, CollectionConditionField, Brand, Product } from '@/lib/types';

const inputCls =
  'w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';
const labelCls = 'mb-1.5 block text-sm font-medium text-zinc-700';
const cardCls = 'rounded-xl border border-zinc-200 bg-white p-6 shadow-sm';

const FIELD_OPTIONS: { value: CollectionConditionField; label: string; operators: string[] }[] = [
  { value: 'price', label: 'Price', operators: ['equals', 'greater_than', 'less_than', 'not_equals'] },
  { value: 'brand', label: 'Brand', operators: ['equals', 'not_equals'] },
  { value: 'tag', label: 'Tag', operators: ['equals', 'not_equals'] },
];
const OPERATOR_LABELS: Record<string, string> = {
  equals: 'is equal to',
  not_equals: 'is not equal to',
  greater_than: 'is greater than',
  less_than: 'is less than',
  contains: 'contains',
};

export default function CollectionForm({ collection }: { collection?: Collection }) {
  const router = useRouter();
  const isEdit = !!collection;

  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<string[]>(collection?.image ? [collection.image] : []);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allCollections, setAllCollections] = useState<Collection[]>([]);

  const [form, setForm] = useState({
    name: collection?.name || '',
    description: collection?.description || '',
    parent: typeof collection?.parent === 'object' && collection?.parent ? collection.parent._id : (collection?.parent as string) || '',
    order: collection?.order != null ? String(collection.order) : '0',
    type: collection?.type || ('manual' as 'manual' | 'smart'),
    matchType: collection?.matchType || ('all' as 'all' | 'any'),
    seoTitle: collection?.seoTitle || '',
    seoDescription: collection?.seoDescription || '',
    isActive: collection?.isActive ?? true,
  });
  const [conditions, setConditions] = useState<CollectionCondition[]>(
    collection?.conditions?.length ? collection.conditions : [{ field: 'price', operator: 'greater_than', value: '' }]
  );

  // Manual-collection product management.
  const [products, setProducts] = useState<PickerOption[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(!isEdit);

  useEffect(() => {
    api.get<{ collections: Collection[] }>('/collections?all=true').then((d) => setAllCollections(d.collections)).catch(() => {});
    api.get<{ brands: Brand[] }>('/brands?all=true').then((d) => setBrands(d.brands)).catch(() => {});
    if (isEdit) {
      api
        .get<{ products: Product[] }>(`/collections/${collection!._id}/products`)
        .then((d) => {
          setProducts(d.products.map((p) => ({ _id: p._id, label: p.name })));
          setProductsLoaded(true);
        })
        .catch(() => setProductsLoaded(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchProducts = async (q: string): Promise<PickerOption[]> => {
    const d = await api.get<{ products: Product[] }>(`/products?all=true&limit=15${q ? `&search=${encodeURIComponent(q)}` : ''}`);
    return d.products.map((p) => ({ _id: p._id, label: p.name, sublabel: `৳${p.price}` }));
  };

  const updateCondition = (i: number, patch: Partial<CollectionCondition>) =>
    setConditions((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toastError('Collection name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        image: image[0] || '',
        parent: form.parent || null,
        order: Number(form.order) || 0,
        conditions: form.type === 'smart' ? conditions.filter((c) => c.value.trim()) : [],
      };

      let collectionId = collection?._id;
      if (isEdit) {
        await api.patch(`/collections/${collectionId}`, payload);
      } else {
        const res = await api.post<{ collection: Collection }>('/collections', payload);
        collectionId = res.collection._id;
      }

      // Reconcile manual product membership against what's currently saved server-side.
      if (form.type === 'manual' && collectionId) {
        const before = isEdit
          ? (await api.get<{ products: Product[] }>(`/collections/${collectionId}/products`)).products.map((p) => p._id)
          : [];
        const beforeSet = new Set(before);
        const afterSet = new Set(products.map((p) => p._id));

        const toAdd = products.filter((p) => !beforeSet.has(p._id));
        const toRemove = before.filter((id) => !afterSet.has(id));

        await Promise.all([
          ...toAdd.map((p) => api.post(`/collections/${collectionId}/products`, { productId: p._id })),
          ...toRemove.map((id) => api.del(`/collections/${collectionId}/products/${id}`)),
        ]);
      }

      toastSuccess(isEdit ? 'Collection updated' : 'Collection created');
      router.push('/dashboard/collections');
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const conditionValueInput = (c: CollectionCondition, i: number) => {
    if (c.field === 'brand') {
      return (
        <select value={c.value} onChange={(e) => updateCondition(i, { value: e.target.value })} className={inputCls}>
          <option value="">Select brand</option>
          {brands.map((b) => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </select>
      );
    }
    return (
      <input
        type={c.field === 'price' ? 'number' : 'text'}
        value={c.value}
        onChange={(e) => updateCondition(i, { value: e.target.value })}
        className={inputCls}
        placeholder={c.field === 'price' ? 'e.g. 500' : 'e.g. summer'}
      />
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/collections" className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-100">
            <FiArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{isEdit ? `Edit: ${collection!.name}` : 'Add Collection'}</h1>
        </div>
        <button
          type="submit"
          disabled={saving || !productsLoaded}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-70"
        >
          <FiSave size={16} /> {saving ? 'Saving...' : isEdit ? 'Update Collection' : 'Create Collection'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className={cardCls}>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Title *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                  required
                  placeholder="e.g., Summer collection, Under $100, Staff picks"
                />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <RichTextEditor value={form.description} onChange={(html) => setForm({ ...form, description: html })} placeholder="Describe this collection..." />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Parent Collection</label>
                  <select value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })} className={inputCls}>
                    <option value="">None (top level)</option>
                    {allCollections
                      .filter((c) => c._id !== collection?._id)
                      .map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                  </select>
                  <p className="mt-1 text-xs text-zinc-400">Optional — nest this under another collection, like a sub-category.</p>
                </div>
                <div>
                  <label className={labelCls}>Sort Order</label>
                  <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className={inputCls} />
                  <p className="mt-1 text-xs text-zinc-400">Lower numbers appear first.</p>
                </div>
              </div>
            </div>
          </div>

          <div className={cardCls}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Collection Type</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'manual' })}
                className={`rounded-xl border-2 p-4 text-left transition ${
                  form.type === 'manual' ? 'border-primary bg-primary/5' : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <p className="font-semibold text-zinc-900">Manual</p>
                <p className="mt-1 text-xs text-zinc-500">Add products to this collection one by one.</p>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'smart' })}
                className={`rounded-xl border-2 p-4 text-left transition ${
                  form.type === 'smart' ? 'border-primary bg-primary/5' : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <p className="font-semibold text-zinc-900">Smart</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Existing and future products that match your conditions are added automatically.
                </p>
              </button>
            </div>

            {form.type === 'smart' ? (
              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-600">Products must match</span>
                  <select
                    value={form.matchType}
                    onChange={(e) => setForm({ ...form, matchType: e.target.value as 'all' | 'any' })}
                    className="rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                  >
                    <option value="all">all</option>
                    <option value="any">any</option>
                  </select>
                  <span className="text-zinc-600">of the following conditions:</span>
                </div>
                {conditions.map((c, i) => {
                  const fieldDef = FIELD_OPTIONS.find((f) => f.value === c.field)!;
                  return (
                    <div key={i} className="grid grid-cols-1 gap-2 rounded-xl border border-zinc-200 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                      <select
                        value={c.field}
                        onChange={(e) => {
                          const field = e.target.value as CollectionConditionField;
                          const ops = FIELD_OPTIONS.find((f) => f.value === field)!.operators;
                          updateCondition(i, { field, operator: ops[0] as CollectionCondition['operator'], value: '' });
                        }}
                        className={inputCls}
                      >
                        {FIELD_OPTIONS.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                      <select
                        value={c.operator}
                        onChange={(e) => updateCondition(i, { operator: e.target.value as CollectionCondition['operator'] })}
                        className={inputCls}
                      >
                        {fieldDef.operators.map((op) => (
                          <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
                        ))}
                      </select>
                      {conditionValueInput(c, i)}
                      <button
                        type="button"
                        onClick={() => setConditions(conditions.filter((_, idx) => idx !== i))}
                        className="flex items-center justify-center rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setConditions([...conditions, { field: 'price', operator: 'greater_than', value: '' }])}
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-700"
                >
                  <FiPlus size={13} /> Add another condition
                </button>
              </div>
            ) : (
              <div className="mt-5">
                <label className={labelCls}>Products</label>
                {!productsLoaded ? (
                  <p className="text-sm text-zinc-400">Loading current products...</p>
                ) : (
                  <SearchMultiSelect
                    placeholder="Search products to add..."
                    selected={products}
                    onChange={setProducts}
                    fetchOptions={searchProducts}
                  />
                )}
                {productsLoaded && products.length === 0 && (
                  <p className="mt-2 text-sm text-zinc-400">No products in this collection yet — search above to add some.</p>
                )}
              </div>
            )}
          </div>

          <div className={cardCls}>
            <h2 className="mb-1 text-lg font-semibold text-zinc-900">Search Engine Listing</h2>
            <p className="mb-4 text-xs text-zinc-400">Add a title and description to see how this collection might appear in a search engine listing</p>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Page Title</label>
                <input
                  value={form.seoTitle}
                  onChange={(e) => setForm({ ...form, seoTitle: e.target.value.slice(0, 70) })}
                  className={inputCls}
                  placeholder={form.name || 'Collection title'}
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
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Image</h2>
            <ImageUploader value={image} onChange={setImage} max={1} />
          </div>

          <div className={cardCls}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Status</h2>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 px-4 py-3">
              <span className="text-sm font-medium text-zinc-700">Active (visible in store)</span>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-5 w-5 accent-primary" />
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
