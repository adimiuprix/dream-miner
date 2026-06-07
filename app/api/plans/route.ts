import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/plans
 * Get all active plans for shop display
 */
export async function GET(request: NextRequest) {
  try {
    const plans = await prisma.plan.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        power: true,
        bonus: true,
        bonusPercent: true,
        price: true,
        duration: true,
        description: true,
        finalReturn: true,
        badge: true,
        badgeColor: true,
        order: true,
        isFree: true,
      },
    });

    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error("Get plans error:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}
