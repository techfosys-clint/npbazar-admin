'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';
import type { AdminUser, PageDef } from '@/lib/types';

const inputCls =
  'w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';
const labelCls = 'mb-1.5 block text-sm font-medium text-zinc-700';
const cardCls = 'rounded-xl border border-zinc-200 bg-white p-6 shadow-sm';

export default function StaffForm({ member }: { member?: AdminUser }) {
  const router = useRouter();
  const isEdit = !!member;

  const [pages, setPages] = useState<PageDef[]>([]);
  const [me, setMe] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullName: member?.fullName || '',
    email: member?.email || '',
    role: (member?.role === 'admin' ? 'admin' : 'staff') as 'admin' | 'staff',
    permissions: (member?.permissions || []).filter((p) => p !== '*'),
    isActive: member?.isActive ?? true,
  });

  useEffect(() => {
    api.get<{ pages: PageDef[] }>('/admin/pages').then((d) => setPages(d.pages)).catch(() => {});
    api.get<{ admin: AdminUser }>('/admin/me').then((d) => setMe(d.admin)).catch(() => {});
  }, []);

  const togglePermission = (key: string) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key],
    }));
  };

  const selectAll = () => setForm((f) => ({ ...f, permissions: pages.map((p) => p.key) }));
  const clearAll = () => setForm((f) => ({ ...f, permissions: [] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/admin/${member!.id}`, {
          permissions: form.permissions,
          role: form.role,
          isActive: form.isActive,
        });
        toastSuccess('Account updated');
        router.push('/dashboard/staff');
      } else {
        const res = await api.post<{ emailSent: boolean; emailError?: string }>('/admin/create', {
          fullName: form.fullName,
          email: form.email,
          role: form.role,
          permissions: form.permissions,
        });
        if (res.emailSent) {
          await Swal.fire({
            icon: 'success',
            title: 'Account created!',
            text: `Login credentials have been emailed to ${form.email}.`,
            confirmButtonColor: '#18181b',
          });
        } else {
          await Swal.fire({
            icon: 'warning',
            title: 'Account created, but email failed',
            text: `The credentials email could not be sent (${res.emailError || 'SMTP not configured'}). Check the SMTP settings in the server .env.`,
            confirmButtonColor: '#18181b',
          });
        }
        router.push('/dashboard/staff');
      }
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
          <Link href="/dashboard/staff" className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-100">
            <FiArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {isEdit ? `Edit: ${member!.fullName}` : 'Add Staff / Admin'}
          </h1>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-70"
        >
          <FiSave size={16} /> {saving ? 'Saving...' : isEdit ? 'Update Account' : 'Create & Email Credentials'}
        </button>
      </div>

      <div className={cardCls}>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Account Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Full Name *</label>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className={inputCls}
              required
              placeholder="Rakib Hasan"
              disabled={isEdit}
            />
          </div>
          <div>
            <label className={labelCls}>Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputCls}
              required
              placeholder="rakib@shop.com"
              disabled={isEdit}
            />
          </div>
          <div>
            <label className={labelCls}>Role *</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'staff' })}
              className={inputCls}
            >
              <option value="staff">Staff</option>
              {me?.isSuperAdmin && <option value="admin">Admin</option>}
            </select>
            {!me?.isSuperAdmin && (
              <p className="mt-1 text-xs text-zinc-400">Only the super admin can create admin accounts.</p>
            )}
          </div>
          {isEdit && (
            <div className="flex items-end">
              <label className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-zinc-200 px-4 py-2.5">
                <span className="text-sm font-medium text-zinc-700">Account Active</span>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-5 w-5 accent-primary"
                />
              </label>
            </div>
          )}
        </div>
        {!isEdit && (
          <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-700">
            A secure password will be generated automatically and emailed to this address along with the admin portal link.
          </p>
        )}
      </div>

      <div className={cardCls}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Page Access</h2>
          <div className="flex gap-2 text-xs">
            <button type="button" onClick={selectAll} className="rounded-lg border border-zinc-200 px-3 py-1.5 font-medium text-zinc-600 transition hover:bg-zinc-100">
              Select all
            </button>
            <button type="button" onClick={clearAll} className="rounded-lg border border-zinc-200 px-3 py-1.5 font-medium text-zinc-600 transition hover:bg-zinc-100">
              Clear
            </button>
          </div>
        </div>
        <p className="mb-4 text-xs text-zinc-400">
          The member will only see (and be able to use) the pages selected below — enforced both in the sidebar and by the API.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {pages.map((p) => (
            <label
              key={p.key}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                form.permissions.includes(p.key)
                  ? 'border-primary bg-primary text-white'
                  : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
              }`}
            >
              <input
                type="checkbox"
                checked={form.permissions.includes(p.key)}
                onChange={() => togglePermission(p.key)}
                className="hidden"
              />
              {p.label}
            </label>
          ))}
        </div>
      </div>
    </form>
  );
}
