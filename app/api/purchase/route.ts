import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/purchase
 * Create a pending transaction and contract for power purchase
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, planId, txHash, fromAddress, toAddress } = body;

    if (!userId || !planId) {
      return NextResponse.json(
        { error: "userId and planId are required" },
        { status: 400 }
      );
    }

    // Find the plan from database
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: "Invalid or inactive plan" },
        { status: 400 }
      );
    }

    // Tolak free plan lewat flow ini — gunakan /api/purchase/free (BUG-022)
    if (plan.isFree) {
      return NextResponse.json(
        { error: "Free plan cannot be purchased via this endpoint. Use /api/purchase/free instead." },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate total power (base + bonus)
    const totalPower = plan.power + plan.bonus;

    // Calculate expiry date (duration from plan in days)
    const nowMs = Date.now();
    const expiresAtMs = nowMs + plan.duration * 24 * 60 * 60 * 1000;

    // Create transaction record with PENDING status
    // We'll verify on blockchain before marking as COMPLETED
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: "PURCHASE_POWER",
        amount: plan.price,
        status: "PENDING", // Always start as PENDING
        txHash: txHash || null,
        fromAddress: fromAddress || null,
        toAddress: toAddress || null,
        metadata: JSON.stringify({
          planId: plan.id,
          power: totalPower,
        }),
      },
    });

    // Return pending transaction
    // Client will poll for verification status
    return NextResponse.json({
      success: true,
      transaction,
      message: "Transaction created, pending blockchain verification",
    });
  } catch (error) {
    console.error("Purchase error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
