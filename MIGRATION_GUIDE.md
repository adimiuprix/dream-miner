# Migration Guide: DateTime to Unix Timestamp

This guide explains how to migrate `lastSyncAt` and `expiresAt` fields from `DateTime` to `BigInt` (Unix timestamp in milliseconds).

## ⚠️ Important Notes

1. **Backup your database** before running migration
2. This migration will modify the `Contract` table structure
3. All existing DateTime values will be converted to Unix timestamps (milliseconds)
4. The application will need to be restarted after migration

## 🚀 Migration Steps

### Step 1: Generate New Prisma Client

The schema.prisma file has already been updated. Generate the new Prisma client:

```bash
npx prisma generate
```

### Step 2: Run Migration Script

Option A - Using the migration script (recommended):
```bash
tsx scripts/migrate-to-timestamp.ts
```

Option B - Manual SQL execution:
Run the SQL commands in `prisma/migrations/change_to_unix_timestamp/migration.sql` directly on your database.

### Step 3: Verify Migration

Check that the migration was successful:

```bash
npx prisma studio
```

Open the `Contract` table and verify:
- `lastSyncAt` is now a large number (Unix timestamp in milliseconds)
- `expiresAt` is now a large number (Unix timestamp in milliseconds)

Example values:
- Before: `2024-06-09T10:30:00.000Z`
- After: `1717929000000` (milliseconds since Unix epoch)

### Step 4: Restart Application

```bash
npm run dev
```

## 🔍 What Changed

### Database Schema

**Before:**
```prisma
lastSyncAt  DateTime @default(now())
expiresAt   DateTime
```

**After:**
```prisma
lastSyncAt  BigInt  // Unix timestamp in milliseconds
expiresAt   BigInt  // Unix timestamp in milliseconds
```

### Code Changes

All code that interacts with these fields has been updated:

1. ✅ `lib/miningService.ts` - Mining logic
2. ✅ `components/MiningProvider.tsx` - Frontend provider
3. ✅ `app/api/mining/sync/route.ts` - Mining sync API
4. ✅ `app/api/purchase/free/route.ts` - Free plan claim
5. ✅ `app/api/purchase/route.ts` - Purchase API
6. ✅ `app/api/verify-payment/route.ts` - Payment verification
7. ✅ `app/api/auth/telegram/route.ts` - User authentication
8. ✅ `lib/lazyCron.ts` - Cron jobs

### Usage Examples

**Getting current timestamp:**
```typescript
const nowMs = Date.now(); // Returns Unix timestamp in milliseconds
```

**Creating expiry date:**
```typescript
// Before
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 30);

// After
const expiresAtMs = Date.now() + 30 * 24 * 60 * 60 * 1000;
```

**Comparing timestamps:**
```typescript
// Before
if (new Date(contract.expiresAt) > new Date()) { ... }

// After
if (Number(contract.expiresAt) > Date.now()) { ... }
```

**Calculating elapsed time:**
```typescript
// Before
const elapsed = (Date.now() - new Date(contract.lastSyncAt).getTime()) / 1000;

// After
const elapsed = (Date.now() - Number(contract.lastSyncAt)) / 1000;
```

## 🎯 Benefits

1. **Performance**: BigInt comparisons are faster than DateTime
2. **Simplicity**: No need for Date object conversions
3. **Precision**: Millisecond precision maintained
4. **Compatibility**: Works seamlessly with JavaScript `Date.now()`
5. **Storage**: More efficient storage in database

## 🐛 Troubleshooting

### Error: Column does not exist

If you get an error about missing columns, run:
```bash
npx prisma db push --force-reset
```

⚠️ Warning: This will delete all data. Only use in development!

### Error: Type mismatch

If you see TypeScript errors about BigInt:
1. Make sure you've run `npx prisma generate`
2. Restart your IDE/editor
3. Clear any build caches

### Values are null or undefined

Check that the migration script completed successfully:
```sql
SELECT "lastSyncAt", "expiresAt" FROM "Contract" LIMIT 5;
```

Both columns should contain large numbers (13 digits).

## 📝 Rollback (Emergency)

If you need to rollback:

1. Restore database from backup
2. Revert changes to `schema.prisma`
3. Run `npx prisma generate`
4. Revert all code changes

**Note**: Only rollback if absolutely necessary. The new timestamp system is more efficient.
