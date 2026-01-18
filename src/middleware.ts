import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Allow public paths without authentication
        if (
          path === '/' ||
          path === '/login' ||
          path === '/reset-password' ||
          path === '/setup' ||
          path.startsWith('/api/auth')
        ) {
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
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
