/**
 * Lazy Cron Service
 * Runs maintenance jobs when app is accessed (lazy evaluation)
 * No external cron service needed!
 */

import { prisma } from "@/lib/prisma";

// Cron job configurations
const CRON_CONFIG = {
  // Run contract expiry check every 1 hour
  CONTRACT_EXPIRY: {
    interval: 60 * 60 * 1000, // 1 hour in milliseconds
    lastRun: 0,
  },
  // Run cleanup every 6 hours
  CLEANUP: {
    interval: 6 * 60 * 60 * 1000, // 6 hours
    lastRun: 0,
  },
};

// In-memory cache for last run times
let cronState = {
  contractExpiry: 0,
  cleanup: 0,
  isRunning: false,
};

/**
 * Main lazy cron trigger
 * Call this in layout or middleware
 */
export async function triggerLazyCron(): Promise<void> {
  // Prevent concurrent runs
  if (cronState.isRunning) {
    return;
  }

  const now = Date.now();
  const jobsToRun: Promise<void>[] = [];

  // Check contract expiry job
  if (now - cronState.contractExpiry > CRON_CONFIG.CONTRACT_EXPIRY.interval) {
    console.log("[LazyCron] Running contract expiry check...");
    cronState.contractExpiry = now;
    jobsToRun.push(expireContracts());
  }

  // Check cleanup job
  if (now - cronState.cleanup > CRON_CONFIG.CLEANUP.interval) {
    console.log("[LazyCron] Running cleanup...");
    cronState.cleanup = now;
    jobsToRun.push(cleanupOldData());
  }

  // Run all jobs in background (non-blocking)
  if (jobsToRun.length > 0) {
    cronState.isRunning = true;
    Promise.all(jobsToRun)
      .then(() => {
        console.log("[LazyCron] All jobs completed");
      })
      .catch((error) => {
        console.error("[LazyCron] Job error:", error);
      })
      .finally(() => {
        cronState.isRunning = false;
      });
  }
}

/**
 * Expire contracts that have passed their expiry date
 */
async function expireContracts(): Promise<void> {
  try {
    const nowMs = Date.now();

    // Find all active contracts that should be expired
    const result = await prisma.contract.updateMany({
      where: {
        status: "ACTIVE",
        expiresAt: {
          lt: BigInt(nowMs),
        },
      },
      data: {
        status: "EXPIRED",
      },
    });

    if (result.count === 0) {
      console.log("[LazyCron] No contracts to expire");
      return;
    }

    console.log(`[LazyCron] Successfully expired ${result.count} contracts`);
    
    // Note: User.power field removed - power is calculated dynamically from active contracts
    // No need to update user power when contracts expire
  } catch (error) {
    console.error("[LazyCron] Error in expireContracts:", error);
  }
}

/**
 * Cleanup old data (optional - for housekeeping)
 */
async function cleanupOldData(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Clean up old PENDING transactions (older than 30 days)
    const deletedTransactions = await prisma.transaction.deleteMany({
      where: {
        status: "PENDING",
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    if (deletedTransactions.count > 0) {
      console.log(
        `[LazyCron] Cleaned up ${deletedTransactions.count} old PENDING transactions`
      );
    }

    // You can add more cleanup tasks here:
    // - Delete old FAILED transactions
    // - Archive old expired contracts
    // - Clean up orphaned records
    // etc.

  } catch (error) {
    console.error("[LazyCron] Error in cleanupOldData:", error);
  }
}

/**
 * Get cron status (for debugging/admin)
 */
export function getCronStatus() {
  return {
    contractExpiry: {
      lastRun: new Date(cronState.contractExpiry).toISOString(),
      nextRun: new Date(
        cronState.contractExpiry + CRON_CONFIG.CONTRACT_EXPIRY.interval
      ).toISOString(),
    },
    cleanup: {
      lastRun: new Date(cronState.cleanup).toISOString(),
      nextRun: new Date(
        cronState.cleanup + CRON_CONFIG.CLEANUP.interval
      ).toISOString(),
    },
    isRunning: cronState.isRunning,
  };
}

/**
 * Force run all cron jobs (for testing/admin)
 */
export async function forceRunCronJobs(): Promise<void> {
  console.log("[LazyCron] Force running all cron jobs...");
  
  // Reset last run times to force execution
  cronState.contractExpiry = 0;
  cronState.cleanup = 0;
  
  await triggerLazyCron();
}

/**
 * Run specific job manually (for testing)
 */
export async function runJobManually(jobName: "expireContracts" | "cleanup"): Promise<void> {
  console.log(`[LazyCron] Manually running job: ${jobName}`);
  
  if (jobName === "expireContracts") {
    await expireContracts();
  } else if (jobName === "cleanup") {
    await cleanupOldData();
  }
}
