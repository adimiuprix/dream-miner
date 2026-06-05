# 🧪 Testing Guide - Add Plan Untuk Testing

## Cara Paling Mudah: Menggunakan Prisma Studio

### 1️⃣ Buka Prisma Studio
```bash
npx prisma studio
```

Akan membuka browser di `http://localhost:5555`

### 2️⃣ Cari User ID Kamu
1. Klik tab **"User"**
2. Cari user kamu berdasarkan `firstName` atau `username`
3. **Copy User ID** (contoh: `cm7abc123xyz`)

### 3️⃣ Buka Supabase SQL Editor
Karena Prisma Studio tidak support insert dengan relations, lebih mudah pakai SQL:

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project kamu
3. Klik **SQL Editor** di sidebar
4. Buat **New Query**

### 4️⃣ Jalankan SQL Ini
```sql
-- GANTI 'YOUR_USER_ID' dengan user ID kamu!

BEGIN;

-- 1. Create Contract (Plan 1: 118K POWER)
INSERT INTO "Contract" (
  id,
  "userId",
  "planId",
  power,
  price,
  bonus,
  status,
  "expiresAt",
  "createdAt",
  "updatedAt"
) VALUES (
  'test_' || gen_random_uuid()::text,
  'YOUR_USER_ID',  -- ⚠️ GANTI INI
  'plan-118k',
  118000,
  1,
  1180,
  'ACTIVE',
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW()
);

-- 2. Update User Power
UPDATE "User"
SET power = power + 119180  -- 118000 + 1180
WHERE id = 'YOUR_USER_ID';  -- ⚠️ GANTI INI

-- 3. Create Transaction Record
INSERT INTO "Transaction" (
  id,
  "userId",
  type,
  amount,
  status,
  "txHash",
  "fromAddress",
  "toAddress",
  metadata,
  "createdAt",
  "updatedAt"
) VALUES (
  'test_tx_' || gen_random_uuid()::text,
  'YOUR_USER_ID',  -- ⚠️ GANTI INI
  'PURCHASE_POWER',
  1,
  'COMPLETED',
  'test_' || extract(epoch from now())::text,
  'TEST_WALLET',
  'RECEIVER_WALLET',
  '{"planId":"plan-118k","testPurchase":true,"createdBy":"manual_sql"}',
  NOW(),
  NOW()
);

COMMIT;
```

### 5️⃣ Verify
Cek apakah berhasil:
```sql
-- Cek user power
SELECT 
  "firstName",
  power,
  hashes,
  (power / 100000.0) as "miningRate_H_per_sec",
  (power / 100000.0 * 86400) as "miningRate_H_per_day"
FROM "User"
WHERE id = 'YOUR_USER_ID';  -- ⚠️ GANTI INI

-- Cek contract
SELECT * FROM "Contract"
WHERE "userId" = 'YOUR_USER_ID'  -- ⚠️ GANTI INI
ORDER BY "createdAt" DESC;
```

### 6️⃣ Test di App
1. Buka app: `npm run dev`
2. Buka `http://localhost:3000`
3. Login dengan akun yang sama
4. Lihat di **StatsBar**:
   - Power: **119.2K** ✅
   - Rate: **~103K H/day** ✅
5. **HashCounter** seharusnya mulai mining!

---

## 📦 Plan Options

Jika mau plan yang lain, ganti bagian ini di SQL:

### Plan 1: Starter (1 TON)
```sql
'planId': 'plan-118k',
power: 118000,
bonus: 1180,
price: 1,
total_power: 119180  -- untuk UPDATE User
```

### Plan 2: Basic (5 TON)
```sql
'planId': 'plan-600k',
power: 600000,
bonus: 11800,
price: 5,
total_power: 611800  -- untuk UPDATE User
```

### Plan 3: Advanced (10 TON)
```sql
'planId': 'plan-1.2m',
power: 1200000,
bonus: 47200,
price: 10,
total_power: 1247200  -- untuk UPDATE User
```

### Plan 4: Pro (50 TON)
```sql
'planId': 'plan-6m',
power: 6000000,
bonus: 354000,
price: 50,
total_power: 6354000  -- untuk UPDATE User
```

### Plan 5: Ultimate (100 TON)
```sql
'planId': 'plan-17.6m',
power: 17600000,
bonus: 1232000,
price: 100,
total_power: 18832000  -- untuk UPDATE User
```

---

## 🧪 Testing Checklist

Setelah add contract, test ini:

### ✅ Test 1: Mining Display
```
1. Buka home page
2. HashCounter harus tampil: "0.00000000 HASHES"
3. StatsBar harus tampil:
   - Rate: 102,931 H/day
   - Power: 119.2K
   - Next expiry: 30d
```

### ✅ Test 2: Real-Time Mining
```
1. Tunggu 10 detik
2. HashCounter harus naik sekitar +11.8 hashes
3. Rate: 1.18 H/s
```

### ✅ Test 3: Auto-Sync
```
1. Buka Developer Console (F12)
2. Tunggu 30 detik
3. Harus ada log: "[Mining] Synced user..."
4. Check database:
   SELECT hashes FROM "User" WHERE id = 'YOUR_USER_ID';
   -- Harus ada hashes yang tersimpan
```

### ✅ Test 4: Offline Mining
```
1. Tutup app/browser
2. Tunggu 5 menit
3. Buka lagi
4. Console harus log: "Earned X hashes while offline"
5. HashCounter harus jump up by ~354 hashes (1.18 H/s × 300s)
```

### ✅ Test 5: Swap (After Mining)
```
1. Tunggu sampai punya >= 100 HASHES
   (atau manual: UPDATE "User" SET hashes = 1000 WHERE id = 'YOUR_USER_ID')
2. Klik "SWAP HASHES → TON"
3. Harus tampil preview
4. Confirm
5. Check database:
   - hashes = 0
   - tonBalance increased
```

---

## 🔧 Troubleshooting

### Issue: Power masih 0
```sql
-- Cek contract
SELECT * FROM "Contract" WHERE "userId" = 'YOUR_USER_ID';

-- Jika contract ada tapi power 0, manual update:
UPDATE "User" SET power = 119180 WHERE id = 'YOUR_USER_ID';
```

### Issue: Mining rate 0
```sql
-- Pastikan contract ACTIVE dan belum expired
SELECT status, "expiresAt" FROM "Contract" WHERE "userId" = 'YOUR_USER_ID';

-- Jika expired, update:
UPDATE "Contract" 
SET "expiresAt" = NOW() + INTERVAL '30 days'
WHERE "userId" = 'YOUR_USER_ID';
```

### Issue: HashCounter tidak naik
1. Refresh page (Ctrl+R atau Cmd+R)
2. Check console untuk error
3. Check Network tab, pastikan `/api/mining/sync` dipanggil
4. Manual trigger sync:
   ```
   Open Console (F12):
   fetch('/api/mining/sync', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ userId: 'YOUR_USER_ID' })
   }).then(r => r.json()).then(console.log)
   ```

---

## 🎯 Quick Commands

### Get User ID
```sql
SELECT id, "firstName", username FROM "User" LIMIT 10;
```

### Check Mining Stats
```sql
SELECT 
  "firstName",
  power,
  hashes,
  "tonBalance",
  (power / 100000.0) as rate_per_sec,
  (power / 100000.0 * 86400) as rate_per_day
FROM "User"
WHERE id = 'YOUR_USER_ID';
```

### Add More Hashes (For Testing Swap)
```sql
UPDATE "User" 
SET hashes = 10000 
WHERE id = 'YOUR_USER_ID';
```

### Force Contract Expiry (For Testing Cron)
```sql
UPDATE "Contract"
SET "expiresAt" = NOW() - INTERVAL '1 day'
WHERE "userId" = 'YOUR_USER_ID';
```

### Reset Everything
```sql
UPDATE "User" 
SET power = 0, hashes = 0, "tonBalance" = 0 
WHERE id = 'YOUR_USER_ID';

DELETE FROM "Contract" WHERE "userId" = 'YOUR_USER_ID';
DELETE FROM "Transaction" WHERE "userId" = 'YOUR_USER_ID';
```

---

## 📊 Expected Results

Setelah add **Plan 1 (118K)**:

```
User Stats:
  Power: 119,180 (118K + 1.18K bonus)
  Mining Rate: 1.18 H/s
  Per Day: 102,931 H
  Per Month: 3,087,930 H
  
Contract:
  Status: ACTIVE
  Expires: 30 days from now
  
Mining:
  After 10s: +11.8 hashes
  After 1 min: +70.8 hashes
  After 1 hour: +4,248 hashes
  After 24 hours: 102,931 hashes
```

---

## 🎉 Setelah Testing Berhasil

Kamu bisa:
1. ✅ Test swap system (tunggu sampai >= 100 HASHES)
2. ✅ Test offline mining (tutup app, buka lagi)
3. ✅ Test auto-sync (tunggu 30 detik, cek console)
4. ✅ Test contract expiry (force expire, trigger cron)
5. ✅ Deploy to production!

---

**Happy Testing! 🚀**
