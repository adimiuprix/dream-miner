/**
 * Migration script to convert lastSyncAt and expiresAt to Unix timestamp
 * Run this script AFTER updating the schema.prisma
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
  console.log("🔄 Starting migration to Unix timestamp...\n");

  try {
    // Execute migration SQL
    await prisma.$executeRawUnsafe(`
      -- Step 1: Add new columns with BigInt type
      ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "lastSyncAt_new" BIGINT;
      ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "expiresAt_new" BIGINT;
    `);

    console.log("✅ Added new timestamp columns");

    await prisma.$executeRawUnsafe(`
      -- Step 2: Convert existing DateTime values to Unix timestamp (milliseconds)
      UPDATE "Contract" 
      SET "lastSyncAt_new" = EXTRACT(EPOCH FROM "lastSyncAt")::BIGINT * 1000,
          "expiresAt_new" = EXTRACT(EPOCH FROM "expiresAt")::BIGINT * 1000
      WHERE "lastSyncAt_new" IS NULL OR "expiresAt_new" IS NULL;
    `);

    console.log("✅ Converted DateTime values to Unix timestamps");

    await prisma.$executeRawUnsafe(`
      -- Step 3: Drop old columns
      ALTER TABLE "Contract" DROP COLUMN IF EXISTS "lastSyncAt" CASCADE;
      ALTER TABLE "Contract" DROP COLUMN IF EXISTS "expiresAt" CASCADE;
    `);

    console.log("✅ Dropped old DateTime columns");

    await prisma.$executeRawUnsafe(`
      -- Step 4: Rename new columns to original names
      ALTER TABLE "Contract" RENAME COLUMN "lastSyncAt_new" TO "lastSyncAt";
      ALTER TABLE "Contract" RENAME COLUMN "expiresAt_new" TO "expiresAt";
    `);

    console.log("✅ Renamed new columns");

    await prisma.$executeRawUnsafe(`
      -- Step 5: Set NOT NULL constraint
      ALTER TABLE "Contract" ALTER COLUMN "lastSyncAt" SET NOT NULL;
      ALTER TABLE "Contract" ALTER COLUMN "expiresAt" SET NOT NULL;
    `);

    console.log("✅ Set NOT NULL constraints");

    await prisma.$executeRawUnsafe(`
      -- Step 6: Recreate index on expiresAt
      DROP INDEX IF EXISTS "Contract_expiresAt_idx";
      CREATE INDEX "Contract_expiresAt_idx" ON "Contract"("expiresAt");
    `);

    console.log("✅ Recreated indexes");

    // Verify migration
    const contractCount = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Contract"
    `;

    console.log(`\n✅ Migration completed successfully!`);
    console.log(`📊 Total contracts in database: ${contractCount[0].count}`);

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
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
