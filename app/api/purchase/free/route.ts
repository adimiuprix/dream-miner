import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { serializeContract } from "@/lib/serialization";

/** Free plan duration is fixed at 12 hours regardless of plan.duration */
const FREE_PLAN_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

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

    const nowMs       = Date.now();
    const expiresAtMs = nowMs + FREE_PLAN_DURATION_MS;

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

    // Cari contract free yang sudah expired — dua kondisi:
    //   a) status sudah "EXPIRED" di DB (cron sudah jalan), atau
    //   b) status masih "ACTIVE" tapi expiresAt sudah lewat (cron belum jalan)
    // Kondisi (b) adalah penyebab bug "You already have an active free plan":
    // activeContract query tidak match karena expiresAt sudah lewat, tapi
    // expiredContract query juga tidak match karena status masih "ACTIVE" di DB.
    // Akibatnya kode masuk ke `else` dan membuat contract baru — lalu klik
    // berikutnya menemukan dua contract ACTIVE dan memblokir reaktivasi.
    const expiredContract = await prisma.contract.findFirst({
      where: {
        userId,
        plan: { isFree: true },
        OR: [
          { status: "EXPIRED" },
          { status: "ACTIVE", expiresAt: { lte: BigInt(nowMs) } },
        ],
      },
      orderBy: { expiresAt: "desc" },
    });

    let contract;

    if (expiredContract) {
      // Reaktivasi contract — baik yang sudah berstatus EXPIRED di DB,
      // maupun yang masih ACTIVE tapi sudah melewati expiresAt.
      contract = await prisma.contract.update({
        where: { id: expiredContract.id },
        data: {
          status:            "ACTIVE",
          expiresAt:         BigInt(expiresAtMs),
          lastSyncAt:        BigInt(nowMs),
          accumulatedHashes: 0,
        },
      });
      console.log(`[FreePlan] Reactivated contract ${contract.id} for user ${userId} (expires in 12h)`);
    } else {
      // Buat contract baru untuk user yang belum pernah claim
      contract = await prisma.contract.create({
        data: {
          userId,
          planId:    freePlan.id,
          power:     freePlan.power,
          bonus:     freePlan.bonus,
          status:    "ACTIVE",
          expiresAt: BigInt(expiresAtMs),
          lastSyncAt: BigInt(nowMs),
        },
      });
      console.log(`[FreePlan] Created contract ${contract.id} for user ${userId} (expires in 12h)`);
    }

    return NextResponse.json({ success: true, contract: serializeContract(contract) });
  } catch (error) {
    console.error("Free plan activation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
