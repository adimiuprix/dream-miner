import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getReferralBonusConfig } from "@/lib/referralBonus";

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  joinedAt: string;
  isPremium: boolean;
  totalPower: number;
}

export interface PowerLogEntry {
  id: string;
  type: "referral_join" | "referral_purchase";
  memberName: string;
  powerEarned: number;
  date: string;
}

export interface TeamStats {
  totalReferred: number;
  validMembers: number;
  pendingMembers: number;
  totalPowerEarned: number; // actual dari bonus contracts di DB
}

export interface BonusConfig {
  joinBonusPower: number;       // flat power saat downline join
  purchaseBonusPercent: number; // persentase dari power plan downline (0–100)
}

export interface TeamData {
  stats: TeamStats;
  members: TeamMember[];
  powerLog: PowerLogEntry[];
  referralCode: string;
  bonusConfig: BonusConfig;
}

/**
 * GET /api/team?userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── Referrals dengan contracts + transactions ────────────────────────────
    const referrals = await prisma.user.findMany({
      where: { referredById: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        createdAt: true,
        contracts: {
          select: {
            power: true,
            bonus: true,
            status: true,
            plan: { select: { isFree: true } },
          },
        },
        transactions: {
          where: { status: "COMPLETED", type: "PURCHASE_POWER" },
          select: {
            id: true,
            createdAt: true,
            metadata: true, // berisi planId, power
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ── Member list ──────────────────────────────────────────────────────────
    const members: TeamMember[] = referrals.map((r) => {
      const name = r.username || [r.firstName, r.lastName].filter(Boolean).join(" ");
      const nameParts = name.trim().split(" ");
      const avatar =
        nameParts.length >= 2
          ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
          : name.slice(0, 2).toUpperCase();

      const hasActiveNonFree = r.contracts.some(
        (c) => c.status === "ACTIVE" && !c.plan.isFree
      );
      const totalPower = r.contracts
        .filter((c) => c.status === "ACTIVE")
        .reduce((sum, c) => sum + c.power + c.bonus, 0);

      return {
        id: r.id,
        name,
        avatar,
        joinedAt: r.createdAt.toISOString(),
        isPremium: hasActiveNonFree,
        totalPower,
      };
    });

    // ── Stats: totalPowerEarned dari bonus contracts aktual di DB ────────────
    const bonusContracts = await prisma.contract.findMany({
      where: {
        userId,
        plan: { slug: "bonus" },
      },
      select: { power: true },
    });

    const totalPowerEarned = bonusContracts.reduce((sum, c) => sum + c.power, 0);

    const validMembers   = members.filter((m) => m.isPremium).length;
    const pendingMembers = members.length - validMembers;

    const stats: TeamStats = {
      totalReferred:   members.length,
      validMembers,
      pendingMembers,
      totalPowerEarned,
    };

    // ── Power log ────────────────────────────────────────────────────────────
    const powerLog: PowerLogEntry[] = [];

    const { joinBonusPower, purchaseBonusPercent } = await getReferralBonusConfig();

    for (const r of referrals) {
      const name = r.username || [r.firstName, r.lastName].filter(Boolean).join(" ");

      // Join event — flat bonus
      powerLog.push({
        id:          `join-${r.id}`,
        type:        "referral_join",
        memberName:  name,
        powerEarned: joinBonusPower,
        date:        r.createdAt.toISOString(),
      });

      // Purchase events — % dari power plan yang dibeli
      for (const tx of r.transactions) {
        const meta      = JSON.parse(tx.metadata || "{}");
        const planPower = (meta.power as number | undefined) ?? 0;
        const earned    = Math.floor(planPower * purchaseBonusPercent);

        powerLog.push({
          id:          `purchase-${tx.id}`,
          type:        "referral_purchase",
          memberName:  name,
          powerEarned: earned,
          date:        tx.createdAt.toISOString(),
        });
      }
    }

    powerLog.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // ── Bonus config untuk display di UI ─────────────────────────────────────
    const bonusConfig: BonusConfig = {
      joinBonusPower,
      purchaseBonusPercent: Math.round(purchaseBonusPercent * 100),
    };

    return NextResponse.json({
      success: true,
      data: {
        stats,
        members,
        powerLog,
        referralCode: currentUser.referralCode,
        bonusConfig,
      } satisfies TeamData,
    });
  } catch (error) {
    console.error("Team error:", error);
    return NextResponse.json({ error: "Failed to fetch team data" }, { status: 500 });
  }
}
