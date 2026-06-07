import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  joinedAt: string;
  isPremium: boolean; // has at least one non-free ACTIVE contract
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
  totalReferred: number;  // total referrals
  validMembers: number;   // referrals with ACTIVE contract (non-free)
  pendingMembers: number; // referrals with no active non-free contract
  totalPowerEarned: number;
}

export interface TeamData {
  stats: TeamStats;
  members: TeamMember[];
  powerLog: PowerLogEntry[];
  referralCode: string;
}

/**
 * GET /api/team?userId=xxx
 * Returns referral stats, member list, and power log for a user.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Get current user (for referralCode)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all referred users with their contracts and transactions
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
            amount: true,
            createdAt: true,
            metadata: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Build member list
    const members: TeamMember[] = referrals.map((r) => {
      const name =
        r.username ||
        [r.firstName, r.lastName].filter(Boolean).join(" ");

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

    // Stats
    const validMembers = members.filter((m) => m.isPremium).length;
    const pendingMembers = members.length - validMembers;

    // Power earned: 2000 per referral join + 4000 per premium member
    // (matching the BonusCards display values)
    const REFERRAL_BONUS = 2000;
    const PREMIUM_BONUS = 4000;
    const totalPowerEarned =
      members.length * REFERRAL_BONUS + validMembers * PREMIUM_BONUS;

    const stats: TeamStats = {
      totalReferred: members.length,
      validMembers,
      pendingMembers,
      totalPowerEarned,
    };

    // Build power log — one entry per join + one per purchase
    const powerLog: PowerLogEntry[] = [];

    for (const r of referrals) {
      const name =
        r.username ||
        [r.firstName, r.lastName].filter(Boolean).join(" ");

      // Join event
      powerLog.push({
        id: `join-${r.id}`,
        type: "referral_join",
        memberName: name,
        powerEarned: REFERRAL_BONUS,
        date: r.createdAt.toISOString(),
      });

      // Purchase events
      for (const tx of r.transactions) {
        powerLog.push({
          id: `purchase-${tx.id}`,
          type: "referral_purchase",
          memberName: name,
          powerEarned: PREMIUM_BONUS,
          date: tx.createdAt.toISOString(),
        });
      }
    }

    // Sort power log newest first
    powerLog.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({
      success: true,
      data: {
        stats,
        members,
        powerLog,
        referralCode: currentUser.referralCode,
      } satisfies TeamData,
    });
  } catch (error) {
    console.error("Team error:", error);
    return NextResponse.json(
      { error: "Failed to fetch team data" },
      { status: 500 }
    );
  }
}
