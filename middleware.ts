import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";

/**
 * Middleware — proteksi semua route /admin/* dan /api/admin/*
 * Login page (/admin/login) dan auth endpoint (/api/admin/auth) dikecualikan.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Kecualikan login page dan auth endpoint dari proteksi
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/admin/auth")
  ) {
    return NextResponse.next();
  }

  // Proteksi halaman admin (redirect ke login jika tidak auth)
  if (pathname.startsWith("/admin")) {
    const payload = await verifyAdminToken(request);
    if (!payload) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Proteksi API admin (return 401 jika tidak auth)
  if (pathname.startsWith("/api/admin")) {
    const payload = await verifyAdminToken(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Proteksi endpoint cron — hanya admin yang boleh trigger (BUG-004)
  if (pathname.startsWith("/api/cron")) {
    const payload = await verifyAdminToken(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/cron/:path*"],
};
