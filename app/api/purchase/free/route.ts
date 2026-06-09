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

    // Cari free plan dari database
    const freePlan = await prisma.plan.findFirst({
      where: { isFree: true, isActive: true },
    });

    if (!freePlan) {
      return NextResponse.json(
        { error: "Free plan not found" },
        { status: 404 }
      );
    }

    const nowMs = Date.now();

    // Cek apakah user sudah punya free contract ACTIVE
    const activeContract = await prisma.contract.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        plan: { isFree: true },
        expiresAt: { gt: BigInt(nowMs) },
      },
    });

    if (activeContract) {
      return NextResponse.json(
        { error: "You already have an active free plan" },
        { status: 400 }
      );
    }

    // Cari contract free yang EXPIRED untuk di-reaktivasi
    const expiredContract = await prisma.contract.findFirst({
      where: {
        userId,
        status: "EXPIRED",
        plan: { isFree: true },
      },
      orderBy: { expiresAt: "desc" }, // Ambil yang paling baru
    });

    const expiresAtMs = nowMs + freePlan.duration * 24 * 60 * 60 * 1000;

    let contract;

    if (expiredContract) {
      // Reaktivasi contract yang expired
      contract = await prisma.contract.update({
        where: { id: expiredContract.id },
        data: {
          status: "ACTIVE",
          expiresAt: BigInt(expiresAtMs),
          lastSyncAt: BigInt(nowMs),
          accumulatedHashes: 0, // Reset hashes untuk contract baru
        },
      });
      console.log(`[FreePlan] Reactivated contract ${contract.id} for user ${userId}`);
    } else {
      // Buat contract baru untuk user yang belum pernah claim
      contract = await prisma.contract.create({
        data: {
          userId,
          planId: freePlan.id,
          power: freePlan.power,
          bonus: freePlan.bonus,
          status: "ACTIVE",
          expiresAt: BigInt(expiresAtMs),
          lastSyncAt: BigInt(nowMs),
        },
      });
      console.log(`[FreePlan] Created new contract ${contract.id} for user ${userId}`);
    }

    return NextResponse.json({ success: true, contract });
  } catch (error) {
    console.error("Free plan activation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
