import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  power: number;
}

/**
 * GET /api/leaderboard
 * Returns top 9 users sorted by total power from ACTIVE contracts.
 * Power = sum of (contract.power + contract.bonus) for all ACTIVE contracts.
 */
export async function GET() {
  try {
    // Fetch all users that have at least one ACTIVE contract that hasn't expired yet,
    // including their active non-expired contracts to calculate total power.
    const nowMs = BigInt(Date.now());
    const users = await prisma.user.findMany({
      where: {
        contracts: {
          some: { status: "ACTIVE", expiresAt: { gt: nowMs } },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        contracts: {
          // BUG-010: filter expiresAt agar contract yang sudah lewat tidak ikut terhitung
          where: { status: "ACTIVE", expiresAt: { gt: nowMs } },
          select: {
            power: true,
            bonus: true,
          },
        },
      },
    });

    // Calculate total power per user and sort descending
    const ranked = users
      .map((user) => {
        const totalPower = user.contracts.reduce(
          (sum, c) => sum + c.power + c.bonus,
          0
        );

        // Build display name: prefer username, else firstName + lastName
        const name =
          user.username ||
          [user.firstName, user.lastName].filter(Boolean).join(" ");

        // Build avatar initials (up to 2 chars)
        const nameParts = name.trim().split(" ");
        const avatar =
          nameParts.length >= 2
            ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
            : name.slice(0, 2).toUpperCase();

        return {
          userId: user.id,
          name,
          avatar,
          power: totalPower,
        };
      })
      .sort((a, b) => b.power - a.power)
      .slice(0, 9)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    return NextResponse.json({
      success: true,
      leaderboard: ranked,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
