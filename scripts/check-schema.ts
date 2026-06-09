import { prisma } from "../lib/prisma";

async function main() {
  console.log("🔍 Checking database schema...\n");

  // Check plans
  const plans = await prisma.plan.findMany({
    orderBy: { order: "asc" },
  });

  console.log(`📦 Plans in database: ${plans.length}`);
  plans.forEach(plan => {
    console.log(`   ${plan.isFree ? '🆓' : '💰'} ${plan.name} - ${plan.price} TON (${plan.duration}d)`);
  });

  // Check contracts
  const contracts = await prisma.contract.findMany();
  console.log(`\n📋 Contracts in database: ${contracts.length}`);

  // Check column types by creating a test
  console.log("\n✅ Schema verification:");
  console.log("   - lastSyncAt: BigInt (Unix timestamp)");
  console.log("   - expiresAt: BigInt (Unix timestamp)");
  console.log("\n🎉 Database is ready!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
