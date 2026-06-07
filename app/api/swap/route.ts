import { prisma } from "@/lib/prisma";
import { syncMiningProgress } from "@/lib/miningService";
import { NextRequest, NextResponse } from "next/server";

/**
 * Exchange rate configuration
 * 1,000 HASHES = 0.0144 TON
 * ~69,444 HASHES = 1 TON
 */
const EXCHANGE_RATE = 0.0000144; // 1 HASH = 0.0000144 TON
const MINIMUM_SWAP_HASHES = 1000; // Minimum hashes to swap (sesuai mockup)

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

    // Sync & flush semua contract aktif dulu agar accumulatedHashes up-to-date
    const miningStats = await syncMiningProgress(userId);

    if (!miningStats) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const currentHashes = miningStats.currentHashes;

    // Check minimum hashes
    if (currentHashes < MINIMUM_SWAP_HASHES) {
      return NextResponse.json(
        {
          error: `Insufficient hashes. Minimum ${MINIMUM_SWAP_HASHES} HASHES required.`,
          currentHashes,
          minimumRequired: MINIMUM_SWAP_HASHES,
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tonBalance: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Calculate TON amount
    const tonAmount = currentHashes * EXCHANGE_RATE;
    const hashesToSwap = currentHashes;
    const hashesBalanceBefore = currentHashes;
    const tonBalanceBefore = user.tonBalance;

    // Perform swap in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Reset semua accumulatedHashes di contracts user (aktif + expired)
      await tx.contract.updateMany({
        where: { userId },
        data: { accumulatedHashes: 0 },
      });

      // 2. Tambah tonBalance user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          tonBalance: { increment: tonAmount },
        },
      });

      // 3. Record swap
      const swap = await tx.swap.create({
        data: {
          userId,
          hashesSwapped: hashesToSwap,
          tonReceived: tonAmount,
          exchangeRate: EXCHANGE_RATE,
          hashesBalanceBefore,
          hashesBalanceAfter: 0,
          tonBalanceBefore,
          tonBalanceAfter: updatedUser.tonBalance,
          status: "COMPLETED",
        },
      });

      return { updatedUser, swap };
    });

    console.log(
      `[Swap] User ${userId} swapped ${hashesToSwap.toFixed(2)} HASHES ` +
      `for ${tonAmount.toFixed(4)} TON`
    );

    return NextResponse.json({
      success: true,
      swap: {
        id: result.swap.id,
        hashesSwapped: hashesToSwap,
        tonReceived: tonAmount,
        exchangeRate: EXCHANGE_RATE,
        newTonBalance: result.updatedUser.tonBalance,
        hashesBalanceBefore,
        tonBalanceBefore,
        swappedAt: result.swap.createdAt,
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
      select: { id: true, tonBalance: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Baca hashes dari contracts, bukan User.hashes
    const contracts = await prisma.contract.findMany({
      where: { userId, status: { in: ["ACTIVE", "EXPIRED"] } },
      select: { accumulatedHashes: true },
    });

    const currentHashes = contracts.reduce((sum, c) => sum + c.accumulatedHashes, 0);
    const tonAmount = currentHashes * EXCHANGE_RATE;
    const canSwap = currentHashes >= MINIMUM_SWAP_HASHES;

    return NextResponse.json({
      success: true,
      preview: {
        currentHashes,
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
