import { NextRequest, NextResponse } from "next/server";
import { syncMiningProgress, getMiningStatus } from "@/lib/miningService";

/**
 * POST /api/mining/sync
 * Flush accumulatedHashes ke DB lalu kembalikan stats terbaru.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const stats = await syncMiningProgress(userId);

    if (!stats) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalPower: stats.totalPower,
        miningRate: stats.miningRate,
        currentHashes: stats.currentHashes,
        pendingHashes: stats.pendingHashes,
        lastSyncAt: stats.lastSyncAt, // Already a number (Unix timestamp)
      },
    });
  } catch (error) {
    console.error("Mining sync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/mining/sync?userId=xxx
 * Read-only — tidak menulis ke DB.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const stats = await getMiningStatus(userId);

    if (!stats) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalPower: stats.totalPower,
        miningRate: stats.miningRate,
        currentHashes: stats.currentHashes,
        pendingHashes: stats.pendingHashes,
        lastSyncAt: stats.lastSyncAt, // Already a number (Unix timestamp)
      },
    });
  } catch (error) {
    console.error("Mining status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
