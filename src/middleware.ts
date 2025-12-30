import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // If user is CLIENT role
    if (token?.role === "CLIENT") {
      // Allow access to portal routes
      if (path.startsWith("/portal") || path.startsWith("/api") || path === "/login") {
        return NextResponse.next();
      }
      // Redirect CLIENT users away from admin routes to portal
      return NextResponse.redirect(new URL("/portal", req.url));
    }

    // If user is ADMIN/MANAGER/SPECIALIST trying to access portal, redirect to dashboard
    if (path.startsWith("/portal") && token?.role !== "CLIENT") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Allow login page without auth
        if (path === "/login") return true;
        // Require auth for everything else
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/projects/:path*",
    "/team/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/portal/:path*",
  ],
};
