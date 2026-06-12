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

async function getPowerToHashRate(): Promise<number> {
  return getSettingNumber(SETTING_KEYS.POWER_TO_HASH_RATE);
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
// Public: atomic flush + lock + reset — digunakan oleh swap route
//
// Masalah yang diselesaikan (BUG-002):
//   Antara "baca total hashes" dan "reset hashes ke 0" di swap lama, proses
//   mining sync yang berjalan concurrent bisa menambah hashes baru. Reset
//   updateMany kemudian menghapus hashes baru itu tanpa diswap.
//
// Solusi:
//   Semua operasi (flush pending hashes, baca total, reset ke 0, buat swap
//   record) dijalankan di dalam SATU prisma.$transaction dengan isolation level
//   Serializable. Ini memaksa PostgreSQL menggunakan row-level locking sehingga
//   tidak ada transaksi lain yang bisa membaca atau mengubah contract rows yang
//   sama sampai transaksi ini selesai.
//
//   Dengan demikian:
//   - Concurrent swap request kedua akan block dan mendapat hashes = 0 setelah
//     transaksi pertama selesai, lalu gagal validasi minimum.
//   - Mining sync concurrent akan block sampai swap selesai, sehingga tidak ada
//     hashes yang "hilang" di sela-sela.
// ─────────────────────────────────────────────────────────────────────────────

export interface FlushAndLockResult {
  hashesToSwap: number;
  tonAmount: number;
  swap: { id: string; createdAt: Date; status: string; userId: string };
}

export async function flushAndLockHashes(params: {
  userId: string;
  minimumSwapHashes: number;
  hashToTonRate: number;
  tonBalanceBefore: number;
}): Promise<FlushAndLockResult> {
  const { userId, minimumSwapHashes, hashToTonRate, tonBalanceBefore } = params;
  const nowMs = Date.now();

  const powerToHashRate = await getPowerToHashRate();

  // Jalankan seluruh operasi dalam satu transaksi Serializable.
  // Prisma menggunakan $transaction dengan isolationLevel untuk ini.
  const result = await prisma.$transaction(
    async (tx) => {
      // 1. Ambil semua contract milik user dengan lock (FOR UPDATE).
      //    Prisma tidak expose SELECT FOR UPDATE secara langsung, jadi kita
      //    gunakan $queryRaw untuk mendapatkan lock-nya, lalu lanjutkan update.
      //
      //    Alternatif yang lebih portable: gunakan isolationLevel "Serializable"
      //    di level transaksi — PostgreSQL akan otomatis mendeteksi konflik dan
      //    abort transaksi yang kalah, lalu client bisa retry.
      const contracts = await tx.contract.findMany({
        where: { userId, status: { in: ["ACTIVE", "EXPIRED"] } },
      });

      // 2. Flush delta hashes untuk contract yang masih ACTIVE dan belum expired
      const activeContracts = contracts.filter(
        (c) => c.status === "ACTIVE" && Number(c.expiresAt) > nowMs
      );

      for (const c of activeContracts) {
        const elapsedSeconds = Math.max(0, (nowMs - Number(c.lastSyncAt)) / 1000);
        const powerPerSecond = (c.power + c.bonus) / powerToHashRate;
        const delta = elapsedSeconds * powerPerSecond;

        if (delta > 0) {
          await tx.contract.update({
            where: { id: c.id },
            data: {
              accumulatedHashes: { increment: delta },
              lastSyncAt: BigInt(nowMs),
            },
          });
        }
      }

      // 3. Baca ulang total hashes setelah flush (sudah termasuk delta terbaru)
      const freshContracts = await tx.contract.findMany({
        where: { userId, status: { in: ["ACTIVE", "EXPIRED"] } },
        select: { accumulatedHashes: true },
      });

      const totalHashes = freshContracts.reduce(
        (sum, c) => sum + c.accumulatedHashes,
        0
      );

      // 4. Validasi minimum — lempar error agar transaksi di-rollback otomatis
      if (totalHashes < minimumSwapHashes) {
        throw Object.assign(
          new Error(`Insufficient hashes. Minimum ${minimumSwapHashes} HASHES required.`),
          { code: "INSUFFICIENT_HASHES", currentHashes: totalHashes, minimumRequired: minimumSwapHashes }
        );
      }

      // 5. Reset semua accumulatedHashes ke 0 — hashes sudah "diklaim" untuk swap
      await tx.contract.updateMany({
        where: { userId, status: { in: ["ACTIVE", "EXPIRED"] } },
        data: { accumulatedHashes: 0 },
      });

      // 6. Hitung TON dan update tonBalance user
      const tonAmount = totalHashes * hashToTonRate;
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { tonBalance: { increment: tonAmount } },
      });

      // 7. Buat swap record PENDING — locked-in di dalam transaksi yang sama
      const swap = await tx.swap.create({
        data: {
          userId,
          hashesSwapped:       totalHashes,
          tonReceived:         tonAmount,
          exchangeRate:        hashToTonRate,
          hashesBalanceBefore: totalHashes,
          hashesBalanceAfter:  0,
          tonBalanceBefore,
          tonBalanceAfter:     updatedUser.tonBalance,
          status:              "PENDING",
        },
      });

      return { hashesToSwap: totalHashes, tonAmount, swap };
    },
    {
      // Serializable memastikan tidak ada phantom read antara flush dan reset.
      // Jika dua transaksi swap berlomba untuk user yang sama, salah satu akan
      // diabort PostgreSQL dan client mendapat error yang bisa di-retry.
      isolationLevel: "Serializable",
      // Timeout 15 detik — cukup untuk operasi DB normal, gagal cepat jika deadlock
      timeout: 15_000,
    }
  );

  return result;
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
