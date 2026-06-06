# Mining Flow - Complete Explanation 📊

Penjelasan lengkap bagaimana user membeli plan, data disimpan, dan perhitungan mining bekerja.

---

## 🛒 Flow: Pembelian Plan

### Step 1: User Klik "Buy" di Shop Page

**File:** `app/shop/page.tsx`

User memilih plan (contoh: 600K Power plan dengan harga 15 TON)

### Step 2: POST ke `/api/purchase`

**File:** `app/api/purchase/route.ts`

```typescript
POST /api/purchase
Body: {
  userId: "user123",
  planId: "plan-600k",
  txHash: "...",
  fromAddress: "...",
  toAddress: "..."
}
```

**Yang terjadi:**
1. ✅ Validate plan exists
2. ✅ Validate user exists
3. ✅ Calculate total power (base + bonus)
4. ✅ Create **Transaction** record dengan status `PENDING`

```typescript
// Transaction table
{
  id: "tx123",
  userId: "user123",
  type: "PURCHASE_POWER",
  amount: 15.0,  // TON price
  status: "PENDING",  // ← Menunggu blockchain verification
  txHash: "...",
  metadata: JSON.stringify({
    planId: "plan-600k",
    power: 660000  // 600k + 60k bonus
  })
}
```

**Response:** Transaction ID untuk polling verification

### Step 3: Blockchain Verification

**File:** `app/api/verify-payment/route.ts`

Frontend polling endpoint ini untuk cek apakah payment sudah confirmed di blockchain.

### Step 4: PUT ke `/api/purchase` - Complete Purchase

Setelah payment confirmed:

```typescript
PUT /api/purchase
Body: {
  transactionId: "tx123",
  txHash: "confirmed_hash",
  status: "COMPLETED"
}
```

**Yang terjadi:**
1. ✅ Update Transaction status → `COMPLETED`
2. ✅ Create **Contract** record
3. ✅ Update User's total **power**

```typescript
// Contract table
{
  id: "contract123",
  userId: "user123",
  planId: "plan-600k",
  power: 600000,      // Base power
  bonus: 60000,       // Bonus power (10%)
  price: 15.0,
  status: "ACTIVE",
  expiresAt: "2024-02-15T00:00:00Z"  // 30 hari dari sekarang
}

// User table updated
{
  id: "user123",
  power: 660000,  // ← Total power (base + bonus)
  // ...
}
```

---

## ⛏️ Mining Calculation

### Formula Dasar

```
Mining Rate (hashes/second) = Total Power / 100,000
```

**Contoh:**
- 100,000 power = 1 hash/second
- 600,000 power = 6 hashes/second
- 1,200,000 power = 12 hashes/second

### File: `lib/miningService.ts`

#### Function 1: `calculateMiningStats(userId)`

**Apa yang dihitung:**

```typescript
// 1. Get user + active contracts
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    contracts: {
      where: {
        status: "ACTIVE",
        expiresAt: { gt: new Date() }  // Hanya contract yang belum expired
      }
    }
  }
});

// 2. Calculate total power dari semua active contracts
const totalPower = user.contracts.reduce(
  (sum, contract) => sum + contract.power + contract.bonus,
  0
);
// Contoh: contract1 (600k+60k) + contract2 (1.2M+120k) = 1,980,000 power

// 3. Calculate mining rate
const miningRate = totalPower / 100000;
// 1,980,000 / 100,000 = 19.8 hashes/second

// 4. Calculate offline hashes
const now = new Date();
const lastPing = user.lastPingAt;
const secondsOffline = (now - lastPing) / 1000;

// Max 24 hours offline mining
const maxOfflineSeconds = 24 * 60 * 60;  // 86,400 seconds
const effectiveSeconds = Math.min(secondsOffline, maxOfflineSeconds);

// Hashes earned while offline
const offlineHashes = miningRate * effectiveSeconds;
// Contoh: 19.8 hash/s × 3600s (1 jam) = 71,280 hashes
```

**Return:**
```typescript
{
  totalPower: 1980000,
  miningRate: 19.8,  // hashes per second
  currentHashes: 50000,  // From user.hashes
  offlineHashes: 71280,  // Earned while offline
  lastPingAt: Date
}
```

#### Function 2: `syncMiningProgress(userId)`

**Apa yang dilakukan:**

```typescript
// 1. Calculate stats (seperti di atas)
const stats = await calculateMiningStats(userId);

// 2. Update database
await prisma.user.update({
  where: { id: userId },
  data: {
    hashes: { increment: stats.offlineHashes },  // Add offline hashes
    power: stats.totalPower,  // Update current power
    lastPingAt: new Date()  // Reset ping time
  }
});

// 3. Log
console.log(`User ${userId}: +${offlineHashes} hashes (rate: ${miningRate}/s)`);
```

**Result:**
- User's `hashes` bertambah sesuai offline mining
- `lastPingAt` di-reset ke sekarang
- Mining counter restart dari 0

---

## 🔄 Frontend Integration

### API: `/api/mining/sync`

**POST** - Sync progress (update database):
```typescript
POST /api/mining/sync
Body: { userId: "user123" }

Response: {
  success: true,
  stats: {
    totalPower: 1980000,
    miningRate: 19.8,
    currentHashes: 121280,  // Updated (50k + 71.28k)
    offlineHashes: 71280
  }
}
```

**GET** - Read-only status (tidak update database):
```typescript
GET /api/mining/sync?userId=user123

Response: {
  success: true,
  stats: {
    totalPower: 1980000,
    miningRate: 19.8,
    currentHashes: 50000,  // Current (not updated)
    offlineHashes: 71280   // Earned but not added yet
  }
}
```

### Frontend Flow

**File:** Probably `components/MiningRing.tsx` or `components/HashCounter.tsx`

```typescript
// 1. On component mount
useEffect(() => {
  // Sync offline mining
  fetch("/api/mining/sync", {
    method: "POST",
    body: JSON.stringify({ userId })
  });
}, []);

// 2. Real-time counter
useEffect(() => {
  const interval = setInterval(() => {
    // Increment hashes by mining rate per second
    setHashes(prev => prev + miningRate);
  }, 1000);
  
  return () => clearInterval(interval);
}, [miningRate]);

// 3. Periodic sync (every 30 seconds)
useEffect(() => {
  const interval = setInterval(() => {
    fetch("/api/mining/sync", {
      method: "POST",
      body: JSON.stringify({ userId })
    });
  }, 30000);
  
  return () => clearInterval(interval);
}, []);
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER BUYS PLAN (Shop Page)                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. POST /api/purchase                                       │
│    ├─ Create Transaction (PENDING)                          │
│    └─ Return transaction ID                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Payment Verification (TON blockchain)                    │
│    Frontend polls: /api/verify-payment                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. PUT /api/purchase (status: COMPLETED)                    │
│    ├─ Update Transaction → COMPLETED                        │
│    ├─ Create Contract (ACTIVE, 30 days)                     │
│    │   • power: 600,000                                     │
│    │   • bonus: 60,000                                      │
│    │   • expiresAt: +30 days                                │
│    └─ Update User.power += 660,000                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. MINING STARTS AUTOMATICALLY                              │
│    Power is active, mining rate calculated                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. User Opens App (Next Time)                              │
│    POST /api/mining/sync                                    │
│    ├─ Calculate offline time                                │
│    ├─ offlineHashes = miningRate × seconds                  │
│    └─ Update: user.hashes += offlineHashes                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Real-Time Mining Counter                                │
│    Frontend: setInterval(() => hashes += miningRate, 1000) │
│    Periodic sync every 30s                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 Database Tables

### User
```typescript
{
  id: "user123",
  power: 660000,         // Total power (sum of all active contracts)
  hashes: 121280,        // Accumulated mined currency
  tonBalance: 0.5,       // TON balance from swaps
  lastPingAt: "2024-01-15T10:00:00Z"  // Last mining sync
}
```

### Contract (Active Contracts)
```typescript
{
  id: "contract123",
  userId: "user123",
  planId: "plan-600k",
  power: 600000,         // Base power
  bonus: 60000,          // Bonus power (10%)
  price: 15.0,
  status: "ACTIVE",      // ACTIVE | EXPIRED | CANCELLED
  expiresAt: "2024-02-15T00:00:00Z",  // 30 days from purchase
  createdAt: "2024-01-15T10:00:00Z"
}
```

### Transaction (Purchase History)
```typescript
{
  id: "tx123",
  userId: "user123",
  type: "PURCHASE_POWER",
  amount: 15.0,
  status: "COMPLETED",   // PENDING | COMPLETED | FAILED
  txHash: "blockchain_tx_hash",
  metadata: "{\"planId\":\"plan-600k\",\"power\":660000}"
}
```

---

## 🧮 Example Calculation

### Scenario: User dengan 2 Active Contracts

**Contract 1:** 600K plan
- Base power: 600,000
- Bonus: 60,000 (10%)
- Total: 660,000

**Contract 2:** 1.2M plan  
- Base power: 1,200,000
- Bonus: 120,000 (10%)
- Total: 1,320,000

**Total Power:** 660,000 + 1,320,000 = **1,980,000**

**Mining Rate:** 1,980,000 / 100,000 = **19.8 hashes/second**

**Per Hour:** 19.8 × 3600 = **71,280 hashes**

**Per Day:** 19.8 × 86,400 = **1,710,720 hashes**

**After 30 days:** 1,710,720 × 30 = **51,321,600 hashes**

---

## 📍 Key Files Reference

| File | Purpose |
|------|---------|
| `app/api/purchase/route.ts` | Purchase plan, create contract |
| `app/api/mining/sync/route.ts` | Sync mining progress |
| `lib/miningService.ts` | Mining calculations |
| `prisma/schema.prisma` | User, Contract, Transaction models |
| `components/MiningRing.tsx` | Visual mining display |
| `components/HashCounter.tsx` | Real-time hash counter |

---

## ✅ Summary

1. **Purchase:** POST /api/purchase → Create Transaction (PENDING)
2. **Verify:** Blockchain confirmation
3. **Complete:** PUT /api/purchase → Create Contract + Update User.power
4. **Mining:** Auto-starts based on totalPower from active contracts
5. **Calculation:** miningRate = totalPower / 100,000 (hashes/second)
6. **Offline:** Accumulates max 24 hours when user is away
7. **Sync:** POST /api/mining/sync → Add offline hashes to user.hashes
8. **Frontend:** Real-time counter + periodic sync

**Data tersimpan di:**
- ✅ **Contract table** - Active contracts dengan power dan expiry
- ✅ **User table** - Total power dan accumulated hashes
- ✅ **Transaction table** - Purchase history

**Perhitungan mining di:**
- ✅ **lib/miningService.ts** - All calculation logic
- ✅ **app/api/mining/sync/route.ts** - API endpoints

---

**Mining works automatically based on active contracts!** ⛏️
