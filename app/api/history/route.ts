import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/history?userId=xxx
 * Returns transactions and swaps for a user, newest first.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const [transactions, swaps] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true, type: true, amount: true, status: true,
          txHash: true, createdAt: true, metadata: true,
        },
      }),
      prisma.swap.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true, hashesSwapped: true, tonReceived: true,
          status: true, createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({ success: true, transactions, swaps });
  } catch (error) {
    console.error("[History] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
