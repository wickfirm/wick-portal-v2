import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Check if user is a CLIENT trying to access admin routes
    if (token?.role === "CLIENT") {
      // Allow access to portal routes
      if (path.startsWith("/portal")) {
        return NextResponse.next();
      }
      // Redirect CLIENT users to portal for other routes
      return NextResponse.redirect(new URL("/portal", req.url));
    }

    // Non-CLIENT users trying to access portal should be redirected to dashboard
    if (path.startsWith("/portal") && token?.role !== "CLIENT") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
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
    "/timesheet/:path*",
  ],
};
