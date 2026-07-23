'use client';

import { useEffect, useState } from 'react';
import { FiSave, FiUser, FiLock } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';
import type { AdminUser } from '@/lib/types';

const inputCls =
  'w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:bg-zinc-50 disabled:text-zinc-400';
const labelCls = 'mb-1.5 block text-sm font-medium text-zinc-700';
const cardCls = 'rounded-xl border border-zinc-200 bg-white p-6 shadow-sm';

export default function ProfilePage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [fullName, setFullName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    api.get<{ admin: AdminUser }>('/admin/me').then((data) => {
      setAdmin(data.admin);
      setFullName(data.admin.fullName);
    });
  }, []);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toastError('Full name is required');
      return;
    }
    setSavingName(true);
    try {
      await api.patch('/admin/me', { fullName: fullName.trim() });
      toastSuccess('Profile updated');
      window.location.reload();
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setSavingName(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toastError('Fill in your current and new password');
      return;
    }
    if (newPassword.length < 6) {
      toastError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('New password and confirmation do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await api.patch('/admin/me', { currentPassword, newPassword });
      toastSuccess('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setSavingPassword(false);
    }
  };

  if (!admin) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">My Profile</h1>
        <p className="mt-1 text-sm text-zinc-500">Update your name and password. Contact the super admin to change your role or access.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleNameSubmit} className={cardCls}>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900">
            <FiUser size={18} /> Account Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input value={admin.email} disabled className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Role</label>
              <input value={admin.role.replace('_', ' ')} disabled className={`${inputCls} capitalize`} />
            </div>
            <button
              type="submit"
              disabled={savingName}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-70"
            >
              <FiSave size={16} /> {savingName ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <form onSubmit={handlePasswordSubmit} className={cardCls}>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900">
            <FiLock size={18} /> Change Password
          </h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputCls}
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className={labelCls}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputCls}
              />
            </div>
            <button
              type="submit"
              disabled={savingPassword}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-70"
            >
              <FiSave size={16} /> {savingPassword ? 'Saving...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
