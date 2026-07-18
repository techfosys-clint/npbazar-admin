'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import { RiAdminLine } from 'react-icons/ri';
import { saveSession } from '@/lib/auth';
import { API_BASE } from '@/lib/api';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

const cardCls =
  'z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white/70 shadow-xl shadow-zinc-200/50 backdrop-blur-xl transition-all duration-300 dark:bg-zinc-900/70 dark:shadow-black/50 border border-zinc-200/50 dark:border-zinc-800/50';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!token || !email) {
    return (
      <main className={cardCls}>
        <div className="flex flex-col items-center p-8 text-center sm:p-10">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-white shadow-lg dark:bg-white dark:text-zinc-900">
            <RiAdminLine size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Invalid reset link</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">This password reset link is missing or malformed.</p>
          <Link
            href="/forgot-password"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark active:scale-[0.98] dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Request a new link
          </Link>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className={cardCls}>
        <div className="flex flex-col items-center p-8 text-center sm:p-10">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg">
            <FiCheckCircle size={26} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Password Reset!</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Your password has been changed and you&apos;re signed in.</p>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark active:scale-[0.98] dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Go to Dashboard
          </button>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      Toast.fire({ icon: 'error', title: 'Password must be at least 6 characters' });
      return;
    }
    if (password !== confirmPassword) {
      Toast.fire({ icon: 'error', title: 'Passwords do not match' });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await response.json();

      if (data.success) {
        saveSession(data.token);
        setDone(true);
      } else {
        Toast.fire({ icon: 'error', title: data.message || 'Failed to reset password' });
      }
    } catch (err) {
      Toast.fire({ icon: 'error', title: 'Network error. Is the server running?' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={cardCls}>
      <div className="p-8 sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-white shadow-lg dark:bg-white dark:text-zinc-900">
            <RiAdminLine size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Reset Password</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Choose a new password for {email}.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="password">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-3 pr-12 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-white dark:focus:border-zinc-50 dark:focus:bg-zinc-950 dark:focus:ring-white/10"
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-white dark:focus:border-zinc-50 dark:focus:bg-zinc-950 dark:focus:ring-white/10"
              placeholder="Repeat password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-70 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:hover:shadow-white/20"
          >
            {isSubmitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-25"></circle>
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75"></path>
                </svg>
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
