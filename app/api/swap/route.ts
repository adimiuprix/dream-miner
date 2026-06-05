import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * Exchange rate configuration
 * 10,000 HASHES = 1 TON
 */
const EXCHANGE_RATE = 0.0001; // 1 HASH = 0.0001 TON
const MINIMUM_SWAP_HASHES = 100; // Minimum hashes to swap

/**
 * POST /api/swap
 * Swap user's hashes for TON
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check minimum hashes
    if (user.hashes < MINIMUM_SWAP_HASHES) {
      return NextResponse.json(
        {
          error: `Insufficient hashes. Minimum ${MINIMUM_SWAP_HASHES} HASHES required.`,
          currentHashes: user.hashes,
          minimumRequired: MINIMUM_SWAP_HASHES,
        },
        { status: 400 }
      );
    }

    // Calculate TON amount
    const tonAmount = user.hashes * EXCHANGE_RATE;
    const hashesToSwap = user.hashes;

    // Perform swap in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update user balances
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          hashes: 0, // Reset hashes
          tonBalance: {
            increment: tonAmount,
          },
        },
      });

      // 2. Record transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: "SWAP_HASH_TO_TON",
          amount: tonAmount,
          status: "COMPLETED",
          metadata: JSON.stringify({
            hashesSwapped: hashesToSwap,
            exchangeRate: EXCHANGE_RATE,
            tonReceived: tonAmount,
            swappedAt: new Date().toISOString(),
          }),
        },
      });

      return { updatedUser, transaction };
    });

    console.log(
      `[Swap] User ${userId} swapped ${hashesToSwap.toFixed(2)} HASHES ` +
      `for ${tonAmount.toFixed(4)} TON`
    );

    return NextResponse.json({
      success: true,
      swap: {
        hashesSwapped: hashesToSwap,
        tonReceived: tonAmount,
        exchangeRate: EXCHANGE_RATE,
        newTonBalance: result.updatedUser.tonBalance,
        transactionId: result.transaction.id,
      },
    });
  } catch (error) {
    console.error("Swap error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/swap?userId=xxx
 * Get swap preview (how much TON user will receive)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        hashes: true,
        tonBalance: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const tonAmount = user.hashes * EXCHANGE_RATE;
    const canSwap = user.hashes >= MINIMUM_SWAP_HASHES;

    return NextResponse.json({
      success: true,
      preview: {
        currentHashes: user.hashes,
        estimatedTon: tonAmount,
        exchangeRate: EXCHANGE_RATE,
        minimumRequired: MINIMUM_SWAP_HASHES,
        canSwap,
        currentTonBalance: user.tonBalance,
      },
    });
  } catch (error) {
    console.error("Swap preview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
