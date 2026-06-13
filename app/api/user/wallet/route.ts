import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Address } from "@ton/core";
import { createHmac } from "crypto";

/**
 * Normalize semua format TON address ke user-friendly non-bounceable (EQ...).
 */
function normalizeAddress(address: string): string {
  try {
    return Address.parse(address).toString({ bounceable: false, urlSafe: true });
  } catch {
    return address; // kembalikan apa adanya jika gagal parse
  }
}

/**
 * Verifikasi bahwa initData dari Telegram valid dan memiliki user.id yang sesuai.
 * Mencegah satu user mengubah wallet user lain (BUG-007).
 */
function verifyInitDataForUser(
  initData: string,
  botToken: string,
  expectedTelegramId: bigint
): boolean {
  try {
    const params = new URLSearchParams(initData);
    const hash   = params.get("hash");
    if (!hash) return false;

    params.delete("hash");

    const checkString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
    const computed  = createHmac("sha256", secretKey).update(checkString).digest("hex");

    if (computed !== hash) return false;

    // Pastikan user.id di initData cocok dengan pemilik akun
    const userParam = params.get("user");
    if (!userParam) return false;

    const tgUser = JSON.parse(userParam) as { id?: number };
    return BigInt(tgUser.id ?? 0) === expectedTelegramId;
  } catch {
    return false;
  }
}

/**
 * PATCH /api/user/wallet
 * Simpan atau hapus wallet address user.
 *
 * Body: { userId: string, walletAddress: string | null, initData?: string }
 *   - walletAddress berisi alamat TON jika wallet baru connect
 *   - walletAddress = null jika wallet disconnect
 *   - initData: Telegram Web App initData untuk verifikasi identitas
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, walletAddress, initData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // walletAddress boleh null (untuk disconnect), tapi harus ada di body
    if (!("walletAddress" in body)) {
      return NextResponse.json(
        { error: "walletAddress is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── Verifikasi identitas caller (BUG-007) ─────────────────────────────────
    const botToken = process.env.BOT_TOKEN;
    const isDevMode = !botToken || botToken === "dev";

    if (!isDevMode) {
      if (!initData) {
        return NextResponse.json(
          { error: "initData is required for wallet operations" },
          { status: 401 }
        );
      }

      if (!verifyInitDataForUser(initData, botToken, user.telegramId)) {
        return NextResponse.json(
          { error: "Unauthorized: initData mismatch" },
          { status: 401 }
        );
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        walletAddress: walletAddress
          ? normalizeAddress(walletAddress)
          : null,
      },
      select: { id: true, walletAddress: true },
    });

    console.log(
      `[Wallet] User ${userId} wallet ${walletAddress ? `set to ${walletAddress}` : "disconnected"}`
    );

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("[Wallet] Update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
