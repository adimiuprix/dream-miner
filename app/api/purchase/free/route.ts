import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/purchase/free
 * Claim a free plan — no payment required.
 *
 * Rules:
 *  - Plan must be isFree = true and isActive = true
 *  - User cannot claim while an active (non-expired) contract exists
 *  - User CAN reclaim after the previous one expires
 *    (new users receive one as EXPIRED on registration, so they can claim immediately)
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

    // Block if user already has an ACTIVE (not yet expired) contract for this plan
    const activeContract = await prisma.contract.findFirst({
      where: {
        userId,
        planId,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
    });

    if (activeContract) {
      const daysLeft = Math.ceil(
        (activeContract.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return NextResponse.json(
        {
          error: `You already have an active free plan (${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining)`,
        },
        { status: 409 }
      );
    }

    // All clear — create a new active contract
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.duration);

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
      `[FreePlan] User ${userId} claimed "${plan.name}" — ` +
      `power: ${plan.power + plan.bonus}, expires: ${expiresAt.toISOString()}`
    );

    return NextResponse.json({
      success: true,
      contract,
      message: `Free plan activated for ${plan.duration} day${plan.duration !== 1 ? "s" : ""}`,
    });
  } catch (error) {
    console.error("Free plan claim error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
