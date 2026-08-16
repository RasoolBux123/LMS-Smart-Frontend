import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const roleRoutes: Record<string, string> = {
  admin: "/admin",
  instructor: "/instructor",
  student: "/student",
};

export function middleware(request: NextRequest) {
  const role = request.cookies.get("role")?.value;
  const token = request.cookies.get("token")?.value;
  const path = request.nextUrl.pathname;

  const isProtected =
    path.startsWith("/admin") ||
    path.startsWith("/instructor") ||
    path.startsWith("/student") ||
    path.startsWith("/notifications") ||
    path.startsWith("/profile") ||
    path.startsWith("/settings");

  // Protected routes require BOTH token and role cookies
  if (isProtected && (!token || !role)) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.set("role", "", { path: "/", maxAge: 0 });
    res.cookies.set("token", "", { path: "/", maxAge: 0 });
    return res;
  }

  // Role can only access its own portal
  if (
    token &&
    role &&
    (path.startsWith("/admin") ||
      path.startsWith("/instructor") ||
      path.startsWith("/student"))
  ) {
    const allowedBase = roleRoutes[role];
    if (allowedBase && !path.startsWith(allowedBase)) {
      return NextResponse.redirect(new URL(allowedBase, request.url));
    }
  }

  return NextResponse.next();
}

/**
 * Only these prefixes run through the middleware. `/verify/[serial]` is
 * deliberately absent — the QR code on a certificate has to open for someone
 * who has no SmartLMS account.
 */
export const config = {
  matcher: [
    "/admin/:path*",
    "/instructor/:path*",
    "/student/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};