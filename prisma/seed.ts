import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL!;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  console.log("🌱 Starting database seed...");

  const plans = [
    // ─── FREE PLAN ───────────────────────────────────────────────
    {
      name: "10K",
      slug: "plan-free",
      power: 10000,
      bonus: 0,
      bonusPercent: 0,
      price: 0,
      duration: 1,
      description: "Free starter plan — try mining for 1 day",
      finalReturn: null,
      badge: "FREE",
      badgeColor: "#22c55e",
      order: 0,
      isActive: true,
      isFree: true,
    },

    // ─── REFERRAL BONUS PLACEHOLDER ──────────────────────────────
    // Not shown in shop (isActive: false). Used internally as planId
    // for bonus contracts given to referrers.
    {
      name: "Referral Bonus",
      slug: "referral-bonus",
      power: 0,
      bonus: 0,
      bonusPercent: 0,
      price: 0,
      duration: 1,
      description: "Internal placeholder for referral bonus contracts",
      finalReturn: null,
      badge: null,
      badgeColor: null,
      order: 99,
      isActive: false,  // hidden from shop
      isFree: true,
    },

    // ─── PAID PLANS ──────────────────────────────────────────────
    {
      name: "118K",
      slug: "plan-118k",
      power: 118000,
      bonus: 0,
      bonusPercent: 0,
      price: 1,
      duration: 30,
      description: "Perfect for getting started with mining",
      finalReturn: "1.100 TON",
      badge: null,
      badgeColor: null,
      order: 1,
      isActive: true,
      isFree: false,
    },
    {
      name: "600K",
      slug: "plan-600k",
      power: 600000,
      bonus: 60000,
      bonusPercent: 10,
      price: 5,
      duration: 30,
      description: "Popular choice for serious miners",
      finalReturn: "5.610 TON",
      badge: "+60K POWER",
      badgeColor: "#00d4aa",
      order: 2,
      isActive: true,
      isFree: false,
    },
    {
      name: "1.2M",
      slug: "plan-1m2",
      power: 1200000,
      bonus: 120000,
      bonusPercent: 10,
      price: 10,
      duration: 30,
      description: "Professional mining power",
      finalReturn: "11.550 TON",
      badge: "+120K POWER",
      badgeColor: "#8b5cf6",
      order: 3,
      isActive: true,
      isFree: false,
    },
    {
      name: "3.7M",
      slug: "plan-3m7",
      power: 3700000,
      bonus: 1110000,
      bonusPercent: 30,
      price: 25,
      duration: 30,
      description: "Advanced mining with mega bonus",
      finalReturn: "34.375 TON",
      badge: "+1.11M POWER",
      badgeColor: "#8b5cf6",
      order: 4,
      isActive: true,
      isFree: false,
    },
    {
      name: "17.6M",
      slug: "plan-17m6",
      power: 17600000,
      bonus: 8800000,
      bonusPercent: 50,
      price: 100,
      duration: 30,
      description: "Elite miners only — maximum power",
      finalReturn: "165.000 TON",
      badge: "+8.8M POWER",
      badgeColor: "#f5a623",
      order: 5,
      isActive: true,
      isFree: false,
    },
  ];

  for (const planData of plans) {
    const plan = await prisma.plan.upsert({
      where: { slug: planData.slug },
      update: planData,
      create: planData,
    });

    const tag = plan.isFree ? "🆓 FREE" : `💰 ${plan.price} TON`;
    console.log(
      `  ✅ [${tag}] ${plan.name} POWER — ` +
      `${plan.duration}d — base: ${plan.power.toLocaleString()} + bonus: ${plan.bonus.toLocaleString()}`
    );
  }

  const total = await prisma.plan.count();
  console.log("");
  console.log("🎉 Seed completed!");
  console.log(`📊 Total plans in DB: ${total} (1 free + ${plans.length - 1} paid)`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
