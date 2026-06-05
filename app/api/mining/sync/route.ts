import { NextRequest, NextResponse } from "next/server";
import { syncMiningProgress, getMiningStatus } from "@/lib/miningService";

/**
 * POST /api/mining/sync
 * Sync mining progress and get updated stats
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

    // Sync mining progress
    const stats = await syncMiningProgress(userId);

    if (!stats) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalPower: stats.totalPower,
        miningRate: stats.miningRate,
        currentHashes: stats.currentHashes,
        offlineHashes: stats.offlineHashes,
      },
    });
  } catch (error) {
    console.error("Mining sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mining/sync?userId=xxx
 * Get mining status without syncing (read-only)
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

    const stats = await getMiningStatus(userId);

    if (!stats) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalPower: stats.totalPower,
        miningRate: stats.miningRate,
        currentHashes: stats.currentHashes,
        offlineHashes: stats.offlineHashes,
      },
    });
  } catch (error) {
    console.error("Mining status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
