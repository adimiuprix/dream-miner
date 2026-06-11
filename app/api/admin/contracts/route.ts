import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const contracts = await prisma.contract.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { firstName: true, username: true } },
        plan: { select: { name: true, slug: true } },
      },
    });

    // Serialize BigInt fields
    const serialized = contracts.map((c) => ({
      ...c,
      expiresAt: Number(c.expiresAt),
      lastSyncAt: Number(c.lastSyncAt),
    }));

    return NextResponse.json({ success: true, contracts: serialized });
  } catch (error) {
    console.error("[AdminContracts] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
