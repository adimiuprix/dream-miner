/**
 * Mining Service — Lazy Accumulation
 *
 * Setiap contract menyimpan:
 *   - accumulatedHashes : hashes yang sudah dihitung sampai lastSyncAt
 *   - lastSyncAt        : Unix timestamp (ms) terakhir akumulasi dihitung
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
import { getSettingNumber, SETTING_KEYS } from "@/lib/settings";

const DEFAULT_POWER_TO_HASH_RATE = 100_000;

async function getPowerToHashRate(): Promise<number> {
  return getSettingNumber(SETTING_KEYS.POWER_TO_HASH_RATE, DEFAULT_POWER_TO_HASH_RATE);
}

export interface MiningStats {
  totalPower: number;
  miningRate: number;       // hashes per second
  currentHashes: number;    // total accumulated (sudah tersimpan di DB)
  pendingHashes: number;    // hashes sejak lastSyncAt (belum di-flush ke DB)
  lastSyncAt: number;       // Unix timestamp (ms) untuk baseline animasi client
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helper: flush semua contract aktif milik userId
// ─────────────────────────────────────────────────────────────────────────────
async function flushActiveContracts(userId: string, nowMs: number): Promise<void> {
  const [contracts, powerToHashRate] = await Promise.all([
    prisma.contract.findMany({
      where: { userId, status: "ACTIVE", expiresAt: { gt: BigInt(nowMs) } },
    }),
    getPowerToHashRate(),
  ]);

  if (contracts.length === 0) return;

  // Hitung delta per contract dan update secara paralel
  await Promise.all(
    contracts.map((c) => {
      const elapsedSeconds = Math.max(0, (nowMs - Number(c.lastSyncAt)) / 1000);
      const powerPerSecond = (c.power + c.bonus) / powerToHashRate;
      const delta = elapsedSeconds * powerPerSecond;

      return prisma.contract.update({
        where: { id: c.id },
        data: {
          accumulatedHashes: { increment: delta },
          lastSyncAt: BigInt(nowMs),
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
    const nowMs = Date.now();

    // 1. Flush semua contract aktif
    await flushActiveContracts(userId, nowMs);

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
    const nowMs = Date.now();
    const powerToHashRate = await getPowerToHashRate();

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
      (c) => c.status === "ACTIVE" && Number(c.expiresAt) > nowMs
    );

    const totalPower = activeContracts.reduce((sum, c) => sum + c.power + c.bonus, 0);
    const miningRate = totalPower / powerToHashRate;

    // Total hashes yang sudah di-flush di semua contract (aktif + expired)
    const currentHashes = user.contracts.reduce(
      (sum, c) => sum + c.accumulatedHashes,
      0
    );

    const pendingHashes = activeContracts.reduce((sum, c) => {
      const elapsed = Math.max(0, (nowMs - Number(c.lastSyncAt)) / 1000);
      return sum + elapsed * ((c.power + c.bonus) / powerToHashRate);
    }, 0);

    // lastSyncAt terbaru dari semua contract aktif (untuk baseline animasi)
    const lastSyncAt =
      activeContracts.length > 0
        ? Math.max(...activeContracts.map((c) => Number(c.lastSyncAt)))
        : nowMs;

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
    const nowMs = Date.now();

    const expiredContracts = await prisma.contract.findMany({
      where: { status: "ACTIVE", expiresAt: { lte: BigInt(nowMs) } },
      select: { id: true, userId: true },
    });

    if (expiredContracts.length === 0) return [];

    // Flush hashes terakhir sebelum di-expire
    const uniqueUserIds = [...new Set(expiredContracts.map((c) => c.userId))];
    await Promise.all(uniqueUserIds.map((uid) => flushActiveContracts(uid, nowMs)));

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
    const nowMs = Date.now();
    const contracts = await prisma.contract.findMany({
      where: { userId, status: "ACTIVE", expiresAt: { gt: BigInt(nowMs) } },
    });
    return contracts.reduce((sum, c) => sum + c.power + c.bonus, 0);
  } catch (error) {
    console.error("[MiningService] getUserActivePower error:", error);
    return 0;
  }
}
