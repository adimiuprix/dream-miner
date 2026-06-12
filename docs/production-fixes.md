# Production Readiness — Daftar Fix

> Hasil audit teknis sebelum launch. Diurutkan berdasarkan prioritas.
> Setiap poin menyertakan lokasi file, deskripsi masalah, dan solusi siap pakai.

---

## 🔴 CRITICAL

### 1. Admin API Tidak Ada Proteksi Sama Sekali

**File:** Semua file di `app/api/admin/*`

**Masalah:**
Seluruh endpoint admin dapat diakses oleh siapapun yang mengetahui URL-nya — tanpa token, tanpa session, tanpa apapun. Termasuk endpoint yang sangat berbahaya:
- `PATCH /api/admin/settings` — bisa mengubah exchange rate, hot wallet mnemonic, bot token
- `DELETE /api/admin/plans/[id]` — bisa menghapus semua plan
- `GET /api/admin/users` — bisa mengambil data seluruh user

**Solusi:**
Buat `middleware.ts` di root project untuk memproteksi semua route `/api/admin/*`:

```ts
// middleware.ts (root project)
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteksi semua API admin
  if (pathname.startsWith("/api/admin")) {
    const secret = request.headers.get("x-admin-secret");
    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*"],
};
```

Tambahkan ke `.env`:
```env
ADMIN_SECRET=isi_dengan_random_string_panjang_minimal_32_karakter
```

Lalu tambahkan header ini di semua fetch dari admin frontend (`AdminSidebar`, `AdminMobileBar`, komponen admin lainnya):
```ts
headers: { "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET }
```

> Catatan: untuk keamanan lebih baik, gunakan server-side session atau JWT daripada static secret.

---

### 2. `/api/cron` Tidak Ada Auth

**File:** `app/api/cron/route.ts`

**Masalah:**
`POST /api/cron` dengan body `{ action: "forceAll" }` atau `{ action: "runJob", job: "cleanup" }` bisa dipanggil siapapun. Endpoint cleanup dapat menghapus transaksi PENDING secara massal.

**Solusi:**
Pindahkan endpoint ini ke `/api/admin/cron` agar terproteksi oleh middleware admin di atas. Atau tambahkan auth tersendiri:

```ts
// app/api/cron/route.ts
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... rest of handler
}
```

Tambahkan ke `.env`:
```env
CRON_SECRET=isi_dengan_random_string_berbeda_dari_admin_secret
```

---

### 3. Race Condition di `/api/verify-payment` — Double Contract

**File:** `app/api/verify-payment/route.ts`

**Masalah:**
Dua request verifikasi yang masuk bersamaan untuk `transactionId` yang sama bisa menghasilkan dua kontrak aktif. Keduanya lolos pengecekan `status === "PENDING"` sebelum salah satu berhasil menulis `COMPLETED`.

```
Request A → baca PENDING ✓
Request B → baca PENDING ✓
Request A → verifikasi blockchain → buat kontrak ← OK
Request B → verifikasi blockchain → buat kontrak lagi ← BUG
```

**Solusi:**
Gunakan atomic status update sebagai lock optimistik — hanya satu request yang bisa mengubah status dari `PENDING` ke `PROCESSING`:

```ts
// Ganti pengecekan status biasa dengan atomic update
const locked = await prisma.transaction.updateMany({
  where: { id: transactionId, status: "PENDING" },
  data: { status: "PROCESSING" },
});

if (locked.count === 0) {
  // Sudah diproses oleh request lain
  const existing = await prisma.transaction.findUnique({ where: { id: transactionId } });
  return NextResponse.json({ status: existing?.status ?? "PROCESSING" });
}

// Lanjut verifikasi blockchain...
// Jika gagal, rollback ke PENDING:
// await prisma.transaction.update({ where: { id: transactionId }, data: { status: "PENDING" } });
```

Tambahkan status `"PROCESSING"` ke enum Transaction di `schema.prisma`:
```prisma
enum TransactionStatus {
  PENDING
  PROCESSING  // ← tambahkan
  COMPLETED
  FAILED
}
```

---

### 4. `getSettingNumber` Signature Mismatch — Runtime Error

**File:** `lib/settings.ts`, `lib/miningService.ts`, `lib/referralBonus.ts`

**Masalah:**
Setelah refactor menghapus fallback defaults, fungsi `getSettingNumber` hanya menerima 1 parameter. Namun dua file masih memanggilnya dengan 2 parameter (beserta default value):

```ts
// lib/miningService.ts — AKAN ERROR
getSettingNumber(SETTING_KEYS.POWER_TO_HASH_RATE, DEFAULT_POWER_TO_HASH_RATE)

// lib/referralBonus.ts — AKAN ERROR
getSettingNumber(SETTING_KEYS.JOIN_BONUS_POWER, 2_000)
getSettingNumber(SETTING_KEYS.PURCHASE_BONUS_PERCENT, 50)
```

Ini akan menyebabkan TypeScript/runtime error saat mining sync atau bonus dihitung.

**Solusi:**
Kedua file tersebut seharusnya ikut kebijakan baru — tidak ada default, throw jika kosong. Hapus parameter kedua:

```ts
// lib/miningService.ts
async function getPowerToHashRate(): Promise<number> {
  return getSettingNumber(SETTING_KEYS.POWER_TO_HASH_RATE); // ← hapus default
}

// lib/referralBonus.ts
const [joinPower, purchasePercent] = await Promise.all([
  getSettingNumber(SETTING_KEYS.JOIN_BONUS_POWER),       // ← hapus default
  getSettingNumber(SETTING_KEYS.PURCHASE_BONUS_PERCENT), // ← hapus default
]);
```

Pastikan seed.ts mengisi nilai-nilai ini sebelum deploy.

---

## 🟠 HIGH

### 5. Race Condition di `/api/swap` — Double Swap

**File:** `app/api/swap/route.ts`

**Masalah:**
Jika dua request swap dikirim bersamaan oleh user yang sama, keduanya bisa membaca `currentHashes` yang sama dari `syncMiningProgress`, kemudian keduanya berhasil reset hashes dan mengirim TON dua kali.

```
Request A → syncMiningProgress → currentHashes = 5000
Request B → syncMiningProgress → currentHashes = 5000
Request A → reset hashes, kirim TON ← OK
Request B → reset hashes (sudah 0), kirim TON lagi ← BUG (kirim TON dari 0 hashes)
```

**Solusi:**
Tambahkan pengecekan minimum hashes setelah masuk ke dalam `prisma.$transaction`, bukan sebelumnya:

```ts
const swap = await prisma.$transaction(async (tx) => {
  // Re-read hashes di dalam transaksi untuk menghindari race condition
  const contracts = await tx.contract.findMany({
    where: { userId, status: { in: ["ACTIVE", "EXPIRED"] } },
    select: { id: true, accumulatedHashes: true },
  });
  const freshHashes = contracts.reduce((sum, c) => sum + c.accumulatedHashes, 0);

  if (freshHashes < minimumSwapHashes) {
    throw new Error("INSUFFICIENT_HASHES"); // akan rollback transaksi
  }

  // Reset dan buat swap menggunakan freshHashes, bukan currentHashes dari luar
  await tx.contract.updateMany({ where: { userId }, data: { accumulatedHashes: 0 } });
  // ... create swap dengan freshHashes
});
```

---

### 6. Race Condition di `/api/purchase/free` — Double Free Contract

**File:** `app/api/purchase/free/route.ts`

**Masalah:**
Pengecekan `activeContract` dan pembuatan kontrak baru tidak dalam satu transaksi atomik. Dua request bersamaan bisa lolos pengecekan dan membuat dua kontrak free sekaligus.

**Solusi:**
Bungkus seluruh logika dalam `prisma.$transaction`:

```ts
const contract = await prisma.$transaction(async (tx) => {
  // Cek di dalam transaksi
  const activeContract = await tx.contract.findFirst({
    where: { userId, status: "ACTIVE", plan: { isFree: true }, expiresAt: { gt: BigInt(nowMs) } },
  });
  if (activeContract) throw new Error("ALREADY_ACTIVE");

  const expiredContract = await tx.contract.findFirst({
    where: { userId, status: "EXPIRED", plan: { isFree: true } },
    orderBy: { expiresAt: "desc" },
  });

  if (expiredContract) {
    return tx.contract.update({ where: { id: expiredContract.id }, data: { ... } });
  }
  return tx.contract.create({ data: { ... } });
});
```

---

### 7. TON Payment Verification Tidak Pakai txHash

**File:** `lib/tonWebVerification.ts`, `app/api/verify-payment/route.ts`

**Masalah:**
Verifikasi transaksi hanya berdasarkan kombinasi `fromAddress + amount` dalam window waktu 5 menit. Jika user mengirim jumlah yang sama dua kali dalam 5 menit, keduanya bisa dianggap valid dan menghasilkan dua kontrak.

Padahal `txHash` (BOC) sudah disimpan di tabel Transaction — tapi tidak digunakan sama sekali dalam verifikasi blockchain.

**Solusi:**
Gunakan `txHash` untuk mencari transaksi yang spesifik, bukan scan semua transaksi terbaru:

```ts
// Di verifyTransactionByReceiverAddress, tambahkan parameter txHash
export async function verifyTransactionByHash(
  txHash: string,
  receiverAddress: string,
  expectedAmount: number,
): Promise<TransactionVerificationResult> {
  const tonweb = await createTonWeb();
  // Gunakan txHash untuk fetch transaksi spesifik
  // TonCenter API: GET /getTransactionByHash?hash=<hash>
  const tx = await tonweb.provider.call("getTransactionByHash", { hash: txHash });
  // Verifikasi amount dan receiver dari tx spesifik ini
}
```

---

### 8. LazyCron Tidak Flush Hashes Sebelum Expire

**File:** `lib/lazyCron.ts`

**Masalah:**
`expireContracts()` di `lazyCron.ts` langsung mengubah status kontrak ke `EXPIRED` tanpa flush `accumulatedHashes` terlebih dahulu. Ini berbeda dengan `markExpiredContracts()` di `miningService.ts` yang melakukan flush dulu.

Akibatnya, hashes yang belum di-flush (mining sejak `lastSyncAt` terakhir) bisa hilang saat kontrak di-expire oleh cron.

**Solusi:**
Ganti implementasi `expireContracts()` di `lazyCron.ts` untuk menggunakan fungsi yang sudah ada di `miningService.ts`:

```ts
// lib/lazyCron.ts
import { markExpiredContracts } from "@/lib/miningService";

async function expireContracts(): Promise<void> {
  // Gunakan implementasi yang sudah flush hashes dulu
  const affectedUsers = await markExpiredContracts();
  console.log(`[LazyCron] Expired contracts for ${affectedUsers.length} users`);
}
```

---

## 🟡 MEDIUM

### 9. Auth Telegram Tanpa HMAC Verification

**File:** `app/api/auth/telegram/route.ts`

**Masalah:**
Data Telegram (`telegramId`, `firstName`, dll.) diterima langsung dari request body tanpa memverifikasi bahwa data tersebut benar-benar berasal dari Telegram. Siapapun bisa fake-login sebagai user lain dengan mengirim `{ telegramId: 12345 }`.

Detail rencana implementasi lengkap ada di `docs/auth-jwt-implementation.md`.

**Solusi:**
Kirim `initData` dari Telegram Web App dan verifikasi HMAC-SHA256 di server:

```ts
// Client (AuthProvider.tsx) — kirim initData
body: JSON.stringify({
  initData: window.Telegram.WebApp.initData, // ← tambahkan ini
  referralCode: startParam ?? null,
})

// Server (route.ts) — verifikasi
function verifyTelegramInitData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  params.delete("hash");

  const checkString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(process.env.TELEGRAM_BOT_TOKEN!)
    .digest();

  const expectedHash = crypto
    .createHmac("sha256", secretKey)
    .update(checkString)
    .digest("hex");

  return hash === expectedHash;
}
```

---

### 10. Mining Sync Menulis ke DB Setiap 10 Detik per User

**File:** `components/MiningProvider.tsx`, `app/api/mining/sync/route.ts`

**Masalah:**
`MiningProvider` memanggil `POST /api/mining/sync` (yang flush hashes ke DB) setiap 10 detik untuk setiap user aktif. Dengan 1000 user aktif bersamaan = 100 write/detik yang tidak perlu.

**Solusi:**
Pisahkan endpoint read-only dari write:
- Gunakan `GET /api/mining/sync` (read-only, tidak flush) untuk refresh stats di client setiap 10 detik
- Gunakan `POST /api/mining/sync` (flush ke DB) hanya saat diperlukan: sebelum swap, saat user buka halaman wallet, atau setiap 5 menit sekali

```ts
// MiningProvider.tsx
const FLUSH_INTERVAL = 5 * 60 * 1000; // flush ke DB setiap 5 menit

useEffect(() => {
  if (!user?.id) return;

  // Read-only refresh setiap 10 detik
  const readInterval = setInterval(() => fetchStats(false), 10_000);

  // Flush ke DB setiap 5 menit
  const flushInterval = setInterval(() => fetchStats(true), FLUSH_INTERVAL);

  fetchStats(true); // flush pertama saat mount

  return () => { clearInterval(readInterval); clearInterval(flushInterval); };
}, [user?.id]);
```

---

### 11. Task Complete Tidak Ada Auth User

**File:** `app/api/tasks/[id]/complete/route.ts`

**Masalah:**
`POST /api/tasks/[id]/complete` menerima `userId` dari request body tanpa verifikasi. Siapapun yang mengetahui `userId` orang lain bisa mengklaim reward task atas nama mereka.

**Solusi:**
Setelah JWT auth diimplementasikan (lihat `docs/auth-jwt-implementation.md`), ganti `userId` dari body dengan `userId` dari JWT token:

```ts
// Setelah JWT diimplementasikan:
const authUser = await getAuthUser(request);
if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const { userId } = authUser; // ← dari token, bukan dari body
```

---

### 12. Referral Bonus Tanpa Batas / Cap

**File:** `lib/referralBonus.ts`

**Masalah:**
`givePurchaseBonus()` membuat contract bonus untuk referrer setiap kali downline membeli plan, **tanpa batas**. Downline beli 100 plan → referrer dapat 100 bonus contract. Berpotensi dieksploitasi dengan membeli plan murah berulang kali dari akun downline sendiri.

**Solusi:**
Tambahkan pengecekan batas per referral pair, atau maksimum bonus aktif:

```ts
// Opsi 1: Batasi jumlah bonus contract aktif per referrer
const activeBonusCount = await prisma.contract.count({
  where: { userId: referrerId, planId: bonusPlan.id, status: "ACTIVE" },
});
const MAX_BONUS_CONTRACTS = 10; // sesuaikan
if (activeBonusCount >= MAX_BONUS_CONTRACTS) {
  console.log(`[ReferralBonus] Referrer ${referrerId} sudah mencapai limit bonus`);
  return;
}

// Opsi 2: Batasi bonus per pair referrer-downline per hari
const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
const todayBonus = await prisma.contract.count({
  where: { userId: referrerId, planId: bonusPlan.id, createdAt: { gte: todayStart } },
});
if (todayBonus >= 3) return; // max 3 bonus per hari dari satu referrer
```

---

## Checklist Sebelum Launch

- [x] Fix #1 — Proteksi admin routes dengan middleware JWT ✅
- [ ] Fix #2 — Auth `/api/cron`
- [ ] Fix #3 — Atomic lock di verify-payment
- [x] Fix #4 — Hapus parameter default di `getSettingNumber` calls ✅
- [ ] Fix #8 — LazyCron gunakan `markExpiredContracts()`
- [ ] Pastikan semua settings di DB sudah terisi (seed dijalankan)
- [x] Ganti `tonconnect-manifest.json` placeholder URL dengan domain production ✅ (`https://dream-miner.vercel.app`)
- [ ] Set `TON_NETWORK=mainnet` di AppSetting DB
- [ ] Pastikan hot wallet memiliki saldo TON cukup untuk swap awal
- [ ] Test end-to-end flow: auth → purchase → verify → swap di testnet dulu
