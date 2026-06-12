/**
 * Admin JWT Authentication Helper
 * Used by middleware and admin API routes.
 */
import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

const SECRET      = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);
const COOKIE_NAME = "admin_token";
const EXPIRY      = "8h";

export interface AdminTokenPayload {
  role: "admin";
}

/** Sign a new admin JWT — called after successful password login */
export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(SECRET);
}

/** Verify admin JWT from request cookie — returns payload or null */
export async function verifyAdminToken(
  request: NextRequest
): Promise<AdminTokenPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as AdminTokenPayload;
  } catch {
    return null;
  }
}

export { COOKIE_NAME as ADMIN_COOKIE_NAME };
