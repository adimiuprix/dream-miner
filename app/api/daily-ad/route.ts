import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { generateAdToken, verifyAdToken, markTokenUsed } from "@/lib/adsgram-verification";

const REWARD_AMOUNT = 1000;
const COOLDOWN_HOURS = 24;
const TASK_ID = "task-daily-checkin";

/**
 * GET /api/daily-ad/prepare?userId=xxx
 * Step 1: Check eligibility dan generate signed token SEBELUM ad ditampilkan
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Check cooldown
    const lastWatch = await prisma.userTask.findFirst({
      where: { userId, taskId: TASK_ID },
      orderBy: { completedAt: "desc" },
    });

    const now = Date.now();
    
    if (lastWatch) {
      const lastMs = new Date(lastWatch.completedAt).getTime();
      const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
      const nextAvailable = lastMs + cooldownMs;

      if (now < nextAvailable) {
        return NextResponse.json({
          canWatch: false,
          nextAvailableAt: nextAvailable,
        });
      }
    }

    // Generate signed token
    const { token, expiresAt } = generateAdToken({
      userId,
      rewardType: "daily-ad",
      amount: REWARD_AMOUNT,
    });

    return NextResponse.json({ 
      canWatch: true, 
      token,
      expiresAt,
      reward: REWARD_AMOUNT,
    });
  } catch (error) {
    console.error("[DailyAd] Prepare error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/daily-ad/claim
 * Step 2: Verify token dan grant reward SETELAH ad selesai ditonton
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    // Verify token signature & expiry
    const { valid, error, session } = await verifyAdToken(token);
    
    if (!valid || !session) {
      return NextResponse.json({ 
        error: error || "Invalid token" 
      }, { status: 403 });
    }

    // Validate reward type
    if (session.rewardType !== "daily-ad") {
      return NextResponse.json({ 
        error: "Invalid reward type" 
      }, { status: 400 });
    }

    // Double-check cooldown (prevent race condition)
    const lastWatch = await prisma.userTask.findFirst({
      where: { userId: session.userId, taskId: TASK_ID },
      orderBy: { completedAt: "desc" },
    });

    if (lastWatch) {
      const lastMs = new Date(lastWatch.completedAt).getTime();
      const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
      if (Date.now() < lastMs + cooldownMs) {
        return NextResponse.json({ error: "Cooldown active" }, { status: 429 });
      }
    }

    // Mark token as used (prevent replay)
    await markTokenUsed(session.sessionId, session.userId);

    // Grant reward via bonus contract
    const bonusPlan = await prisma.plan.findUnique({ where: { slug: "bonus" } });

    await prisma.$transaction(async (tx) => {
      await tx.userTask.create({
        data: {
          userId: session.userId,
          taskId: TASK_ID,
          powerEarned: session.amount,
        },
      });

      if (bonusPlan) {
        await tx.contract.create({
          data: {
            userId: session.userId,
            planId: bonusPlan.id,
            power: session.amount,
            bonus: 0,
            status: "ACTIVE",
            expiresAt: BigInt(Date.now() + 24 * 60 * 60 * 1000),
            lastSyncAt: BigInt(Date.now()),
          },
        });
      }
    });

    return NextResponse.json({ 
      success: true, 
      reward: session.amount 
    });
  } catch (error) {
    console.error("[DailyAd] Claim error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
