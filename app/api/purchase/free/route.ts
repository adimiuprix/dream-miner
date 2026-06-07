import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Cari contract free plan milik user yang statusnya EXPIRED
    const contract = await prisma.contract.findFirst({
      where: {
        userId,
        status: "EXPIRED",
        plan: { isFree: true },
      },
      include: { plan: true },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "No expired free contract found for this user" },
        { status: 404 }
      );
    }

    // Update status menjadi ACTIVE
    const updated = await prisma.contract.update({
      where: { id: contract.id },
      data: { status: "ACTIVE" },
    });

    console.log(`[FreePlan] Contract ${contract.id} user ${userId} → ACTIVE`);

    return NextResponse.json({ success: true, contract: updated });
  } catch (error) {
    console.error("Free plan activation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
