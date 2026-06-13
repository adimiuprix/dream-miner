import { NextRequest, NextResponse } from "next/server";
import { signAdminToken, ADMIN_COOKIE_NAME } from "@/lib/adminAuth";
import { timingSafeEqual } from "crypto";

const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours — matches JWT expiry

/**
 * POST /api/admin/auth
 * Verify admin password and set JWT cookie.
 * Body: { password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.error("[AdminAuth] ADMIN_PASSWORD env variable is not set");
      return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
    }

    // Gunakan timingSafeEqual agar tidak rentan timing attack (BUG-005).
    // timingSafeEqual membutuhkan buffer dengan panjang yang sama — pad ke
    // panjang yang sama untuk menghindari bocornya info panjang password.
    const pwBuf      = Buffer.from(password);
    const adminBuf   = Buffer.from(adminPassword);
    const maxLen     = Math.max(pwBuf.length, adminBuf.length);
    const pwPadded   = Buffer.concat([pwBuf,    Buffer.alloc(maxLen - pwBuf.length)]);
    const admPadded  = Buffer.concat([adminBuf, Buffer.alloc(maxLen - adminBuf.length)]);

    // Bandingkan konten dan panjang secara terpisah, keduanya constant-time
    const contentMatch = timingSafeEqual(pwPadded, admPadded);
    const lengthMatch  = pwBuf.length === adminBuf.length;

    if (!contentMatch || !lengthMatch) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = await signAdminToken();

    const response = NextResponse.json({ success: true });

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   COOKIE_MAX_AGE,
      path:     "/",
    });

    return response;
  } catch (error) {
    console.error("[AdminAuth] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/auth
 * Clear admin JWT cookie (logout).
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}
