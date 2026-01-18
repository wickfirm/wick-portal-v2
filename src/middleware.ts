import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

function getSubdomain(hostname: string): string | null {
  const host = hostname.split(':')[0];
  
  // Local development - use env variable
  if (host === 'localhost' || host === '127.0.0.1') {
    return process.env.DEV_TENANT_SLUG || null;
  }
  
  // Extract subdomain from hostname (e.g., "wick" from "wick.omnixia.com")
  const parts = host.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }
  
  return null;
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const hostname = req.headers.get('host') || '';
    const subdomain = getSubdomain(hostname);

    // Public routes - no processing needed
    if (
      path.startsWith('/api/auth') ||
      path === '/api/reset-password' ||
      path === '/login' ||
      path === '/reset-password' ||
      path === '/setup' ||
      path === '/'
    ) {
      return NextResponse.next();
    }

    // Add tenant context to API routes
    if (path.startsWith('/api') && subdomain) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-tenant-slug', subdomain);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // Role-based routing: CLIENT users → /portal
    if (token?.role === "CLIENT") {
      if (path.startsWith("/portal")) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/portal", req.url));
    }

    // Non-CLIENT users trying to access /portal → /dashboard
    if (path.startsWith("/portal") && token?.role !== "CLIENT") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // All other routes - allow if authenticated
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Public routes - no auth required
        if (
          path.startsWith('/api/auth') ||
          path === '/api/reset-password' ||
          path === '/' ||
          path === '/login' ||
          path === '/reset-password' ||
          path === '/setup'
        ) {
          return true;
        }
        
        // Everything else requires authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    // Run middleware on all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
