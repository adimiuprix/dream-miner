import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/purchase/free
 * Claim a free plan — no payment required.
 * Rules:
 *  - Plan must be marked isFree = true
 *  - User can only claim the same free plan once at a time
 *    (no active contract of the same planId)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, planId } = body;

    if (!userId || !planId) {
      return NextResponse.json(
        { error: "userId and planId are required" },
        { status: 400 }
      );
    }

    // Validate plan exists and is free
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: "Invalid or inactive plan" },
        { status: 400 }
      );
    }

    if (!plan.isFree) {
      return NextResponse.json(
        { error: "This plan is not free" },
        { status: 400 }
      );
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user already has an active contract for this plan
    const existing = await prisma.contract.findFirst({
      where: {
        userId,
        planId,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
    });

    if (existing) {
      const daysLeft = Math.ceil(
        (existing.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return NextResponse.json(
        {
          error: `You already have an active free plan (${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining)`,
        },
        { status: 409 }
      );
    }

    // Calculate expiry using plan's duration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.duration);

    // Create contract directly (no transaction needed)
    const contract = await prisma.contract.create({
      data: {
        userId,
        planId: plan.id,
        power: plan.power,
        price: 0,
        bonus: plan.bonus,
        status: "ACTIVE",
        expiresAt,
      },
    });

    console.log(
      `[FreePlan] User ${userId} claimed free plan "${plan.name}" — ` +
      `power: ${plan.power + plan.bonus}, expires: ${expiresAt.toISOString()}`
    );

    return NextResponse.json({
      success: true,
      contract,
      message: `Free plan activated for ${plan.duration} days`,
    });
  } catch (error) {
    console.error("Free plan claim error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
