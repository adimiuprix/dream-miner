/**
 * Quick setup for Telegram validation tasks
 * Usage: npx tsx scripts/setup-telegram-task.ts
 */

import { prisma } from "../lib/prisma";

async function main() {
  const task = await prisma.task.upsert({
    where: { id: "task-join-telegram" },
    update: {},
    create: {
      id: "task-join-telegram",
      title: "Join Telegram Channel",
      description: "Join our official channel and get 5,000 POWER",
      type: "SOCIAL",
      reward: 5000,
      link: "https://t.me/dreammninnerz", // ← Change this to your channel
      metadata: JSON.stringify({ telegramChatId: -5316575823 }), // ← Change this
      order: 1,
      isActive: true,
      isRepeatable: false,
      repeatCooldownHours: 0,
    },
  });
  
  console.log("✅ Task created:", task.id);
}

main()
  .catch((e) => console.error("❌ Error:", e.message))
  .finally(() => prisma.$disconnect());
