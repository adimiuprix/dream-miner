import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateTelegramMembership, parseTelegramChatId } from "@/lib/telegram-validator";

/**
 * POST /api/tasks/[id]/complete - Complete task with validation
 * SOCIAL (Telegram): Real-time membership check | REFERRAL: Count check | PURCHASE: Transaction check
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body           = await request.json();
    const { userId }     = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Load task
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || !task.isActive) {
      return NextResponse.json({ error: "Task not found or inactive" }, { status: 404 });
    }

    // Load previous completions
    const prevCompletions = await prisma.userTask.findMany({
      where: { userId, taskId },
      orderBy: { completedAt: "desc" },
    });

    const now = Date.now();

    // ── Cooldown / duplicate check ─────────────────────────────────────────
    if (!task.isRepeatable && prevCompletions.length > 0) {
      return NextResponse.json(
        { error: "Task already completed" },
        { status: 409 }
      );
    }

    if (task.isRepeatable && prevCompletions.length > 0) {
      const lastMs     = new Date(prevCompletions[0].completedAt).getTime();
      const cooldownMs = task.repeatCooldownHours * 60 * 60 * 1000;
      if (now < lastMs + cooldownMs) {
        const remaining = Math.ceil((lastMs + cooldownMs - now) / 3_600_000);
        return NextResponse.json(
          { error: `Cooldown active. Try again in ${remaining}h` },
          { status: 429 }
        );
      }
    }

    // ── Task-specific validation ───────────────────────────────────────────

    // SOCIAL - Telegram membership validation
    if (task.type === "SOCIAL") {
      const chatId = parseTelegramChatId(task.metadata);
      if (chatId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { telegramId: true },
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const { isValid, error } = await validateTelegramMembership(user.telegramId, chatId);
        if (!isValid) {
          return NextResponse.json({ error: error || "Please join the channel first" }, { status: 403 });
        }
      }
    }

    // REFERRAL - Count validation
    if (task.type === "REFERRAL") {
      let requiredReferrals: number | null = null;

      if (task.metadata) {
        try {
          const meta = JSON.parse(task.metadata) as { requiredReferrals?: number };
          if (typeof meta.requiredReferrals === "number") {
            requiredReferrals = meta.requiredReferrals;
          }
        } catch {
          console.warn(`[Tasks] Failed to parse metadata for task ${taskId}`);
        }
      }

      if (requiredReferrals !== null) {
        const referralCount = await prisma.user.count({
          where: { referredById: userId },
        });

        if (referralCount < requiredReferrals) {
          return NextResponse.json(
            { error: `You need ${requiredReferrals} referrals. You have ${referralCount}.` },
            { status: 400 }
          );
        }
      }
    }

    if (task.type === "PURCHASE") {
      if (taskId === "task-buy-first-plan") {
        const hasPurchase = await prisma.transaction.count({
          where: { userId, type: "PURCHASE_POWER", status: "COMPLETED" },
        });
        if (hasPurchase === 0) {
          return NextResponse.json(
            { error: "You haven't purchased a plan yet." },
            { status: 400 }
          );
        }
      }

      if (taskId === "task-connect-wallet") {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { walletAddress: true },
        });
        if (!user?.walletAddress) {
          return NextResponse.json(
            { error: "Please connect your TON wallet first." },
            { status: 400 }
          );
        }
      }
    }

    // ── Award power via a bonus contract ─────────────────────────────────────
    const bonusPlan = await prisma.plan.findUnique({
      where: { slug: "bonus" },
    });

    await prisma.$transaction(async (tx) => {
      // 1. Record completion
      await tx.userTask.create({
        data: {
          userId,
          taskId,
          powerEarned: task.reward,
        },
      });

      // 2. Grant power via contract
      // Duration: 24 hours for all tasks
      if (bonusPlan) {
        const expiresAtMs = Date.now() + 24 * 60 * 60 * 1000;
        await tx.contract.create({
          data: {
            userId,
            planId:     bonusPlan.id,
            power:      task.reward,
            bonus:      0,
            status:     "ACTIVE",
            expiresAt:  BigInt(expiresAtMs),
            lastSyncAt: BigInt(Date.now()),
          },
        });
      }
    });

    return NextResponse.json({
      success:    true,
      powerEarned: task.reward,
      message:    `Task completed! +${task.reward.toLocaleString()} POWER`,
    });
  } catch (error) {
    console.error("[Tasks] Complete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
