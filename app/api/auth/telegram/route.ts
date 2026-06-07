import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { telegramId, username, firstName, lastName, languageCode, referralCode } = body;

    if (!telegramId || !firstName) {
      return NextResponse.json(
        { error: "telegramId and firstName are required" },
        { status: 400 }
      );
    }

    // Try to find existing user by telegramId
    const existingUser = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });

    if (existingUser) {
      // Existing user — update lastPingAt and return
      const updated = await prisma.user.update({
        where: { telegramId: BigInt(telegramId) },
        data: {
          lastPingAt: new Date(),
          // Also update profile info in case it changed
          username: username || existingUser.username,
          firstName: firstName || existingUser.firstName,
          lastName: lastName ?? existingUser.lastName,
        },
      });

      return NextResponse.json({
        user: serializeUser(updated),
        isNewUser: false,
      });
    }

    // New user — resolve referrer if referralCode provided
    let referredById: string | null = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode },
        select: { id: true },
      });
      if (referrer) {
        referredById = referrer.id;
      } else {
        console.warn(`[Auth] referralCode "${referralCode}" not found, ignoring.`);
      }
    }

    // New user — create in database
    const newUser = await prisma.user.create({
      data: {
        telegramId: BigInt(telegramId),
        username: username || null,
        firstName,
        lastName: lastName || null,
        languageCode: languageCode || null,
        referredById,
      },
    });

    // Give new user the free plan as an expired contract
    const freePlan = await prisma.plan.findFirst({
      where: { isFree: true, isActive: true },
      orderBy: { order: "asc" },
    });

    if (freePlan) {
      const expiredAt = new Date(); // already expired (now = past)
      expiredAt.setSeconds(expiredAt.getSeconds() - 1);

      await prisma.contract.create({
        data: {
          userId: newUser.id,
          planId: freePlan.id,
          power: freePlan.power,
          price: 0,
          bonus: freePlan.bonus,
          status: "EXPIRED",
          expiresAt: expiredAt,
        },
      });

      console.log(
        `[Auth] New user ${newUser.id} — added expired free plan "${freePlan.name}"`
      );
    }

    return NextResponse.json({
      user: serializeUser(newUser),
      isNewUser: true,
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// BigInt cannot be serialized to JSON, so we convert it to string
function serializeUser(user: Record<string, unknown>) {
  return {
    ...user,
    telegramId: String(user.telegramId),
  };
}
