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

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate total power (base + bonus)
    const totalPower = plan.power + plan.bonus;

    // Calculate expiry date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

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

/**
 * PUT /api/purchase
 * Update transaction status after payment confirmation
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, txHash, status } = body;

    if (!transactionId || !txHash) {
      return NextResponse.json(
        { error: "transactionId and txHash are required" },
        { status: 400 }
      );
    }

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Update transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        txHash,
        status: status || "COMPLETED",
      },
    });

    // If completed, create contract and update user power
    if (status === "COMPLETED" || !status) {
      const metadata = JSON.parse(transaction.metadata || "{}");
      const planId = metadata.planId;

      // Fetch plan from database
      const plan = planId
        ? await prisma.plan.findUnique({ where: { id: planId } })
        : null;

      if (plan) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (plan.duration || 30));

        // Create contract
        const contract = await prisma.contract.create({
          data: {
            userId: transaction.userId,
            planId: plan.id,
            power: plan.power,
            price: plan.price,
            bonus: plan.bonus,
            status: "ACTIVE",
            expiresAt,
          },
        });

        // Note: User.power field removed - power is calculated from active contracts
        // No need to update user power manually

        return NextResponse.json({
          success: true,
          transaction: updatedTransaction,
          contract,
          message: "Purchase completed and contract activated",
        });
      }
    }

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error("Update purchase error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
