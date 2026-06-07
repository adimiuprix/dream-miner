/**
 * Mining Service — Lazy Accumulation
 *
 * Setiap contract menyimpan:
 *   - accumulatedHashes : hashes yang sudah dihitung sampai lastSyncAt
 *   - lastSyncAt        : timestamp terakhir akumulasi dihitung
 *
 * Total hashes user = SUM(accumulatedHashes) di semua contract miliknya
 *                   + hashes "dalam perjalanan" sejak lastSyncAt terakhir
 *
 * Formula per contract (saat sync):
 *   delta              = (now - lastSyncAt) * powerPerSecond
 *   accumulatedHashes += delta
 *   lastSyncAt         = now
 *
 * Formula di client (animasi real-time, tanpa request):
 *   display = totalAccumulated + (now - newestLastSyncAt) * miningRate
 */

import { prisma } from "@/lib/prisma";

/** 100 000 power = 1 hash/detik */
const POWER_TO_HASH_RATE = 100_000;

export interface MiningStats {
  totalPower: number;
  miningRate: number;       // hashes per second
  currentHashes: number;    // total accumulated (sudah tersimpan di DB)
  pendingHashes: number;    // hashes sejak lastSyncAt (belum di-flush ke DB)
  lastSyncAt: Date;         // untuk baseline animasi client
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helper: flush semua contract aktif milik userId
// ─────────────────────────────────────────────────────────────────────────────
async function flushActiveContracts(userId: string, now: Date): Promise<void> {
  const contracts = await prisma.contract.findMany({
    where: {
      userId,
      status: "ACTIVE",
      expiresAt: { gt: now },
    },
  });

  if (contracts.length === 0) return;

  // Hitung delta per contract dan update secara paralel
  await Promise.all(
    contracts.map((c) => {
      const elapsedSeconds = Math.max(
        0,
        (now.getTime() - new Date(c.lastSyncAt).getTime()) / 1000
      );
      const powerPerSecond = (c.power + c.bonus) / POWER_TO_HASH_RATE;
      const delta = elapsedSeconds * powerPerSecond;

      return prisma.contract.update({
        where: { id: c.id },
        data: {
          accumulatedHashes: { increment: delta },
          lastSyncAt: now,
        },
      });
    })
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: sync — flush ke DB lalu kembalikan stats terbaru
// ─────────────────────────────────────────────────────────────────────────────
export async function syncMiningProgress(userId: string): Promise<MiningStats | null> {
  try {
    const now = new Date();

    // 1. Flush semua contract aktif
    await flushActiveContracts(userId, now);

    // 2. Baca ulang untuk mendapatkan nilai terbaru
    return getMiningStatus(userId);
  } catch (error) {
    console.error("[MiningService] syncMiningProgress error:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: read-only — hitung stats tanpa menulis ke DB
// ─────────────────────────────────────────────────────────────────────────────
export async function getMiningStatus(userId: string): Promise<MiningStats | null> {
  try {
    const now = new Date();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        contracts: {
          where: { status: { in: ["ACTIVE", "EXPIRED"] } },
        },
      },
    });

    if (!user) return null;

    const activeContracts = user.contracts.filter(
      (c) => c.status === "ACTIVE" && new Date(c.expiresAt) > now
    );

    // Total power dari contract aktif
    const totalPower = activeContracts.reduce(
      (sum, c) => sum + c.power + c.bonus,
      0
    );
    const miningRate = totalPower / POWER_TO_HASH_RATE;

    // Total hashes yang sudah di-flush di semua contract (aktif + expired)
    const currentHashes = user.contracts.reduce(
      (sum, c) => sum + c.accumulatedHashes,
      0
    );

    // Hashes "dalam perjalanan" dari contract aktif sejak lastSyncAt terakhir
    const pendingHashes = activeContracts.reduce((sum, c) => {
      const elapsed = Math.max(
        0,
        (now.getTime() - new Date(c.lastSyncAt).getTime()) / 1000
      );
      return sum + elapsed * ((c.power + c.bonus) / POWER_TO_HASH_RATE);
    }, 0);

    // lastSyncAt terbaru dari semua contract aktif (untuk baseline animasi)
    const lastSyncAt =
      activeContracts.length > 0
        ? new Date(
            Math.max(...activeContracts.map((c) => new Date(c.lastSyncAt).getTime()))
          )
        : now;

    return { totalPower, miningRate, currentHashes, pendingHashes, lastSyncAt };
  } catch (error) {
    console.error("[MiningService] getMiningStatus error:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: mark expired contracts (dipanggil oleh cron)
// ─────────────────────────────────────────────────────────────────────────────
export async function markExpiredContracts(): Promise<string[]> {
  try {
    const now = new Date();

    const expiredContracts = await prisma.contract.findMany({
      where: { status: "ACTIVE", expiresAt: { lte: now } },
      select: { id: true, userId: true },
    });

    if (expiredContracts.length === 0) return [];

    // Flush hashes terakhir sebelum di-expire
    const uniqueUserIds = [...new Set(expiredContracts.map((c) => c.userId))];
    await Promise.all(uniqueUserIds.map((uid) => flushActiveContracts(uid, now)));

    // Tandai EXPIRED
    await prisma.contract.updateMany({
      where: { id: { in: expiredContracts.map((c) => c.id) } },
      data: { status: "EXPIRED" },
    });

    console.log(
      `[MiningService] Marked ${expiredContracts.length} contracts as EXPIRED. ` +
      `Affected users: ${uniqueUserIds.length}`
    );

    return uniqueUserIds;
  } catch (error) {
    console.error("[MiningService] markExpiredContracts error:", error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: utility — total power aktif user (tanpa full stats)
// ─────────────────────────────────────────────────────────────────────────────
export async function getUserActivePower(userId: string): Promise<number> {
  try {
    const contracts = await prisma.contract.findMany({
      where: { userId, status: "ACTIVE", expiresAt: { gt: new Date() } },
    });
    return contracts.reduce((sum, c) => sum + c.power + c.bonus, 0);
  } catch (error) {
    console.error("[MiningService] getUserActivePower error:", error);
    return 0;
  }
}
