import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Address } from "@ton/core";

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
 * PATCH /api/user/wallet
 * Simpan atau hapus wallet address user.
 *
 * Body: { userId: string, walletAddress: string | null }
 *   - walletAddress berisi alamat TON jika wallet baru connect
 *   - walletAddress = null jika wallet disconnect
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, walletAddress } = body;

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
