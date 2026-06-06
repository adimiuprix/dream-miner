# Swap Model Migration Guide

## 📋 Overview

Membuat model `Swap` baru yang terpisah dari `Transaction` untuk menyimpan data swap HASHES ke TON.

## 🗂️ Model Baru: Swap

### Schema Definition

```prisma
model Swap {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  hashesSwapped   Float    // Amount of HASHES swapped
  tonReceived     Float    // Amount of TON received
  exchangeRate    Float    // Exchange rate at the time of swap
  
  // Balance snapshot
  hashesBalanceBefore Float // HASHES balance before swap
  hashesBalanceAfter  Float // HASHES balance after swap (should be 0)
  tonBalanceBefore    Float // TON balance before swap
  tonBalanceAfter     Float // TON balance after swap
  
  status          SwapStatus @default(COMPLETED)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

enum SwapStatus {
  COMPLETED
  FAILED
  CANCELLED
}
```

### Fields Explained

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique swap ID (CUID) |
| `userId` | String | Foreign key to User |
| `hashesSwapped` | Float | Total HASHES converted |
| `tonReceived` | Float | Total TON received |
| `exchangeRate` | Float | Rate at swap time (0.0000144) |
| `hashesBalanceBefore` | Float | User's HASHES before swap |
| `hashesBalanceAfter` | Float | User's HASHES after swap (0) |
| `tonBalanceBefore` | Float | User's TON before swap |
| `tonBalanceAfter` | Float | User's TON after swap |
| `status` | SwapStatus | Swap status (COMPLETED/FAILED/CANCELLED) |
| `createdAt` | DateTime | When swap was created |
| `updatedAt` | DateTime | Last update timestamp |

## 🔄 Changes Made

### 1. Prisma Schema (`prisma/schema.prisma`)

**Added:**
- ✅ New `Swap` model
- ✅ New `SwapStatus` enum
- ✅ Relation `swaps` in User model

**Removed:**
- ❌ `SWAP_HASH_TO_TON` from `TransactionType` enum

**Before:**
```prisma
enum TransactionType {
  PURCHASE_POWER
  SWAP_HASH_TO_TON      // ❌ Removed
  REFERRAL_BONUS
  WITHDRAWAL
}

model User {
  // ...
  contracts    Contract[]
  transactions Transaction[]
}
```

**After:**
```prisma
enum TransactionType {
  PURCHASE_POWER
  REFERRAL_BONUS
  WITHDRAWAL
}

enum SwapStatus {          // ✅ New
  COMPLETED
  FAILED
  CANCELLED
}

model User {
  // ...
  contracts    Contract[]
  transactions Transaction[]
  swaps        Swap[]      // ✅ New relation
}
```

### 2. API Route (`app/api/swap/route.ts`)

**Changed:**
- ❌ Removed: Creating record in `Transaction` table
- ✅ Added: Creating record in `Swap` table with full snapshot

**Before:**
```typescript
const transaction = await tx.transaction.create({
  data: {
    userId,
    type: "SWAP_HASH_TO_TON",
    amount: tonAmount,
    status: "COMPLETED",
    metadata: JSON.stringify({
      hashesSwapped: hashesToSwap,
      exchangeRate: EXCHANGE_RATE,
      tonReceived: tonAmount,
      swappedAt: new Date().toISOString(),
    }),
  },
});
```

**After:**
```typescript
const swap = await tx.swap.create({
  data: {
    userId,
    hashesSwapped: hashesToSwap,
    tonReceived: tonAmount,
    exchangeRate: EXCHANGE_RATE,
    hashesBalanceBefore,
    hashesBalanceAfter: 0,
    tonBalanceBefore,
    tonBalanceAfter: updatedUser.tonBalance,
    status: "COMPLETED",
  },
});
```

## 📊 Data Structure Comparison

### Before (Transaction Model)
```json
{
  "id": "clx123...",
  "userId": "user123",
  "type": "SWAP_HASH_TO_TON",
  "amount": 0.00606900,
  "status": "COMPLETED",
  "metadata": "{\"hashesSwapped\":421.45833334,\"exchangeRate\":0.0000144,...}"
}
```

**Issues:**
- ❌ Data tersimpan dalam JSON string di `metadata`
- ❌ Tidak bisa query langsung berdasarkan `hashesSwapped`
- ❌ Tidak ada snapshot balance before/after
- ❌ Tercampur dengan transaction types lain

### After (Swap Model)
```json
{
  "id": "swap123...",
  "userId": "user123",
  "hashesSwapped": 421.45833334,
  "tonReceived": 0.00606900,
  "exchangeRate": 0.0000144,
  "hashesBalanceBefore": 421.45833334,
  "hashesBalanceAfter": 0,
  "tonBalanceBefore": 0.5,
  "tonBalanceAfter": 0.50606900,
  "status": "COMPLETED",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

**Benefits:**
- ✅ Semua data terstruktur dengan baik
- ✅ Bisa query langsung: `where: { hashesSwapped: { gt: 1000 } }`
- ✅ Balance snapshot untuk audit trail
- ✅ Model terpisah, lebih clean
- ✅ Indexed untuk performance

## 🚀 Migration Steps

### Step 1: Update Schema
```bash
# Schema sudah diupdate, lihat prisma/schema.prisma
```

### Step 2: Create Migration
```bash
npx prisma migrate dev --name add_swap_model
```

This will:
- Create new `Swap` table
- Create new `SwapStatus` enum
- Remove `SWAP_HASH_TO_TON` from `TransactionType` enum
- Add foreign key relation

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

This will regenerate TypeScript types in `lib/generated/prisma/`

### Step 4: Push to Database (if needed)
```bash
# For development
npx prisma db push

# OR for production with migration
npx prisma migrate deploy
```

### Step 5: Verify
```bash
# Open Prisma Studio to verify
npx prisma studio
```

## 🧪 Testing

### Test Swap Creation
```typescript
// Create a swap
const swap = await prisma.swap.create({
  data: {
    userId: "user123",
    hashesSwapped: 1000,
    tonReceived: 0.0144,
    exchangeRate: 0.0000144,
    hashesBalanceBefore: 1000,
    hashesBalanceAfter: 0,
    tonBalanceBefore: 0,
    tonBalanceAfter: 0.0144,
    status: "COMPLETED",
  },
});

console.log("Swap created:", swap.id);
```

### Query User's Swaps
```typescript
// Get all swaps for a user
const userSwaps = await prisma.swap.findMany({
  where: { userId: "user123" },
  orderBy: { createdAt: "desc" },
});

console.log(`User has ${userSwaps.length} swaps`);
```

### Calculate Total Swapped
```typescript
// Get total HASHES swapped by user
const total = await prisma.swap.aggregate({
  where: { 
    userId: "user123",
    status: "COMPLETED"
  },
  _sum: {
    hashesSwapped: true,
    tonReceived: true,
  },
});

console.log(`Total: ${total._sum.hashesSwapped} HASHES → ${total._sum.tonReceived} TON`);
```

## 📈 Benefits of Separate Model

### 1. Better Data Structure
- Dedicated columns instead of JSON metadata
- Proper data types and validation
- Direct querying without JSON parsing

### 2. Performance
- Indexed fields for fast queries
- Aggregations work natively
- Better query optimization

### 3. Audit Trail
- Complete balance snapshots before/after
- Easy to track swap history
- Clear status tracking

### 4. Separation of Concerns
- Transaction table for payments/withdrawals
- Swap table specifically for HASHES ↔ TON swaps
- Clean, single-purpose models

### 5. Analytics
- Easy to calculate total swaps
- Track exchange rate changes over time
- User swap patterns analysis

## 📊 Example Queries

### Get User's Swap History
```typescript
const history = await prisma.swap.findMany({
  where: { userId: "user123" },
  orderBy: { createdAt: "desc" },
  take: 10,
});
```

### Get Total Volume
```typescript
const volume = await prisma.swap.aggregate({
  _sum: {
    hashesSwapped: true,
    tonReceived: true,
  },
  _count: true,
});
```

### Get Swaps by Date Range
```typescript
const swaps = await prisma.swap.findMany({
  where: {
    createdAt: {
      gte: new Date("2024-01-01"),
      lte: new Date("2024-01-31"),
    },
  },
});
```

### Get Average Swap Amount
```typescript
const avg = await prisma.swap.aggregate({
  _avg: {
    hashesSwapped: true,
    tonReceived: true,
  },
});
```

## 🔒 Data Migration (Optional)

Jika ada data swap lama di Transaction table:

```typescript
// Script to migrate old swap transactions to new Swap table
const oldSwaps = await prisma.transaction.findMany({
  where: { type: "SWAP_HASH_TO_TON" },
});

for (const tx of oldSwaps) {
  const metadata = JSON.parse(tx.metadata || "{}");
  
  await prisma.swap.create({
    data: {
      userId: tx.userId,
      hashesSwapped: metadata.hashesSwapped || 0,
      tonReceived: tx.amount,
      exchangeRate: metadata.exchangeRate || 0.0000144,
      hashesBalanceBefore: metadata.hashesSwapped || 0,
      hashesBalanceAfter: 0,
      tonBalanceBefore: 0,
      tonBalanceAfter: 0,
      status: tx.status === "COMPLETED" ? "COMPLETED" : "FAILED",
      createdAt: tx.createdAt,
    },
  });
}

console.log(`Migrated ${oldSwaps.length} swap records`);
```

## 📝 Files Modified

1. ✅ `prisma/schema.prisma` - Added Swap model
2. ✅ `app/api/swap/route.ts` - Use Swap table instead of Transaction
3. ✅ `SWAP_MODEL_MIGRATION.md` - This documentation

## ✅ Checklist

- [x] Create Swap model in schema
- [x] Add SwapStatus enum
- [x] Add swaps relation to User
- [x] Remove SWAP_HASH_TO_TON from TransactionType
- [x] Update API to use Swap table
- [x] Add balance snapshots
- [ ] Run migration: `npx prisma migrate dev --name add_swap_model`
- [ ] Generate client: `npx prisma generate`
- [ ] Test swap flow
- [ ] Verify data in database

---

**Ready to run migration! 🚀**

Run:
```bash
npx prisma migrate dev --name add_swap_model
npx prisma generate
```
