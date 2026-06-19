import { createHmac, randomBytes } from "crypto";
import { prisma } from "./prisma";

const SECRET = process.env.ADSGRAM_VERIFICATION_SECRET;
const TOKEN_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

if (!SECRET) {
  throw new Error("ADSGRAM_VERIFICATION_SECRET environment variable is required");
}

// Type assertion after runtime check
const VERIFIED_SECRET: string = SECRET;

export interface AdSession {
  sessionId: string;
  userId: string;
  rewardType: "daily-ad" | "task-ad" | "swap-bonus" | "free-power";
  amount: number;
  expiresAt: number;
}

/**
 * Generate signed token sebelum ad ditampilkan
 */
export function generateAdToken(params: {
  userId: string;
  rewardType: AdSession["rewardType"];
  amount: number;
}): { sessionId: string; token: string; expiresAt: number } {
  const sessionId = randomBytes(16).toString("hex");
  const expiresAt = Date.now() + TOKEN_EXPIRY_MS;

  const payload = JSON.stringify({
    sessionId,
    userId: params.userId,
    rewardType: params.rewardType,
    amount: params.amount,
    expiresAt,
  });

  const signature = createHmac("sha256", VERIFIED_SECRET)
    .update(payload)
    .digest("hex");

  const token = Buffer.from(`${payload}.${signature}`).toString("base64");

  return { sessionId, token, expiresAt };
}

/**
 * Verify token dan claim reward (single-use)
 */
export async function verifyAdToken(token: string): Promise<{
  valid: boolean;
  error?: string;
  session?: AdSession;
}> {
  try {
    // Decode token
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [payloadStr, signature] = decoded.split(".");

    if (!payloadStr || !signature) {
      return { valid: false, error: "Invalid token format" };
    }

    // Verify signature
    const expectedSignature = createHmac("sha256", VERIFIED_SECRET)
      .update(payloadStr)
      .digest("hex");

    if (signature !== expectedSignature) {
      return { valid: false, error: "Invalid signature" };
    }

    const session = JSON.parse(payloadStr) as AdSession;

    // Check expiry
    if (Date.now() > session.expiresAt) {
      return { valid: false, error: "Token expired" };
    }

    // Check single-use (prevent replay attacks)
    const existing = await prisma.adSession.findUnique({
      where: { sessionId: session.sessionId },
    });

    if (existing) {
      return { valid: false, error: "Token already used" };
    }

    return { valid: true, session };
  } catch (error) {
    console.error("[AdsgramVerification] Verify error:", error);
    return { valid: false, error: "Verification failed" };
  }
}

/**
 * Mark token as used (prevent replay)
 */
export async function markTokenUsed(sessionId: string, userId: string): Promise<void> {
  await prisma.adSession.create({
    data: {
      sessionId,
      userId,
      usedAt: new Date(),
    },
  });
}

/**
 * Cleanup expired sessions (call dari cron)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const result = await prisma.adSession.deleteMany({
    where: { usedAt: { lt: oneDayAgo } },
  });

  return result.count;
}
