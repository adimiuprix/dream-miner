/**
 * Test Script: List All Users
 * 
 * Usage: npx tsx scripts/list-users.ts
 */

import { PrismaClient } from "../lib/generated/prisma/client";

const prisma = new PrismaClient();

async function listUsers() {
  console.log("\n👥 All Users:\n");

  const users = await prisma.user.findMany({
    include: {
      contracts: {
        where: {
          status: "ACTIVE",
        },
      },
      _count: {
        select: {
          contracts: true,
          transactions: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (users.length === 0) {
    console.log("❌ No users found in database.\n");
    console.log("Make sure you've logged in via the app first!\n");
    return;
  }

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.firstName} ${user.lastName || ""}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Telegram ID: ${user.telegramId}`);
    console.log(`   Username: @${user.username || "no username"}`);
    console.log(`   Power: ${user.power.toLocaleString()}`);
    console.log(`   Hashes: ${user.hashes.toFixed(8)}`);
    console.log(`   TON Balance: ${user.tonBalance.toFixed(4)}`);
    console.log(`   Active Contracts: ${user.contracts.length}`);
    console.log(`   Total Contracts: ${user._count.contracts}`);
    console.log(`   Total Transactions: ${user._count.transactions}`);
    console.log(`   Joined: ${user.createdAt.toLocaleDateString()}`);
    
    // Calculate mining rate
    if (user.power > 0) {
      const miningRate = (user.power / 100000 * 86400).toFixed(0);
      console.log(`   Mining Rate: ${miningRate} H/day`);
    }
    
    console.log("");
  });

  console.log(`📊 Total users: ${users.length}\n`);
}

listUsers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
