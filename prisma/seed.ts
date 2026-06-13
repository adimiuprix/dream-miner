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
      duration: 1, // not used for expiry — see FREE_PLAN_DURATION_MS in purchase/free/route.ts
      description: "Free starter plan — try mining for 12 hours",
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

    const tag      = plan.isFree ? "🆓 FREE" : `💰 ${plan.price} TON`;
    const duration = plan.isFree ? "12h" : `${plan.duration}d`;
    console.log(
      `  ✅ [${tag}] ${plan.name} — ${duration} — power: ${plan.power.toLocaleString()} + bonus: ${plan.bonus.toLocaleString()}`
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
      metadata: JSON.stringify({ requiredReferrals: 1 }),
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
      metadata: JSON.stringify({ requiredReferrals: 5 }),
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
      metadata: JSON.stringify({ requiredReferrals: 10 }),
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

  // ─── App Settings ─────────────────────────────────────────────────────────
  console.log("\n🌱 Seeding app settings...\n");

  const settings = [
    // ── APP_CONFIG ─────────────────────────────────────────────────────────
    {
      key: "hash_to_ton_rate",
      value: "0.0000144",
      type: "NUMBER" as const,
      group: "APP_CONFIG" as const,
      label: "Hash → TON Rate",
      description: "1 HASH = X TON. Current: 1,000 HASHES = 0.0144 TON",
      isSecret: false,
    },
    {
      key: "minimum_swap_hashes",
      value: "1000",
      type: "NUMBER" as const,
      group: "APP_CONFIG" as const,
      label: "Minimum Swap (HASHES)",
      description: "Minimum accumulated hashes required to perform a swap",
      isSecret: false,
    },
    {
      key: "power_to_hash_rate",
      value: "100000",
      type: "NUMBER" as const,
      group: "APP_CONFIG" as const,
      label: "Power → Hash Rate",
      description: "How many POWER needed to generate 1 HASH per second. Default: 100,000",
      isSecret: false,
    },
    {
      key: "join_bonus_power",
      value: "2000",
      type: "NUMBER" as const,
      group: "APP_CONFIG" as const,
      label: "Referral Join Bonus (POWER)",
      description: "Flat power awarded to referrer when a new user joins via their link",
      isSecret: false,
    },
    {
      key: "purchase_bonus_percent",
      value: "50",
      type: "NUMBER" as const,
      group: "APP_CONFIG" as const,
      label: "Referral Purchase Bonus (%)",
      description: "Percentage of downline's purchased plan power given to referrer",
      isSecret: false,
    },
    {
      key: "payment_receiver_address",
      value: "EQC23M4PIfrYhh8FTrwUryFV_Accw-ZrTHFXhtEHvBQWJ_oD",
      type: "STRING" as const,
      group: "APP_CONFIG" as const,
      label: "Payment Receiver Address",
      description: "TON wallet address that receives user payments for plan purchases",
      isSecret: false,
    },

    // ── HOT_WALLET ─────────────────────────────────────────────────────────
    {
      key: "hot_wallet_mnemonic",
      value: "",
      type: "TEXT" as const,
      group: "HOT_WALLET" as const,
      label: "Hot Wallet Mnemonic",
      description: "24-word mnemonic of the wallet used to pay out swap TON to users",
      isSecret: true,
    },
    {
      key: "ton_network",
      value: "testnet",
      type: "STRING" as const,
      group: "HOT_WALLET" as const,
      label: "TON Network",
      description: "Use 'testnet' during development, 'mainnet' in production",
      isSecret: false,
    },
    {
      key: "ton_api_key",
      value: "",
      type: "STRING" as const,
      group: "HOT_WALLET" as const,
      label: "TON API Key",
      description: "API key for toncenter.com — required for on-chain operations",
      isSecret: true,
    },

    // ── TELEGRAM ────────────────────────────────────────────────────────────
    {
      key: "telegram_bot_token",
      value: "8901944453:AAG3kxWpi6b9-8dJM8KAyUi_NMLQx_TUqrU",
      type: "STRING" as const,
      group: "TELEGRAM" as const,
      label: "Bot Token",
      description: "Telegram bot token from @BotFather — used to send notifications",
      isSecret: true,
    },
    {
      key: "telegram_notify_chat_id",
      value: "",
      type: "STRING" as const,
      group: "TELEGRAM" as const,
      label: "Notification Chat ID",
      description: "Telegram channel/group ID that receives purchase & swap notifications",
      isSecret: false,
    },
    {
      key: "bot_username",
      value: "dreamminerz_bot",
      type: "STRING" as const,
      group: "TELEGRAM" as const,
      label: "Bot Username",
      description: "Public Telegram bot username (without @) — used for referral deep links",
      isSecret: false,
    },
  ];

  for (const s of settings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: {
        // Don't overwrite secrets on re-seed if already set
        ...(s.isSecret ? {} : { value: s.value }),
        type: s.type,
        group: s.group,
        label: s.label,
        description: s.description,
        isSecret: s.isSecret,
      },
      create: s,
    });

    const icon = s.isSecret ? "🔒" : "⚙️";
    console.log(`  ${icon} [${s.group}] ${s.key} = ${s.isSecret ? "***" : s.value}`);
  }

  const totalSettings = await prisma.appSetting.count();
  console.log(`\n📊 Total settings in DB: ${totalSettings}`);
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
