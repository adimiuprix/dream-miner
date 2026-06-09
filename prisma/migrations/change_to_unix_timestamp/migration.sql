-- AlterTable: Change lastSyncAt and expiresAt from DateTime to BigInt (Unix timestamp in milliseconds)

-- Step 1: Add new columns with BigInt type
ALTER TABLE "Contract" ADD COLUMN "lastSyncAt_new" BIGINT;
ALTER TABLE "Contract" ADD COLUMN "expiresAt_new" BIGINT;

-- Step 2: Convert existing DateTime values to Unix timestamp (milliseconds)
UPDATE "Contract" 
SET "lastSyncAt_new" = EXTRACT(EPOCH FROM "lastSyncAt")::BIGINT * 1000,
    "expiresAt_new" = EXTRACT(EPOCH FROM "expiresAt")::BIGINT * 1000;

-- Step 3: Drop old columns
ALTER TABLE "Contract" DROP COLUMN "lastSyncAt";
ALTER TABLE "Contract" DROP COLUMN "expiresAt";

-- Step 4: Rename new columns to original names
ALTER TABLE "Contract" RENAME COLUMN "lastSyncAt_new" TO "lastSyncAt";
ALTER TABLE "Contract" RENAME COLUMN "expiresAt_new" TO "expiresAt";

-- Step 5: Set NOT NULL constraint (since original columns had this)
ALTER TABLE "Contract" ALTER COLUMN "lastSyncAt" SET NOT NULL;
ALTER TABLE "Contract" ALTER COLUMN "expiresAt" SET NOT NULL;

-- Step 6: Recreate index on expiresAt
DROP INDEX IF EXISTS "Contract_expiresAt_idx";
CREATE INDEX "Contract_expiresAt_idx" ON "Contract"("expiresAt");
