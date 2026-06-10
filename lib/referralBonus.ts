import { prisma } from "@/lib/prisma";

// ─── Konstanta bonus — single source of truth ────────────────────────────────
export const JOIN_BONUS_POWER       = 2_000;        // power flat saat downline join
export const PURCHASE_BONUS_PERCENT = 0.5;          // 50% dari power plan downline

export async function giveJoinBonus(referrerId: string): Promise<void> {
  try {
    const bonusPlan = await prisma.plan.findUnique({
      where: { slug: "bonus" },
    });

    if (!bonusPlan) {
      console.warn("[ReferralBonus] Plan 'bonus' not found in DB. Run db:seed.");
      return;
    }

    const nowMs       = Date.now();
    const durationMs  = 1 * 24 * 60 * 60 * 1000; // 1 hari
    const expiresAtMs = nowMs + durationMs;

    await prisma.contract.create({
      data: {
        userId:    referrerId,
        planId:    bonusPlan.id,
        power:     JOIN_BONUS_POWER,
        bonus:     0,
        status:    "ACTIVE",
        expiresAt: BigInt(expiresAtMs),
        lastSyncAt: BigInt(nowMs),
      },
    });

    console.log(
      `[ReferralBonus] JOIN bonus: ${JOIN_BONUS_POWER} power → referrer ${referrerId} (1 day)`
    );
  } catch (err) {
    // Bonus gagal tidak boleh menghentikan flow utama
    console.error("[ReferralBonus] giveJoinBonus error:", err);
  }
}

/**
 * Beri purchase bonus ke referrer saat downline beli plan berbayar.
 * Power bonus = 50% dari total power plan yang dibeli downline.
 * Durasi = ikut durasi plan yang dibeli downline.
 */
export async function givePurchaseBonus(
  referrerId: string,
  planPower: number,   // base power plan downline
  planBonus: number,   // bonus power plan downline
  planDurationDays: number
): Promise<void> {
  try {
    const bonusPlan = await prisma.plan.findUnique({
      where: { slug: "bonus" },
    });

    if (!bonusPlan) {
      console.warn("[ReferralBonus] Plan 'bonus' not found in DB. Run db:seed.");
      return;
    }

    const totalPlanPower  = planPower + planBonus;
    const bonusPower      = Math.floor(totalPlanPower * PURCHASE_BONUS_PERCENT);

    const nowMs       = Date.now();
    const durationMs  = planDurationDays * 24 * 60 * 60 * 1000;
    const expiresAtMs = nowMs + durationMs;

    await prisma.contract.create({
      data: {
        userId:     referrerId,
        planId:     bonusPlan.id,
        power:      bonusPower,
        bonus:      0,
        status:     "ACTIVE",
        expiresAt:  BigInt(expiresAtMs),
        lastSyncAt: BigInt(nowMs),
      },
    });

    console.log(
      `[ReferralBonus] PURCHASE bonus: ${bonusPower} power (50% of ${totalPlanPower}) ` +
      `→ referrer ${referrerId} (${planDurationDays} days)`
    );
  } catch (err) {
    console.error("[ReferralBonus] givePurchaseBonus error:", err);
  }
}
