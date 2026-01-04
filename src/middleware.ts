import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // CLIENT role - restrict to portal only
    if (token?.role === "CLIENT") {
      if (path.startsWith("/portal") || path.startsWith("/api") || path === "/login" || path.startsWith("/auth")) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/portal", req.url));
    }

    // SPECIALIST role - no access to team management or settings (except account)
    if (token?.role === "SPECIALIST") {
      if (path.startsWith("/team") || (path.startsWith("/settings") && !path.startsWith("/settings/account"))) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // MANAGER role - no access to team management
    if (token?.role === "MANAGER") {
      if (path.startsWith("/team")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Non-clients trying to access portal - redirect to dashboard
    if (path.startsWith("/portal") && token?.role !== "CLIENT") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path === "/login" || path.startsWith("/auth")) return true;
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
