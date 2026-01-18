import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

function getSubdomain(hostname: string): string | null {
  const host = hostname.split(':')[0];
  
  if (host === 'localhost' || host === '127.0.0.1') {
    return process.env.DEV_TENANT_SLUG || null;
  }
  
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

    // Skip auth for NextAuth routes, static files, and public pages
    if (
      path.startsWith('/api/auth') ||
      path === '/login' ||
      path === '/reset-password' ||
      path === '/setup' ||
      path === '/'
    ) {
      return NextResponse.next();
    }

    // API routes need tenant context
    if (path.startsWith('/api') && subdomain) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-tenant-slug', subdomain);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // Check if user is a CLIENT trying to access admin routes
    if (token?.role === "CLIENT") {
      if (path.startsWith("/portal")) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/portal", req.url));
    }

    // Non-CLIENT users trying to access portal should be redirected to dashboard
    if (path.startsWith("/portal") && token?.role !== "CLIENT") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // All other authenticated routes
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Allow ALL /api/auth paths without checking token
        if (path.startsWith('/api/auth')) {
          return true;
        }
        
        // Allow public pages without token
        if (path === '/' || path === '/login' || path === '/reset-password' || path === '/setup') {
          return true;
        }
        
        // Everything else requires auth
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    // Don't run middleware on static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
