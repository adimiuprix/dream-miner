import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/tasks/[id]/complete
 * Mark a task as completed for a user and grant power reward.
 *
 * Body: { userId: string }
 *
 * Validation:
 *  - Non-repeatable: cannot complete if already completed
 *  - Repeatable: cannot complete if cooldown hasn't passed
 *  - REFERRAL tasks: validated against actual referral count
 *  - PURCHASE tasks: validated against actual purchase/wallet data
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
    if (task.type === "REFERRAL") {
      // BUG-012: Baca requiredReferrals dari metadata task, bukan hardcode ID.
      // Ini memungkinkan admin menambah task referral baru tanpa perlu update kode.
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
            { error: `You need ${requiredReferrals} referrals to complete this task. You have ${referralCount}.` },
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
