import { getToken, clearSession } from '@/lib/auth';

// The API base URL must come from the environment (.env.local) — never hardcode it here.
if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set. Add it to .env.local (see .env.example).');
}
export const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/* eslint-disable @typescript-eslint/no-explicit-any */
async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  // Session expired / invalid token -> wipe session (localStorage + cookie), back to login
  if (res.status === 401 && typeof window !== 'undefined') {
    clearSession();
    window.location.href = '/';
    throw new Error(data.message || 'Session expired');
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'Request failed');
  }
  return data as T;
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),
  post: <T = any>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T = any>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  del: <T = any>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export default api;
