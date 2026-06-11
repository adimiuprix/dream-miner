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

    {
      name: "Bonus",
      slug: "bonus",
      power: 0,
      bonus: 0,
      bonusPercent: 0,
      price: 0,
      duration: 1,
      description: "Internal placeholder for all bonus contracts",
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
      `  ✅ [${tag}] ${plan.name} — ${plan.duration}d — power: ${plan.power.toLocaleString()} + bonus: ${plan.bonus.toLocaleString()}`
    );
  }

  const totalPlans = await prisma.plan.count();
  console.log(`\n📊 Total plans in DB: ${totalPlans}\n`);

  // ─── Tasks ────────────────────────────────────────────────────────────────
  console.log("🌱 Seeding tasks...\n");

  const tasks = [
    // ── Social ───────────────────────────────────────────────────────────────
    {
      id: "task-join-telegram",
      title: "Join our Telegram channel",
      description: "Subscribe to our official Telegram channel for updates",
      type: "SOCIAL" as const,
      reward: 5_000,
      link: "https://t.me/DreamMinerOfficial",
      isActive: true,
      isRepeatable: false,
      repeatCooldownHours: 0,
      order: 1,
    },
    {
      id: "task-join-community",
      title: "Join Telegram community group",
      description: "Be part of our growing community",
      type: "SOCIAL" as const,
      reward: 3_000,
      link: "https://t.me/DreamMinerCommunity",
      isActive: true,
      isRepeatable: false,
      repeatCooldownHours: 0,
      order: 2,
    },
    {
      id: "task-follow-twitter",
      title: "Follow us on X (Twitter)",
      description: "Follow @DreamMinerTON for the latest news",
      type: "SOCIAL" as const,
      reward: 3_000,
      link: "https://x.com/DreamMinerTON",
      isActive: true,
      isRepeatable: false,
      repeatCooldownHours: 0,
      order: 3,
    },

    // ── Referral ─────────────────────────────────────────────────────────────
    {
      id: "task-invite-1",
      title: "Invite your first friend",
      description: "Get 1 friend to join via your referral link",
      type: "REFERRAL" as const,
      reward: 10_000,
      link: null,
      isActive: true,
      isRepeatable: false,
      repeatCooldownHours: 0,
      order: 10,
    },
    {
      id: "task-invite-5",
      title: "Invite 5 friends",
      description: "Grow your team to 5 active members",
      type: "REFERRAL" as const,
      reward: 25_000,
      link: null,
      isActive: true,
      isRepeatable: false,
      repeatCooldownHours: 0,
      order: 11,
    },
    {
      id: "task-invite-10",
      title: "Invite 10 friends",
      description: "Build a team of 10 active referrals",
      type: "REFERRAL" as const,
      reward: 60_000,
      link: null,
      isActive: true,
      isRepeatable: false,
      repeatCooldownHours: 0,
      order: 12,
    },

    // ── Daily ─────────────────────────────────────────────────────────────────
    {
      id: "task-daily-checkin",
      title: "Daily check-in",
      description: "Open the app every day to claim your bonus",
      type: "DAILY" as const,
      reward: 1_000,
      link: null,
      isActive: true,
      isRepeatable: true,
      repeatCooldownHours: 24,
      order: 20,
    },

    // ── Purchase ──────────────────────────────────────────────────────────────
    {
      id: "task-buy-first-plan",
      title: "Buy your first plan",
      description: "Purchase any paid Power plan from the shop",
      type: "PURCHASE" as const,
      reward: 15_000,
      link: null,
      isActive: true,
      isRepeatable: false,
      repeatCooldownHours: 0,
      order: 30,
    },
    {
      id: "task-connect-wallet",
      title: "Connect your TON wallet",
      description: "Link a TON wallet to your account",
      type: "PURCHASE" as const,
      reward: 2_000,
      link: null,
      isActive: true,
      isRepeatable: false,
      repeatCooldownHours: 0,
      order: 31,
    },
  ];

  for (const taskData of tasks) {
    const task = await prisma.task.upsert({
      where: { id: taskData.id },
      update: taskData,
      create: taskData,
    });

    const typeIcon: Record<string, string> = {
      SOCIAL:   "📣",
      REFERRAL: "👥",
      DAILY:    "📅",
      PURCHASE: "🛒",
    };

    const repeat = task.isRepeatable ? ` (repeatable ${task.repeatCooldownHours}h)` : "";
    console.log(
      `  ${typeIcon[task.type] ?? "✅"} [${task.type}] ${task.title} — +${task.reward.toLocaleString()} POWER${repeat}`
    );
  }

  const totalTasks = await prisma.task.count();
  console.log(`\n📊 Total tasks in DB: ${totalTasks}`);
  console.log("\n🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
