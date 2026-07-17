import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const TOKEN_KEY = 'adminToken';

/**
 * Verify the admin JWT cookie server-side (signature + expiry + type claim).
 * Runs before ANY page is rendered — without a valid admin token, no
 * /dashboard route is ever served.
 */
async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('proxy: JWT_SECRET is not set — blocking dashboard access');
    return false;
  }
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload.type === 'admin';
  } catch {
    return false; // invalid signature, expired, or malformed
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_KEY)?.value;
  const isAuthed = await verifyAdminToken(token);

  // Protect every dashboard route.
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthed) {
      const loginUrl = new URL('/', request.url);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(TOKEN_KEY); // drop stale/forged cookie
      return res;
    }
    return NextResponse.next();
  }

  // Already logged in? Skip the login page.
  if (pathname === '/' && isAuthed) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
};
