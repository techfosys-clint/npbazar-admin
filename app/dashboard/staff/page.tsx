'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit2, FiTrash2, FiLock, FiMail } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError, confirmDialog } from '@/lib/toast';
import StatusBadge from '@/components/StatusBadge';
import type { AdminUser } from '@/lib/types';

export default function StaffPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [me, setMe] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [a, m] = await Promise.all([
        api.get<{ admins: AdminUser[] }>('/admin'),
        api.get<{ admin: AdminUser }>('/admin/me'),
      ]);
      setAdmins(a.admins);
      setMe(m.admin);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDelete = async (a: AdminUser) => {
    if (!(await confirmDialog(`Delete "${a.fullName}"?`, 'Their access will be permanently removed.'))) return;
    try {
      await api.del(`/admin/${a.id}`);
      toastSuccess('Account deleted');
      fetchAll();
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  const permissionLabel = (a: AdminUser) => {
    if (a.permissions.includes('*')) return 'All pages';
    if (a.permissions.length === 0) return 'No access';
    return `${a.permissions.length} page${a.permissions.length > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Staff & Admins</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage panel access. New accounts get their credentials by email automatically.
          </p>
        </div>
        <Link
          href="/dashboard/staff/new"
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98]"
        >
          <FiPlus size={16} /> Add Member
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-6 py-3 font-medium">Member</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Page Access</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Joined</th>
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
              ) : (
                admins.map((a) => (
                  <tr key={a.id} className="transition hover:bg-zinc-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                          {a.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="flex items-center gap-1.5 font-medium text-zinc-900">
                            {a.fullName}
                            {a.isSuperAdmin && <FiLock size={12} className="text-purple-500" title="Protected account" />}
                            {me?.id === a.id && <span className="text-xs text-zinc-400">(you)</span>}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-zinc-500">
                            <FiMail size={11} /> {a.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={a.role} /></td>
                    <td className="px-6 py-4 text-zinc-600">{permissionLabel(a)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={a.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {a.isSuperAdmin ? (
                          <span className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-400">Protected</span>
                        ) : (
                          <>
                            <Link href={`/dashboard/staff/edit/${a.id}`} className="rounded-lg p-2 text-zinc-500 transition hover:bg-blue-50 hover:text-blue-600">
                              <FiEdit2 size={16} />
                            </Link>
                            <button onClick={() => handleDelete(a)} className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-600">
                              <FiTrash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
