import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/history?userId=xxx&page=1&pageSize=20
 * Returns transactions and swaps for a user, newest first.
 * Supports pagination via `page` (1-based) and `pageSize` (default 20, max 50).
 */
export async function GET(request: NextRequest) {
  try {
    const userId   = request.nextUrl.searchParams.get("userId");
    const page     = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get("pageSize") ?? "20", 10)));
    const skip     = (page - 1) * pageSize;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const [transactions, swaps] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true, type: true, amount: true, status: true,
          txHash: true, createdAt: true, metadata: true,
        },
      }),
      prisma.swap.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true, hashesSwapped: true, tonReceived: true,
          status: true, createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({ success: true, transactions, swaps, page, pageSize });
  } catch (error) {
    console.error("[History] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
