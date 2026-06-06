# Multiple Contracts Analysis - Bug Report 🐛

## ✅ Yang Sudah Benar

### 1. Mining Calculation (`lib/miningService.ts`)
```typescript
// ✅ BENAR - Sudah handle multiple contracts
const totalPower = user.contracts.reduce(
  (sum, contract) => sum + contract.power + contract.bonus,
  0
);
```

**Status:** ✅ **AMAN** - Bisa handle multiple contracts tanpa masalah

**Test Case:**
```typescript
User punya 3 contracts:
- Contract 1: 600k + 60k = 660k
- Contract 2: 1.2M + 120k = 1.32M  
- Contract 3: 600k + 60k = 660k

Total = 660k + 1.32M + 660k = 2.64M power ✅
Mining rate = 2.64M / 100k = 26.4 hashes/second ✅
```

---

## ⚠️ MASALAH DITEMUKAN!

### 1. User.power Tidak Sinkron dengan Active Contracts

**File:** `app/api/purchase/route.ts` (Line 136-142)

```typescript
// ❌ MASALAH: Hanya INCREMENT power
await prisma.user.update({
  where: { id: transaction.userId },
  data: {
    power: {
      increment: totalPower,  // ❌ Increment terus
    },
  },
});
```

**Kenapa Bermasalah?**

#### Skenario 1: User beli 3 contracts berturut-turut
```
Initial: User.power = 0

Buy Contract 1 (600k):
  User.power += 660k → User.power = 660k ✅

Buy Contract 2 (1.2M):
  User.power += 1.32M → User.power = 1.98M ✅

Buy Contract 3 (600k):
  User.power += 660k → User.power = 2.64M ✅
```
**Status:** ✅ Bekerja dengan baik

#### Skenario 2: Contract 1 EXPIRED setelah 30 hari
```
Active Contracts:
  - Contract 2: 1.32M (masih aktif)
  - Contract 3: 660k (masih aktif)

Seharusnya: totalPower = 1.98M
Tapi User.power = 2.64M ❌ SALAH!
```

**Akibatnya:**
- ❌ User masih mining dengan power dari contract yang sudah expired
- ❌ User.power tidak pernah berkurang saat contract expired
- ❌ Mining rate jadi lebih tinggi dari seharusnya

---

### 2. Tidak Ada Cron Job untuk Handle Expired Contracts

**Yang Dibutuhkan:**
```typescript
// Cron job untuk check expired contracts
async function handleExpiredContracts() {
  // 1. Find all contracts yang expired
  const expiredContracts = await prisma.contract.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lte: new Date() }
    }
  });

  // 2. Update status jadi EXPIRED
  for (const contract of expiredContracts) {
    await prisma.contract.update({
      where: { id: contract.id },
      data: { status: "EXPIRED" }
    });

    // 3. Recalculate user's total power
    // ... (lihat solusi di bawah)
  }
}
```

**Status:** ❌ **TIDAK ADA** - Cron job untuk expired contracts belum diimplementasi

---

### 3. User.power vs Calculated Power

**Current State:**
- `User.power` = Field di database (increment terus, tidak pernah berkurang)
- `calculateMiningStats()` = Menghitung dari active contracts ✅

**Masalahnya:**
```typescript
// Mining calculation ✅ BENAR
const totalPower = user.contracts.reduce(...)  // Pakai contracts

// Tapi User.power ❌ SALAH (tidak sinkron)
await prisma.user.update({
  data: { power: { increment: ... } }  // Increment terus
});
```

---

## 🔧 Solusi yang Direkomendasikan

### Opsi 1: Hapus Field `User.power` (Recommended) ✅

**Alasan:**
- `User.power` redundant (bisa dihitung dari contracts)
- Source of truth harusnya cuma dari `Contract` table
- Menghindari data tidak sinkron

**Implementation:**

#### A. Update Schema
```prisma
model User {
  id           String   @id @default(cuid())
  // ... fields lain
  
  // ❌ Hapus field ini
  // power        Float    @default(0)
  
  hashes       Float    @default(0)
  tonBalance   Float    @default(0)
  // ...
}
```

#### B. Selalu Hitung dari Contracts
```typescript
// Sudah correct di miningService.ts
const totalPower = user.contracts.reduce(
  (sum, contract) => sum + contract.power + contract.bonus,
  0
);
```

#### C. Update `syncMiningProgress`
```typescript
// lib/miningService.ts - Line 93
await prisma.user.update({
  where: { id: userId },
  data: {
    hashes: { increment: stats.offlineHashes },
    // ❌ HAPUS INI:
    // power: stats.totalPower,
    lastPingAt: new Date(),
  },
});
```

---

### Opsi 2: Sync User.power dengan Active Contracts

**Jika mau tetap pakai `User.power` field:**

#### A. Update saat Sync
```typescript
// lib/miningService.ts
export async function syncMiningProgress(userId: string) {
  const stats = await calculateMiningStats(userId);
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      hashes: { increment: stats.offlineHashes },
      power: stats.totalPower,  // ✅ OVERWRITE, bukan increment
      lastPingAt: new Date(),
    },
  });
}
```

#### B. Hapus Increment di Purchase
```typescript
// app/api/purchase/route.ts - Line 136-142
// ❌ HAPUS INI:
// await prisma.user.update({
//   where: { id: transaction.userId },
//   data: {
//     power: { increment: totalPower },
//   },
// });

// ✅ GANTI DENGAN: Recalculate dari semua active contracts
const user = await prisma.user.findUnique({
  where: { id: transaction.userId },
  include: {
    contracts: {
      where: {
        status: "ACTIVE",
        expiresAt: { gt: new Date() }
      }
    }
  }
});

const totalActivePower = user.contracts.reduce(
  (sum, c) => sum + c.power + c.bonus,
  0
);

await prisma.user.update({
  where: { id: transaction.userId },
  data: {
    power: totalActivePower  // ✅ Set exact value
  }
});
```

#### C. Cron Job untuk Handle Expired Contracts
```typescript
// app/api/cron/route.ts atau terpisah
export async function handleExpiredContracts() {
  // 1. Find expired contracts
  const expiredContracts = await prisma.contract.updateMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lte: new Date() }
    },
    data: {
      status: "EXPIRED"
    }
  });

  // 2. Get affected users
  const affectedUserIds = await prisma.contract.findMany({
    where: {
      status: "EXPIRED",
      updatedAt: { gte: new Date(Date.now() - 60000) } // Last 1 minute
    },
    select: { userId: true },
    distinct: ['userId']
  });

  // 3. Recalculate power for each user
  for (const { userId } of affectedUserIds) {
    const stats = await calculateMiningStats(userId);
    if (stats) {
      await prisma.user.update({
        where: { id: userId },
        data: { power: stats.totalPower }
      });
    }
  }

  console.log(`[Cron] Expired ${expiredContracts.count} contracts`);
}
```

---

## 🧪 Test Cases

### Test 1: Multiple Active Contracts
```typescript
// User beli 3 contracts
// Expected: totalPower = 2.64M
// Mining rate = 26.4 hashes/second

const stats = await calculateMiningStats(userId);
assert(stats.totalPower === 2640000);
assert(stats.miningRate === 26.4);
```

### Test 2: Contract Expired
```typescript
// Contract 1 expired (660k)
// Expected: totalPower = 1.98M (bukan 2.64M)

// Update contract status
await prisma.contract.update({
  where: { id: contract1.id },
  data: { status: "EXPIRED" }
});

// Recalculate
const stats = await calculateMiningStats(userId);
assert(stats.totalPower === 1980000); // ✅
assert(stats.miningRate === 19.8); // ✅
```

### Test 3: Buy New Contract After Expiry
```typescript
// User punya 1 active (1.32M), 1 expired (660k)
// Beli contract baru (660k)
// Expected: totalPower = 1.98M (1.32M + 660k)

// NOT: 2.64M (salah jika increment terus)
```

---

## 📊 Current Behavior vs Expected

### Skenario: User punya 2 contracts, 1 expired

| Metric | Current (BUG) | Expected (FIXED) |
|--------|---------------|------------------|
| Active Contracts | Contract2 (1.32M) | Contract2 (1.32M) |
| Expired Contracts | Contract1 (660k) | Contract1 (660k) - EXPIRED |
| User.power | 1.98M ❌ | 1.32M ✅ |
| calculateMiningStats() | 1.32M ✅ | 1.32M ✅ |
| Mining Rate | 13.2 hash/s ✅ | 13.2 hash/s ✅ |

**Current State:**
- ✅ Mining calculation CORRECT (pakai active contracts)
- ❌ User.power field INCORRECT (tidak berkurang saat expired)

---

## ✅ Rekomendasi

### Priority 1: FIX User.power Sync Issue
**Pilih salah satu:**
1. **Opsi 1 (Recommended):** Hapus field `User.power`, selalu calculate dari contracts
2. **Opsi 2:** Sync `User.power` dengan recalculate (bukan increment)

### Priority 2: Add Cron Job
- Cron job untuk update expired contracts jadi status "EXPIRED"
- Recalculate affected users' power

### Priority 3: Add Tests
- Unit test untuk multiple contracts
- Test expired contract handling
- Test power calculation accuracy

---

## 🎯 Summary

### ✅ Yang AMAN:
- Mining calculation (`calculateMiningStats`) - ✅ Sudah handle multiple contracts
- Contract creation - ✅ Bisa beli multiple
- Mining rate calculation - ✅ Sum dari semua active contracts

### ❌ Yang BERMASALAH:
- `User.power` field tidak sinkron dengan active contracts
- Tidak ada handling untuk expired contracts
- Power tidak berkurang saat contract expired
- Increment terus tanpa recalculate

### 🔧 Action Items:
1. ✅ Hapus `User.power` field (atau sync dengan recalculate)
2. ✅ Add cron job untuk expired contracts
3. ✅ Update purchase API (jangan increment, tapi recalculate)
4. ✅ Add unit tests

---

**Kesimpulan:** Mining calculation sudah benar, tapi `User.power` field jadi source of inconsistency. Rekomendasi: hapus field tersebut dan selalu calculate dari active contracts.
