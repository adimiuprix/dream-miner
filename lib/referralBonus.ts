import { prisma } from "@/lib/prisma";
import { getSettingNumber, SETTING_KEYS } from "@/lib/settings";

async function getBonusConfig() {
  const [joinPower, purchasePercent] = await Promise.all([
    getSettingNumber(SETTING_KEYS.JOIN_BONUS_POWER, 2_000),
    getSettingNumber(SETTING_KEYS.PURCHASE_BONUS_PERCENT, 50),
  ]);
  return {
    joinBonusPower:       joinPower,
    purchaseBonusPercent: purchasePercent / 100, // stored as 50, used as 0.5
  };
}

export async function giveJoinBonus(referrerId: string): Promise<void> {
  try {
    const { joinBonusPower } = await getBonusConfig();

    const bonusPlan = await prisma.plan.findUnique({ where: { slug: "bonus" } });
    if (!bonusPlan) {
      console.warn("[ReferralBonus] Plan 'bonus' not found in DB. Run db:seed.");
      return;
    }

    const nowMs       = Date.now();
    const expiresAtMs = nowMs + 24 * 60 * 60 * 1000; // 1 day

    await prisma.contract.create({
      data: {
        userId: referrerId, planId: bonusPlan.id,
        power: joinBonusPower, bonus: 0, status: "ACTIVE",
        expiresAt: BigInt(expiresAtMs), lastSyncAt: BigInt(nowMs),
      },
    });

    console.log(`[ReferralBonus] JOIN bonus: ${joinBonusPower} power → referrer ${referrerId}`);
  } catch (err) {
    console.error("[ReferralBonus] giveJoinBonus error:", err);
  }
}

export async function givePurchaseBonus(
  referrerId: string,
  planPower: number,
  planBonus: number,
  planDurationDays: number
): Promise<void> {
  try {
    const { purchaseBonusPercent } = await getBonusConfig();

    const bonusPlan = await prisma.plan.findUnique({ where: { slug: "bonus" } });
    if (!bonusPlan) {
      console.warn("[ReferralBonus] Plan 'bonus' not found in DB. Run db:seed.");
      return;
    }

    const totalPlanPower = planPower + planBonus;
    const bonusPower     = Math.floor(totalPlanPower * purchaseBonusPercent);
    const nowMs          = Date.now();
    const expiresAtMs    = nowMs + planDurationDays * 24 * 60 * 60 * 1000;

    await prisma.contract.create({
      data: {
        userId: referrerId, planId: bonusPlan.id,
        power: bonusPower, bonus: 0, status: "ACTIVE",
        expiresAt: BigInt(expiresAtMs), lastSyncAt: BigInt(nowMs),
      },
    });

    console.log(
      `[ReferralBonus] PURCHASE bonus: ${bonusPower} power (${purchaseBonusPercent * 100}% of ${totalPlanPower}) → referrer ${referrerId}`
    );
  } catch (err) {
    console.error("[ReferralBonus] givePurchaseBonus error:", err);
  }
}

// ─── Export config for display (team page, etc.) ─────────────────────────────
export async function getReferralBonusConfig() {
  return getBonusConfig();
}
