import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyTransactionByReceiverAddress } from "@/lib/tonWebVerification";
import { serializeContract } from "@/lib/serialization";
import { givePurchaseBonus } from "@/lib/referralBonus";

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

    // Already processed
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

    if (!transaction.txHash) {
      return NextResponse.json(
        { error: "Transaction hash missing" },
        { status: 400 }
      );
    }

    // Get plan from database using planId stored in metadata
    const metadata = JSON.parse(transaction.metadata || "{}");
    const planId = metadata.planId as string | undefined;

    const plan = planId
      ? await prisma.plan.findUnique({ where: { id: planId } })
      : null;

    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found for this transaction" },
        { status: 400 }
      );
    }

    // Verify transaction on blockchain
    console.log(`[VerifyPayment] Verifying transaction ${transactionId}...`);

    const verification = await verifyTransactionByReceiverAddress(
      transaction.toAddress || "",
      transaction.amount,
      transaction.fromAddress || "",
      300 // 5 minute time window
    );

    console.log("[VerifyPayment] Result:", verification);

    // Verification failed — mark as FAILED
    if (!verification.isValid || !verification.isConfirmed) {
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

    // Verified — process purchase atomically
    console.log(`[VerifyPayment] Verified. Creating contract for user ${transaction.userId}...`);

    // Use plan.duration to calculate expiry
    const nowMs = Date.now();
    const expiresAtMs = nowMs + plan.duration * 24 * 60 * 60 * 1000;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark transaction as COMPLETED
      const updatedTransaction = await tx.transaction.update({
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

      // 2. Create contract — power calculated from active contracts, not stored on user
      const contract = await tx.contract.create({
        data: {
          userId: transaction.userId,
          planId: plan.id,
          power: plan.power,
          bonus: plan.bonus,
          status: "ACTIVE",
          expiresAt: BigInt(expiresAtMs),
          lastSyncAt: BigInt(nowMs),
        },
      });

      return { updatedTransaction, contract };
    });

    // Give purchase bonus to referrer if buyer was referred (fire-and-forget)
    const buyer = await prisma.user.findUnique({
      where: { id: transaction.userId },
      select: { referredById: true },
    });
    if (buyer?.referredById) {
      givePurchaseBonus(buyer.referredById, plan.power, plan.bonus, plan.duration);
    }

    console.log(`[VerifyPayment] Purchase completed for user ${transaction.userId}`);

    return NextResponse.json({
      success: true,
      status: "COMPLETED",
      message: "Transaction verified and purchase completed",
      transaction: result.updatedTransaction,
      contract: serializeContract(result.contract),
      powerAdded: plan.power + plan.bonus,
      verification,
    });
  } catch (error) {
    console.error("[VerifyPayment] Error:", error);
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
    console.error("[VerifyPayment] Check status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
