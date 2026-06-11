import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { contracts: true, transactions: true, referrals: true } },
        contracts: { where: { status: "ACTIVE" }, select: { power: true, bonus: true } },
      },
      take: 100,
    });

    // Serialize BigInt (telegramId)
    const serialized = users.map((u) => ({
      ...u,
      telegramId: String(u.telegramId),
    }));

    return NextResponse.json({ success: true, users: serialized });
  } catch (error) {
    console.error("[AdminUsers] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
