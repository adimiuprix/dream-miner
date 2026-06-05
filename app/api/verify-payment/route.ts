import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyTransactionByReceiverAddress } from "@/lib/tonWebVerification";
import { POWER_PLANS } from "@/lib/tonPayment";

/**
 * POST /api/verify-payment
 * Verify transaction on blockchain and complete purchase if valid
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: "transactionId is required" },
        { status: 400 }
      );
    }

    // Get transaction from database
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Check if already processed
    if (transaction.status === "COMPLETED") {
      return NextResponse.json({
        success: true,
        status: "COMPLETED",
        message: "Transaction already completed",
      });
    }

    if (transaction.status === "FAILED") {
      return NextResponse.json({
        success: false,
        status: "FAILED",
        message: "Transaction already marked as failed",
      });
    }

    // Check if we have transaction hash
    if (!transaction.txHash) {
      return NextResponse.json(
        { error: "Transaction hash missing" },
        { status: 400 }
      );
    }

    // Parse metadata to get plan info
    const metadata = JSON.parse(transaction.metadata || "{}");
    const planId = metadata.planId;
    const plan = POWER_PLANS.find((p) => p.id === planId);

    if (!plan) {
      return NextResponse.json(
        { error: "Invalid plan in transaction" },
        { status: 400 }
      );
    }

    // Verify transaction on blockchain
    console.log(`Verifying transaction ${transactionId} on blockchain...`);
    
    const verification = await verifyTransactionByReceiverAddress(
      transaction.toAddress || "",
      transaction.amount,
      transaction.fromAddress || "",
      300 // 5 minute time window
    );

    console.log("Verification result:", verification);

    // If verification failed
    if (!verification.isValid || !verification.isConfirmed) {
      // Update transaction status to FAILED
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "FAILED",
          metadata: JSON.stringify({
            ...metadata,
            verificationError: verification.error || verification.message,
            verifiedAt: new Date().toISOString(),
          }),
        },
      });

      return NextResponse.json({
        success: false,
        status: "FAILED",
        message: verification.error || "Transaction verification failed",
        verification,
      });
    }

    // Verification successful! Process the purchase
    console.log(`Transaction verified successfully. Processing purchase...`);

    // Calculate total power
    const totalPower = plan.powerValue + plan.bonusValue;

    // Calculate expiry date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Update transaction status to COMPLETED
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "COMPLETED",
          metadata: JSON.stringify({
            ...metadata,
            verifiedAt: new Date().toISOString(),
            blockchainAmount: verification.amount,
            blockchainTimestamp: verification.timestamp,
          }),
        },
      });

      // 2. Create contract
      const contract = await prisma.contract.create({
        data: {
          userId: transaction.userId,
          planId: plan.id,
          power: plan.powerValue,
          price: plan.price,
          bonus: plan.bonusValue,
          status: "ACTIVE",
          expiresAt,
        },
      });

      // 3. Update user's total power
      const updatedUser = await prisma.user.update({
        where: { id: transaction.userId },
        data: {
          power: {
            increment: totalPower,
          },
        },
      });

      return { updatedTransaction, contract, updatedUser };
    });

    console.log(`Purchase completed for user ${transaction.userId}`);

    return NextResponse.json({
      success: true,
      status: "COMPLETED",
      message: "Transaction verified and purchase completed",
      transaction: result.updatedTransaction,
      contract: result.contract,
      powerAdded: totalPower,
      verification,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/verify-payment?transactionId=xxx
 * Check transaction verification status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get("transactionId");

    if (!transactionId) {
      return NextResponse.json(
        { error: "transactionId is required" },
        { status: 400 }
      );
    }

    // Get transaction status
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        status: true,
        amount: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error("Check status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
