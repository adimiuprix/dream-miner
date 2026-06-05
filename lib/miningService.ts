/**
 * Mining Service
 * Handles mining calculations, offline mining, and power-based rates
 */

import { prisma } from "@/lib/prisma";

/**
 * Mining rate formula
 * 100,000 power = 1 hash per second
 * 600,000 power = 6 hashes per second
 * 1,200,000 power = 12 hashes per second
 */
const POWER_TO_HASH_RATE = 100000; // Divide power by this to get hashes/second

export interface MiningStats {
  totalPower: number;
  miningRate: number; // Hashes per second
  currentHashes: number;
  offlineHashes: number;
  lastPingAt: Date;
}

/**
 * Calculate user's current mining stats with offline mining
 */
export async function calculateMiningStats(userId: string): Promise<MiningStats | null> {
  try {
    // Get user with active contracts
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        contracts: {
          where: {
            status: "ACTIVE",
            expiresAt: {
              gt: new Date(), // Only non-expired contracts
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    // Calculate total active power (base + bonus from all active contracts)
    const totalPower = user.contracts.reduce(
      (sum, contract) => sum + contract.power + contract.bonus,
      0
    );

    // Calculate mining rate (hashes per second)
    const miningRate = totalPower / POWER_TO_HASH_RATE;

    // Calculate offline mining (time since last ping)
    const now = new Date();
    const lastPing = user.lastPingAt || user.createdAt;
    const secondsOffline = Math.floor((now.getTime() - lastPing.getTime()) / 1000);

    // Calculate hashes earned while offline (max 24 hours)
    const maxOfflineSeconds = 24 * 60 * 60; // 24 hours
    const effectiveOfflineSeconds = Math.min(secondsOffline, maxOfflineSeconds);
    const offlineHashes = miningRate * effectiveOfflineSeconds;

    return {
      totalPower,
      miningRate,
      currentHashes: user.hashes,
      offlineHashes,
      lastPingAt: lastPing,
    };
  } catch (error) {
    console.error("[MiningService] Calculate stats error:", error);
    return null;
  }
}

/**
 * Sync mining progress to database
 * Updates hashes and last ping time
 */
export async function syncMiningProgress(userId: string): Promise<MiningStats | null> {
  try {
    const stats = await calculateMiningStats(userId);

    if (!stats) {
      return null;
    }

    // Update user with new hashes and reset lastPingAt
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        hashes: {
          increment: stats.offlineHashes,
        },
        power: stats.totalPower, // Update current power
        lastPingAt: new Date(),
      },
    });

    console.log(
      `[MiningService] Synced user ${userId}: +${stats.offlineHashes.toFixed(2)} hashes ` +
      `(rate: ${stats.miningRate.toFixed(2)}/s, power: ${stats.totalPower})`
    );

    return {
      ...stats,
      currentHashes: updatedUser.hashes,
      offlineHashes: stats.offlineHashes,
    };
  } catch (error) {
    console.error("[MiningService] Sync error:", error);
    return null;
  }
}

/**
 * Get user's current mining status
 * Without updating database (read-only)
 */
export async function getMiningStatus(userId: string): Promise<MiningStats | null> {
  return calculateMiningStats(userId);
}

/**
 * Calculate expected hashes after X seconds
 */
export function calculateFutureHashes(
  currentHashes: number,
  miningRate: number,
  seconds: number
): number {
  return currentHashes + miningRate * seconds;
}
