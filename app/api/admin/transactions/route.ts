import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { firstName: true, username: true } } },
    });

    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    console.error("[AdminTransactions] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
