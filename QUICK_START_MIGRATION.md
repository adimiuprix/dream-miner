# 🚀 Quick Start: Timestamp Migration

## TL;DR

Run these commands in order:

```bash
# 1. Generate Prisma client with new schema
npx prisma generate

# 2. Run migration (converts DateTime to BigInt)
npm run db:migrate-timestamp

# 3. Verify migration was successful
npm run db:verify-migration

# 4. Start the app
npm run dev
```

---

## ⚠️ Before You Start

**BACKUP YOUR DATABASE!** This migration modifies the Contract table structure.

```bash
# PostgreSQL backup example
pg_dump -U username -d database_name > backup_before_migration.sql
```

---

## 📝 Step-by-Step

### 1. Generate Prisma Client
```bash
npx prisma generate
```

**Expected output:**
```
✔ Generated Prisma Client to ./lib/generated/prisma
```

### 2. Run Migration
```bash
npm run db:migrate-timestamp
```

**Expected output:**
```
🔄 Starting migration to Unix timestamp...
✅ Added new timestamp columns
✅ Converted DateTime values to Unix timestamps
✅ Dropped old DateTime columns
✅ Renamed new columns
✅ Set NOT NULL constraints
✅ Recreated indexes
✅ Migration completed successfully!
```

### 3. Verify Migration
```bash
npm run db:verify-migration
```

**Expected output:**
```
🔍 Verifying timestamp migration...
1️⃣ Checking column types...
   ✅ lastSyncAt: bigint
   ✅ expiresAt: bigint
2️⃣ Checking sample values...
   ✅ All values are valid Unix timestamps
...
✅ Migration verification PASSED!
🎉 Your database is ready to use!
```

### 4. Start Application
```bash
npm run dev
```

---

## ✅ Quick Test

After starting the app:

1. Open `http://localhost:3000`
2. Click "Free POWER" button
3. Check that mining starts
4. Verify no console errors

---

## 🐛 Troubleshooting

### Error: "Column already exists"
The migration already ran. Skip to verification:
```bash
npm run db:verify-migration
```

### Error: "Cannot find module"
Run Prisma generate again:
```bash
npx prisma generate
```

### Error: TypeScript errors
Restart your IDE and TypeScript server.

### Migration shows warnings
Check `npm run db:verify-migration` output for details.

---

## 📚 Full Documentation

For detailed information, see:
- `MIGRATION_GUIDE.md` - Complete migration guide
- `TIMESTAMP_MIGRATION_SUMMARY.md` - Technical summary

---

## 🆘 Emergency Rollback

If something goes wrong:

1. Restore database from backup:
   ```bash
   psql -U username -d database_name < backup_before_migration.sql
   ```

2. Revert Prisma schema:
   ```bash
   git checkout prisma/schema.prisma
   ```

3. Regenerate client:
   ```bash
   npx prisma generate
   ```

---

## 💡 What Changed?

**Before:**
- `lastSyncAt: DateTime`
- `expiresAt: DateTime`

**After:**
- `lastSyncAt: BigInt` (Unix timestamp in milliseconds)
- `expiresAt: BigInt` (Unix timestamp in milliseconds)

**Why?**
- ⚡ Faster performance
- 🧹 Simpler code
- 💾 Better storage efficiency
- 🎯 No timezone issues

---

**Need help?** Check the error messages in the verification output.
