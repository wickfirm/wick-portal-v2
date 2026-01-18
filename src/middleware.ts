import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  function middleware(req: NextRequest) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const hostname = req.headers.get('host') || '';
    const subdomain = getSubdomain(hostname);

    // No subdomain = main site (marketing, super admin, etc.)
    if (!subdomain) {
      // Allow access to marketing pages, login, etc.
      if (path === '/' || path === '/login' || path.startsWith('/api/auth') || path.startsWith('/setup')) {
        return NextResponse.next();
      }
      
      // Redirect to main site if no subdomain
      return NextResponse.redirect(new URL('/', req.url));
    }

    // ON A SUBDOMAIN - this is a tenant portal
    
    // Public routes on tenant subdomain
    if (path === '/' || path === '/login') {
      return NextResponse.next();
    }

    // API routes need tenant context
    if (path.startsWith('/api')) {
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
        
        // Allow public paths
        if (path === '/' || path === '/login' || path.startsWith('/api/auth') || path.startsWith('/setup')) {
          return true;
        }
        
        // Require authentication for all other routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
