import { NextRequest, NextResponse } from "next/server";
import { generateAdToken } from "@/lib/adsgram-verification";

/**
 * POST /api/ad-session/prepare
 * Generate signed token sebelum ad ditampilkan
 * 
 * Body: {
 *   userId: string
 *   rewardType: "daily-ad" | "task-ad" | "swap-bonus" | "free-power"
 *   amount: number
 *   metadata?: Record<string, any>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, rewardType, amount, metadata } = await request.json();

    if (!userId || !rewardType || typeof amount !== "number") {
      return NextResponse.json(
        { error: "userId, rewardType, and amount are required" },
        { status: 400 }
      );
    }

    const validTypes = ["daily-ad", "task-ad", "swap-bonus", "free-power"];
    if (!validTypes.includes(rewardType)) {
      return NextResponse.json(
        { error: "Invalid rewardType" },
        { status: 400 }
      );
    }

    const { token, sessionId, expiresAt } = generateAdToken({
      userId,
      rewardType,
      amount,
    });

    return NextResponse.json({
      success: true,
      token,
      sessionId,
      expiresAt,
      metadata,
    });
  } catch (error) {
    console.error("[AdSession] Prepare error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
