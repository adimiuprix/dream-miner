import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [totalUsers, totalContracts, activeContracts, completedTx, totalSwaps] =
      await Promise.all([
        prisma.user.count(),
        prisma.contract.count(),
        prisma.contract.count({ where: { status: "ACTIVE" } }),
        prisma.transaction.count({ where: { status: "COMPLETED", type: "PURCHASE_POWER" } }),
        prisma.swap.count({ where: { status: "COMPLETED" } }),
      ]);

    const revenue = await prisma.transaction.aggregate({
      where: { status: "COMPLETED", type: "PURCHASE_POWER" },
      _sum: { amount: true },
    });

    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, firstName: true, lastName: true, username: true, createdAt: true },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalContracts,
        activeContracts,
        completedTx,
        totalSwaps,
        totalRevenue: revenue._sum.amount ?? 0,
        recentUsers,
      },
    });
  } catch (error) {
    console.error("[AdminDashboard] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
