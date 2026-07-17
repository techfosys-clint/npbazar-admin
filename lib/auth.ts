// Central client-side auth/session handling for the admin panel.
// The token is kept in BOTH localStorage (attached to API calls) and a cookie
// (verified server-side by proxy.ts before any /dashboard page is served).

export const TOKEN_KEY = 'adminToken';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days, matches JWT_EXPIRES_IN

export function saveSession(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}
