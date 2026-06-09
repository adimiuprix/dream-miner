/**
 * Verification script to check if timestamp migration was successful
 * Run this after migration to ensure everything is working correctly
 */

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL!;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  console.log("🔍 Verifying timestamp migration...\n");

  try {
    // 1. Check column types
    console.log("1️⃣ Checking column types...");
    const columnInfo = await prisma.$queryRaw<Array<{
      column_name: string;
      data_type: string;
    }>>`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Contract' 
      AND column_name IN ('lastSyncAt', 'expiresAt')
    `;

    if (columnInfo.length !== 2) {
      console.error("❌ Columns not found!");
      return;
    }

    columnInfo.forEach(col => {
      if (col.data_type === 'bigint') {
        console.log(`   ✅ ${col.column_name}: ${col.data_type}`);
      } else {
        console.error(`   ❌ ${col.column_name}: ${col.data_type} (expected: bigint)`);
      }
    });

    // 2. Check sample values
    console.log("\n2️⃣ Checking sample values...");
    const contracts = await prisma.contract.findMany({
      take: 5,
      select: {
        id: true,
        lastSyncAt: true,
        expiresAt: true,
        status: true,
        createdAt: true,
      },
    });

    if (contracts.length === 0) {
      console.log("   ⚠️  No contracts found in database");
    } else {
      contracts.forEach(contract => {
        const lastSyncNum = Number(contract.lastSyncAt);
        const expiresNum = Number(contract.expiresAt);
        
        // Check if values are valid Unix timestamps (13 digits, milliseconds)
        const isLastSyncValid = lastSyncNum > 1000000000000 && lastSyncNum < 9999999999999;
        const isExpiresValid = expiresNum > 1000000000000 && expiresNum < 9999999999999;

        console.log(`\n   Contract: ${contract.id.substring(0, 8)}...`);
        console.log(`   Status: ${contract.status}`);
        console.log(`   lastSyncAt: ${contract.lastSyncAt} ${isLastSyncValid ? '✅' : '❌'}`);
        console.log(`   expiresAt: ${contract.expiresAt} ${isExpiresValid ? '✅' : '❌'}`);
        
        // Convert to readable date
        const lastSyncDate = new Date(lastSyncNum);
        const expiresDate = new Date(expiresNum);
        console.log(`   → Last Sync: ${lastSyncDate.toISOString()}`);
        console.log(`   → Expires: ${expiresDate.toISOString()}`);
      });
    }

    // 3. Check for NULL values
    console.log("\n3️⃣ Checking for NULL values...");
    const nullCount = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Contract" 
      WHERE "lastSyncAt" IS NULL OR "expiresAt" IS NULL
    `;

    const nulls = Number(nullCount[0].count);
    if (nulls === 0) {
      console.log("   ✅ No NULL values found");
    } else {
      console.error(`   ❌ Found ${nulls} contracts with NULL timestamps`);
    }

    // 4. Check active vs expired contracts
    console.log("\n4️⃣ Checking contract status distribution...");
    const statusCounts = await prisma.$queryRaw<Array<{
      status: string;
      count: bigint;
    }>>`
      SELECT status, COUNT(*) as count 
      FROM "Contract" 
      GROUP BY status
    `;

    statusCounts.forEach(({ status, count }) => {
      console.log(`   ${status}: ${count}`);
    });

    // 5. Check if timestamps make sense (lastSyncAt <= expiresAt)
    console.log("\n5️⃣ Checking timestamp logic...");
    const invalidLogic = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Contract" 
      WHERE "lastSyncAt" > "expiresAt"
    `;

    const invalidCount = Number(invalidLogic[0].count);
    if (invalidCount === 0) {
      console.log("   ✅ All contracts have valid timestamp logic");
    } else {
      console.error(`   ❌ Found ${invalidCount} contracts with lastSyncAt > expiresAt`);
    }

    // 6. Check current time logic
    console.log("\n6️⃣ Checking against current time...");
    const nowMs = Date.now();
    const activeButExpired = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Contract" 
      WHERE status = 'ACTIVE' AND "expiresAt" < ${BigInt(nowMs)}
    `;

    const shouldBeExpired = Number(activeButExpired[0].count);
    if (shouldBeExpired === 0) {
      console.log("   ✅ No active contracts past expiry date");
    } else {
      console.log(`   ⚠️  Found ${shouldBeExpired} ACTIVE contracts that should be expired`);
      console.log("   💡 Run cron job to expire them: npm run dev (it will auto-trigger)");
    }

    // 7. Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 VERIFICATION SUMMARY");
    console.log("=".repeat(60));
    
    const totalContracts = statusCounts.reduce((sum, s) => sum + Number(s.count), 0);
    console.log(`Total Contracts: ${totalContracts}`);
    console.log(`NULL Values: ${nulls}`);
    console.log(`Invalid Logic: ${invalidCount}`);
    console.log(`Should Be Expired: ${shouldBeExpired}`);
    
    if (nulls === 0 && invalidCount === 0) {
      console.log("\n✅ Migration verification PASSED!");
      console.log("🎉 Your database is ready to use!");
    } else {
      console.log("\n⚠️  Migration verification found issues.");
      console.log("🔧 Please review the errors above and fix them.");
    }

  } catch (error) {
    console.error("\n❌ Verification failed:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
