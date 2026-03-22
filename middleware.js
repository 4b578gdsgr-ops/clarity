import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Login page itself is always allowed
  if (pathname === '/admin/login') return NextResponse.next();

  try {
    const pw = process.env.ADMIN_PASSWORD;
    console.log('[middleware] admin check — path:', pathname, '| ADMIN_PASSWORD set:', !!pw);

    if (!pw) {
      console.log('[middleware] ADMIN_PASSWORD not set — blocking access');
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const token = request.cookies.get('ol_admin')?.value;
    const expected = btoa(pw);
    console.log('[middleware] token present:', !!token, '| match:', token === expected);

    if (token !== expected) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  } catch (err) {
    console.error('[middleware] error — blocking access:', err?.message);
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
