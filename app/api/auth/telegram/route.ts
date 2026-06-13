import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { giveJoinBonus } from "@/lib/referralBonus";
import { getSetting, SETTING_KEYS } from "@/lib/settings";
import { createHmac } from "crypto";

/**
 * Verifikasi initData dari Telegram Web App menggunakan HMAC-SHA256.
 * Ref: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
function verifyTelegramInitData(initData: string, botToken: string): boolean {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return false;

    params.delete("hash");

    const checkString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
    const computedHash = createHmac("sha256", secretKey)
      .update(checkString)
      .digest("hex");

    return computedHash === hash;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initData, telegramId, username, firstName, lastName, languageCode, referralCode } = body;

    // ── Validasi initData dari Telegram (BUG-001) ─────────────────────────────
    // Bot token: coba env var dulu, fallback ke DB (AppSetting).
    let botToken = process.env.TELEGRAM_BOT_TOKEN ?? null;
    if (!botToken) {
      try {
        botToken = await getSetting(SETTING_KEYS.TELEGRAM_BOT_TOKEN);
      } catch {
        console.error("[Auth] telegram_bot_token not found in DB and BOT_TOKEN env not set");
        return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
      }
    }

    // Izinkan bypass di dev mode jika BOT_TOKEN = "dev"
    const isDevMode = botToken === "dev";

    if (!isDevMode) {
      if (!initData) {
        return NextResponse.json(
          { error: "initData is required" },
          { status: 400 }
        );
      }

      if (!verifyTelegramInitData(initData, botToken)) {
        return NextResponse.json(
          { error: "Invalid Telegram initData" },
          { status: 401 }
        );
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

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
          // Use new value from Telegram if provided, otherwise keep existing
          username: username !== undefined ? username : existingUser.username,
          firstName: firstName ?? existingUser.firstName,
          lastName: lastName !== undefined ? lastName : existingUser.lastName,
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
      const nowMs = Date.now();
      const expiredAtMs = nowMs - 1000; // expired 1 second ago

      await prisma.contract.create({
        data: {
          userId: newUser.id,
          planId: freePlan.id,
          power: freePlan.power,
          bonus: freePlan.bonus,
          status: "EXPIRED",
          expiresAt: BigInt(expiredAtMs),
          lastSyncAt: BigInt(expiredAtMs),
        },
      });

      console.log(
        `[Auth] New user ${newUser.id} — added expired free plan "${freePlan.name}"`
      );
    }

    // Give join bonus to referrer (fire-and-forget, tidak block response)
    if (referredById) {
      giveJoinBonus(referredById);
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

// BigInt cannot be serialized to JSON, so we convert it to string.
// Typed against Prisma User to ensure compile-time safety (BUG-019).
function serializeUser(user: {
  id: string;
  telegramId: bigint;
  username: string | null;
  firstName: string;
  lastName: string | null;
  languageCode: string | null;
  tonBalance: number;
  walletAddress: string | null;
  referralCode: string;
  referredById: string | null;
  lastPingAt: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...user,
    telegramId: String(user.telegramId),
  };
}
