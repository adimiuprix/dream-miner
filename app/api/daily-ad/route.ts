import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const REWARD_AMOUNT = 1000;
const COOLDOWN_HOURS = 24;
const TASK_ID = "task-daily-checkin"; // Use existing task

/**
 * GET /api/daily-ad?userId=xxx - Check if user can watch daily ad
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Check last ad watch
    const lastWatch = await prisma.userTask.findFirst({
      where: { userId, taskId: TASK_ID },
      orderBy: { completedAt: "desc" },
    });

    const now = Date.now();
    
    if (!lastWatch) {
      return NextResponse.json({ canWatch: true });
    }

    const lastMs = new Date(lastWatch.completedAt).getTime();
    const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
    const nextAvailable = lastMs + cooldownMs;

    if (now < nextAvailable) {
      return NextResponse.json({
        canWatch: false,
        nextAvailableAt: nextAvailable,
      });
    }

    return NextResponse.json({ canWatch: true });
  } catch (error) {
    console.error("[DailyAd] GET error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/daily-ad - Grant reward after ad watched
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Check cooldown
    const lastWatch = await prisma.userTask.findFirst({
      where: { userId, taskId: TASK_ID },
      orderBy: { completedAt: "desc" },
    });

    if (lastWatch) {
      const lastMs = new Date(lastWatch.completedAt).getTime();
      const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
      if (Date.now() < lastMs + cooldownMs) {
        return NextResponse.json({ error: "Cooldown active" }, { status: 429 });
      }
    }

    // Grant reward via bonus contract
    const bonusPlan = await prisma.plan.findUnique({ where: { slug: "bonus" } });

    await prisma.$transaction(async (tx) => {
      // Record completion
      await tx.userTask.create({
        data: {
          userId,
          taskId: TASK_ID,
          powerEarned: REWARD_AMOUNT,
        },
      });

      // Grant power
      if (bonusPlan) {
        await tx.contract.create({
          data: {
            userId,
            planId: bonusPlan.id,
            power: REWARD_AMOUNT,
            bonus: 0,
            status: "ACTIVE",
            expiresAt: BigInt(Date.now() + 24 * 60 * 60 * 1000),
            lastSyncAt: BigInt(Date.now()),
          },
        });
      }
    });

    return NextResponse.json({ success: true, reward: REWARD_AMOUNT });
  } catch (error) {
    console.error("[DailyAd] POST error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
