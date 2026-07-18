'use client';

import { useState } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { RiAdminLine } from 'react-icons/ri';
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

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/admin/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (data.success) {
        setSent(true);
      } else {
        Toast.fire({ icon: 'error', title: data.message || 'Failed to send reset link' });
      }
    } catch (err) {
      Toast.fire({ icon: 'error', title: 'Network error. Is the server running?' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-zinc-50 p-4 font-sans dark:bg-zinc-950 sm:p-8">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full bg-primary/10 blur-[100px] dark:bg-blue-600/20"></div>
        <div className="absolute -bottom-[20%] -right-[10%] h-[50%] w-[50%] rounded-full bg-accent/10 blur-[100px] dark:bg-indigo-600/20"></div>
      </div>

      <main className="z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white/70 shadow-xl shadow-zinc-200/50 backdrop-blur-xl transition-all duration-300 dark:bg-zinc-900/70 dark:shadow-black/50 border border-zinc-200/50 dark:border-zinc-800/50">
        <div className="p-8 sm:p-10">
          {sent ? (
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg">
                <FiMail size={26} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Check your email</h1>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                A password reset link has been sent to <span className="font-medium text-zinc-700 dark:text-zinc-300">{email}</span>. The link is valid for 30 minutes.
              </p>
              <Link
                href="/"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8 flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-white shadow-lg dark:bg-white dark:text-zinc-900">
                  <RiAdminLine size={28} />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Forgot Password</h1>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Enter your account email and we&apos;ll send you a password reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-white dark:focus:border-zinc-50 dark:focus:bg-zinc-950 dark:focus:ring-white/10"
                    placeholder="admin@example.com"
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
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>

                <Link
                  href="/"
                  className="flex items-center justify-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  <FiArrowLeft size={14} /> Back to Sign In
                </Link>
              </form>
            </>
          )}
        </div>
      </main>

      <p className="z-10 mt-8 text-center text-xs font-medium text-zinc-500 dark:text-zinc-500">
        Ecomus Admin Panel &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}
