import { NextRequest, NextResponse } from "next/server";
import { verifyAdToken, markTokenUsed } from "@/lib/adsgram-verification";

/**
 * POST /api/ad-session/verify
 * Verify token setelah ad selesai ditonton
 * 
 * Body: { token: string }
 * Returns: { valid: boolean, session?: AdSession }
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token required" },
        { status: 400 }
      );
    }

    const { valid, error, session } = await verifyAdToken(token);

    if (!valid || !session) {
      return NextResponse.json(
        { valid: false, error: error || "Invalid token" },
        { status: 403 }
      );
    }

    // Mark as used (prevent replay)
    await markTokenUsed(session.sessionId, session.userId);

    return NextResponse.json({
      valid: true,
      session: {
        userId: session.userId,
        rewardType: session.rewardType,
        amount: session.amount,
      },
    });
  } catch (error) {
    console.error("[AdSession] Verify error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
