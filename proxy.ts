import { NextRequest, NextResponse } from 'next/server';

const publicRoutes = ['/login', '/signup', '/share'];
const authRoutes = ['/api/auth'];

export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Skip proxy for auth routes and static files
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for NextAuth session token
  const hasSessionToken = 
    req.cookies.has('next-auth.session-token') ||
    req.cookies.has('__Secure-next-auth.session-token');

  // Redirect to login if no session
  if (!hasSessionToken) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};