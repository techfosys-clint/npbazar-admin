'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { FiEye, FiEyeOff } from 'react-icons/fi';
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
  }
});

export default function AdminAuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasSuperAdmin, setHasSuperAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const response = await fetch(`${API_BASE}/admin/check-superadmin`);
        const data = await response.json();
        if (data.success) {
          setHasSuperAdmin(data.hasSuperAdmin);
        } else {
          Toast.fire({ icon: 'error', title: 'Failed to connect to the server.' });
        }
      } catch (err) {
        Toast.fire({ icon: 'error', title: 'Network error. Is the server running?' });
      } finally {
        setIsLoading(false);
      }
    };

    checkSuperAdmin();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/admin/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });
      const data = await response.json();

      if (data.success) {
        Toast.fire({ icon: 'success', title: 'Super admin created successfully!' });
        saveSession(data.token);
        
        setTimeout(() => {
            router.push('/dashboard');
        }, 1500);
      } else {
        Toast.fire({ icon: 'error', title: data.message || 'Registration failed' });
      }
    } catch (err) {
      Toast.fire({ icon: 'error', title: 'An error occurred during registration.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (data.success) {
        Toast.fire({ icon: 'success', title: 'Logged in successfully!' });
        saveSession(data.token);
        router.push('/dashboard');
      } else {
        Toast.fire({ icon: 'error', title: data.message || 'Login failed' });
      }
    } catch (err) {
      Toast.fire({ icon: 'error', title: 'An error occurred during login.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-primary dark:border-zinc-800 dark:border-t-zinc-50"></div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Connecting to server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-zinc-50 p-4 font-sans dark:bg-zinc-950 sm:p-8">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full bg-primary/10 blur-[100px] dark:bg-blue-600/20"></div>
        <div className="absolute -bottom-[20%] -right-[10%] h-[50%] w-[50%] rounded-full bg-accent/10 blur-[100px] dark:bg-indigo-600/20"></div>
      </div>

      <main className="z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white/70 shadow-xl shadow-zinc-200/50 backdrop-blur-xl transition-all duration-300 dark:bg-zinc-900/70 dark:shadow-black/50 border border-zinc-200/50 dark:border-zinc-800/50">
        <div className="p-8 sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-white shadow-lg dark:bg-white dark:text-zinc-900">
                <RiAdminLine size={28} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {hasSuperAdmin ? 'Welcome Back' : 'Initialize Ecomus'}
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {hasSuperAdmin 
                ? 'Sign in to access the admin dashboard.' 
                : 'Create the first super admin account to get started.'}
            </p>
          </div>

          <form onSubmit={hasSuperAdmin ? handleLogin : handleRegister} className="flex flex-col gap-5">
            {!hasSuperAdmin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="fullName">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-white dark:focus:border-zinc-50 dark:focus:bg-zinc-950 dark:focus:ring-white/10"
                  placeholder="John Doe"
                />
              </div>
            )}

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

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="password">
                  Password
                </label>
                {hasSuperAdmin && (
                  <a href="#" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-3 pr-12 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-white dark:focus:border-zinc-50 dark:focus:bg-zinc-950 dark:focus:ring-white/10"
                  placeholder="••••••••"
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
                  Processing...
                </>
              ) : (
                hasSuperAdmin ? 'Sign In' : 'Create Super Admin'
              )}
            </button>
          </form>
        </div>
      </main>
      
      <p className="mt-8 text-center text-xs font-medium text-zinc-500 dark:text-zinc-500">
        Ecomus Admin Panel &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}
