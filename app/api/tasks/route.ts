import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/tasks?userId=xxx
 *
 * Returns all active tasks with completion status for the given user.
 * For repeatable tasks, checks if cooldown has passed since last completion.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // All active tasks
    const tasks = await prisma.task.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    // All completions for this user
    const completions = await prisma.userTask.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
    });

    const now = Date.now();

    // Map tasks with completion state
    const result = tasks.map((task) => {
      const taskCompletions = completions.filter((c) => c.taskId === task.id);
      const lastCompletion  = taskCompletions[0] ?? null;

      let isCompleted   = false;
      let canComplete   = true;
      let cooldownEndsAt: number | null = null;

      if (task.isRepeatable) {
        // Repeatable: check if cooldown passed since last completion
        if (lastCompletion) {
          const lastMs    = new Date(lastCompletion.completedAt).getTime();
          const cooldownMs = task.repeatCooldownHours * 60 * 60 * 1000;
          const endsAt    = lastMs + cooldownMs;
          if (now < endsAt) {
            canComplete    = false;
            cooldownEndsAt = endsAt;
          }
        }
        isCompleted = false; // repeatable tasks are never "permanently" done
      } else {
        // Non-repeatable: completed once = done forever
        isCompleted = taskCompletions.length > 0;
        canComplete = !isCompleted;
      }

      return {
        id:                  task.id,
        title:               task.title,
        description:         task.description,
        type:                task.type,
        reward:              task.reward,
        link:                task.link,
        isRepeatable:        task.isRepeatable,
        repeatCooldownHours: task.repeatCooldownHours,
        isCompleted,
        canComplete,
        cooldownEndsAt,
        completionCount:     taskCompletions.length,
        totalPowerEarned:    taskCompletions.reduce((s, c) => s + c.powerEarned, 0),
      };
    });

    // Summary stats
    const totalEarned = completions.reduce((s, c) => s + c.powerEarned, 0);
    const available   = result.filter((t) => t.canComplete).length;

    return NextResponse.json({
      success: true,
      tasks:   result,
      stats: {
        totalEarned,
        available,
        completed: completions.length,
      },
    });
  } catch (error) {
    console.error("[Tasks] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
