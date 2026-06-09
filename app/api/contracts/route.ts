import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { serializeContracts } from "@/lib/serialization";

/**
 * GET /api/contracts?userId=xxx
 * Get user's contracts
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

    const contracts = await prisma.contract.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        plan: true,
      },
    });

    return NextResponse.json({
      success: true,
      contracts: serializeContracts(contracts),
    });
  } catch (error) {
    console.error("Get contracts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
