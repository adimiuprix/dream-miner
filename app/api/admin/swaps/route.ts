import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const swaps = await prisma.swap.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { firstName: true, username: true } } },
    });

    return NextResponse.json({ success: true, swaps });
  } catch (error) {
    console.error("[AdminSwaps] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
