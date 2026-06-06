import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Use DIRECT_URL for seeder (pgBouncer doesn't support session-level operations)
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing plans
  await prisma.plan.deleteMany({});
  console.log("🗑️  Cleared existing plans");

  // Create plans
  const plans = [
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
    },
    {
      name: "17.6M",
      slug: "plan-17m6",
      power: 17600000,
      bonus: 8800000,
      bonusPercent: 50,
      price: 100,
      duration: 30,
      description: "Elite miners only - maximum power",
      finalReturn: "165.000 TON",
      badge: "+8.8M POWER",
      badgeColor: "#f5a623",
      order: 5,
      isActive: true,
    },
  ];

  for (const planData of plans) {
    const plan = await prisma.plan.create({
      data: planData,
    });

    console.log(`✅ Created plan: ${plan.name} (${plan.slug})`);
  }

  console.log("🎉 Seed completed successfully!");
  console.log(`📊 Total plans created: ${plans.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
