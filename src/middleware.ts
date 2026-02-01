import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSubdomainFromHost, canAccessSubdomain, getExpectedSubdomain } from './lib/tenant';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  
  // Get subdomain from hostname
  const hostname = request.headers.get('host') || '';
  const host = hostname.split(':')[0];
  const isLocalhost = host === 'localhost' || host === '127.0.0.1';
  const subdomain = getSubdomainFromHost(hostname);

  // Skip middleware for ALL API routes, NextAuth, static files, signout, test page, and widget
  const skipPaths = ['/api/', '/_next', '/favicon.ico', '/static', '/auth/signout', '/test', '/widget/'];
  if (skipPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get user session
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // If not authenticated, allow access to login page but nothing else
  if (!token) {
    // Allow login page on any subdomain
    if (pathname === '/login') {
      return NextResponse.next();
    }
    // For other pages, redirect to login on current subdomain
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // On localhost, skip subdomain checks — use DEV_TENANT_SLUG for tenant context
  if (isLocalhost) {
    const devSubdomain = process.env.DEV_TENANT_SLUG || 'wick';
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-subdomain', devSubdomain);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // User IS authenticated - check if they're on the correct subdomain
  const userRole = token.role as string;
  const userAgencyId = token.agencyId as string | null;

  // Check if user can access this subdomain
  const canAccess = canAccessSubdomain(subdomain, userAgencyId, userRole);

  if (!canAccess) {
    // Prevent redirect loop - if already trying to go to /dashboard, don't redirect again
    if (pathname === '/dashboard') {
      console.error('Redirect loop detected for user:', token.email, 'subdomain:', subdomain);
      // Let them through but log the issue
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-tenant-subdomain', subdomain);
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // Redirect to correct subdomain
    const expectedSubdomain = getExpectedSubdomain(userAgencyId, userRole);

    // Determine base domain
    const isProduction = hostname.includes('omnixia.ai');
    const baseDomain = isProduction ? 'omnixia.ai' : 'omnixia.vercel.app';

    // Build redirect URL to their correct subdomain
    const redirectHost = expectedSubdomain === 'dash'
      ? `dash.${baseDomain}`
      : `${expectedSubdomain}.${baseDomain}`;

    // Redirect to dashboard on correct subdomain (not login)
    const redirectUrl = new URL('/dashboard', `https://${redirectHost}`);

    return NextResponse.redirect(redirectUrl);
  }

  // Add tenant info to request headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-subdomain', subdomain);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - widget (public widget scripts)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|widget).*)',
  ],
};
