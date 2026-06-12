# Bug Report — Dream Miner

> Dibuat: 12 Juni 2026  
> Cakupan: Seluruh codebase (`app/`, `components/`, `lib/`, `prisma/`)

---

## Ringkasan

| Tingkat | Jumlah |
|---|---|
| 🔴 Kritis | 5 |
| 🟠 Tinggi | 6 |
| 🟡 Sedang | 8 |
| 🔵 Rendah / Kode | 5 |
| **Total** | **24** |

---

## 🔴 BUG KRITIS

### BUG-001 — Tidak Ada Validasi Telegram `initData` di API Auth

**File:** `app/api/auth/telegram/route.ts`  
**Dampak:** Siapapun bisa membuat atau mengambil akun user lain hanya dengan mengetahui `telegramId` mereka.

**Masalah:**
```ts
// route.ts — menerima telegramId tanpa verifikasi sama sekali
const { telegramId, username, firstName, ... } = body;
const existingUser = await prisma.user.findUnique({
  where: { telegramId: BigInt(telegramId) },
});
```

Telegram Web App seharusnya mengirimkan `initData` (signed string dari Telegram) yang diverifikasi menggunakan HMAC-SHA256 dengan `BOT_TOKEN`. Project ini menerima `telegramId` mentah tanpa verifikasi apapun.

**Risiko:** Penyerang dapat POST ke `/api/auth/telegram` dengan `telegramId` milik user lain untuk mengambil akses akun, mengubah data, dan melakukan swap TON ke wallet mereka sendiri.

**Perbaikan:**
```ts
// Verifikasi initData dari Telegram
import { createHmac } from "crypto";

function verifyTelegramInitData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  params.delete("hash");
  const checkString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = createHmac("sha256", secretKey).update(checkString).digest("hex");
  return computedHash === hash;
}
```

---

### BUG-002 — ~~Race Condition pada Swap: Double-Counting Hashes~~ ✅ FIXED

**File:** `app/api/swap/route.ts`, `lib/miningService.ts`  
**Fix commit:** Fungsi `flushAndLockHashes` ditambahkan ke `miningService.ts`

**Solusi:** Seluruh operasi swap (flush pending hashes → baca total → validasi minimum → reset ke 0 → buat swap record) sekarang dijalankan dalam **satu Serializable DB transaction** di `flushAndLockHashes`. PostgreSQL mendeteksi konflik antar transaksi concurrent pada baris yang sama dan mengabort salah satunya, sehingga:
- Dua swap concurrent untuk user yang sama tidak bisa keduanya lolos — yang kalah mendapat error serialization dan tidak memproses hashes yang sama.
- Mining sync concurrent (polling 10 detik) yang mencoba mengupdate `accumulatedHashes` di saat bersamaan akan block sampai swap selesai, sehingga tidak ada hashes yang hilang.

---

### BUG-003 — ~~`lazyCron.expireContracts` Kehilangan Hashes Saat Expiry~~ ✅ FIXED

**File:** `lib/lazyCron.ts`  
**Fix:** Fungsi `expireContracts()` lokal yang salah dihapus dan diganti dengan panggilan ke `markExpiredContracts()` dari `lib/miningService.ts`.

`markExpiredContracts()` sudah mengimplementasikan urutan yang benar:
1. Temukan semua contract ACTIVE yang sudah melewati `expiresAt`
2. Flush pending hashes ke semua contract tersebut terlebih dahulu (`flushActiveContracts`)
3. Baru ubah status menjadi `EXPIRED`

Dengan ini tidak ada lagi dua implementasi berbeda — satu sumber kebenaran untuk logika expiry contract.

---

### BUG-004 — Endpoint `/api/cron` Tidak Terproteksi

**File:** `app/api/cron/route.ts`, `middleware.ts`  
**Dampak:** Siapapun bisa memicu cron job secara manual dari internet tanpa autentikasi.

**Masalah:** Middleware hanya memproteksi `/api/admin/*` dan `/admin/*`. Endpoint `/api/cron` (POST dan GET) tidak memiliki proteksi apapun. Endpoint POST ini dapat memicu `forceRunCronJobs()` atau `runJobManually()` yang mempengaruhi data DB.

**Perbaikan:** Tambahkan `/api/cron` ke dalam perlindungan admin di middleware, atau tambahkan guard autentikasi di dalam handler:
```ts
// Di middleware.ts
if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/cron")) {
  const payload = await verifyAdminToken(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

---

### BUG-005 — Admin Password Dibandingkan dengan Plain String (Timing Attack)

**File:** `app/api/admin/auth/route.ts`  
**Dampak:** Rentan terhadap timing attack; password admin bisa di-brute force dengan menganalisis waktu respons.

**Masalah:**
```ts
if (password !== adminPassword) {  // plain string comparison
  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
```

JavaScript `===` operator tidak constant-time. Penyerang bisa mengukur waktu respons untuk menebak password karakter demi karakter.

**Perbaikan:** Gunakan `timingSafeEqual` dari Node.js `crypto`:
```ts
import { timingSafeEqual } from "crypto";

const passwordMatch = timingSafeEqual(
  Buffer.from(password),
  Buffer.from(adminPassword)
);
if (!passwordMatch) { ... }
```

---

## 🟠 BUG TINGGI

### BUG-006 — ~~`ignoreBuildErrors: true` Menyembunyikan TypeScript Errors~~ ✅ FIXED

**Files diperbaiki:**
- `next.config.ts` — hapus `typescript.ignoreBuildErrors`
- `tsconfig.json` — exclude folder `types/` (file generated Next.js, tidak kompatibel dengan `tsc --noEmit`)
- `app/(app)/more/settings/page.tsx` — bug nyata yang terungkap: `"mainnet" ? "Mainnet" : "Testnet"` selalu truthy karena string literal tidak pernah falsy. Diganti dengan nilai literal `"Mainnet"` langsung.

`tsc --noEmit` sekarang berjalan tanpa error.

---

### BUG-007 — `api/user/wallet` Tidak Ada Autentikasi User

**File:** `app/api/user/wallet/route.ts`  
**Dampak:** Siapapun yang mengetahui `userId` lain bisa memutus atau mengganti wallet address user tersebut.

**Masalah:**
```ts
// Hanya cek userId ada di body, tidak ada verifikasi bahwa caller = pemilik akun
const { userId, walletAddress } = body;
const user = await prisma.user.findUnique({ where: { id: userId } });
```

Tidak ada token session atau verifikasi identitas. `userId` adalah cuid yang bisa di-enumerate jika bocor.

---

### BUG-008 — ~~Verifikasi Pembayaran: Hanya Cek 20 Transaksi Terakhir~~ ✅ FIXED

**Files diperbaiki:** `lib/tonWebVerification.ts`, `app/api/verify-payment/route.ts`

**Fix:**
1. `TX_FETCH_LIMIT` dinaikkan dari `20` ke `100` (limit maksimum TonCenter API v2).
2. Loop iterasi diubah dari `continue` ke `break` saat menemukan transaksi yang lebih lama dari cutoff — karena TonCenter mengembalikan urutan terbaru duluan, transaksi berikutnya pasti juga lebih lama, sehingga iterasi bisa dihentikan lebih awal (efisien).
3. Time window di `verify-payment/route.ts` tidak lagi hardcode 300 detik — sekarang dihitung dinamis dari `transaction.createdAt`: minimal 30 menit, maksimal 2 jam. Ini lebih fair untuk user yang mengalami delay antara transfer dan submit verifikasi.

---

### BUG-009 — `txHash` di Swap Bukan Hash Blockchain yang Nyata

**File:** `app/api/swap/route.ts`  
**Dampak:** Data audit trail swap tidak dapat diverifikasi di blockchain explorer.

**Masalah:**
```ts
// Placeholder, bukan hash asli
txHash = `seqno:${newSeqno}`;
```

Record swap di DB menyimpan `seqno:N` bukan transaction hash yang sebenarnya. Ini berarti tidak ada cara untuk melacak transaksi swap di blockchain.

---

### BUG-010 — Leaderboard Tidak Filter Expired Contracts

**File:** `app/api/leaderboard/route.ts`  
**Dampak:** User dengan contract expired masih tampil di leaderboard dengan power tinggi.

**Masalah:**
```ts
contracts: {
  where: { status: "ACTIVE" },  // ← hanya filter status, tidak filter expiresAt
  select: { power: true, bonus: true },
},
```

Contract bisa berstatus `ACTIVE` namun sudah melewati `expiresAt` (sebelum cron jalan). User tersebut tampil dengan power yang seharusnya sudah tidak valid.

**Perbaikan:**
```ts
contracts: {
  where: {
    status: "ACTIVE",
    expiresAt: { gt: BigInt(Date.now()) },  // tambahkan ini
  },
}
```

---

### BUG-011 — Team Page `powerLog` Menampilkan Data Fiktif

**File:** `app/api/team/route.ts`  
**Dampak:** Angka "power earned from referrals" di UI tidak mencerminkan data aktual DB.

**Masalah:** `powerLog` di-generate dengan menghitung ulang bonus dari config saat ini:
```ts
powerLog.push({
  powerEarned: joinBonusPower,  // menggunakan config SAAT INI, bukan saat join terjadi
});
```

Jika admin mengubah `join_bonus_power` atau `purchase_bonus_percent`, semua entri powerLog lama akan berubah nilainya, padahal bonus aktual sudah diberikan berdasarkan nilai lama.

`stats.totalPowerEarned` sendiri sudah benar (dari DB), tapi tiap entri log bisa berbeda dengan kenyataan.

---

## 🟡 BUG SEDANG

### BUG-012 — Task Completion: Validasi Referral Hardcode Task ID

**File:** `app/api/tasks/[id]/complete/route.ts`  
**Dampak:** Jika ID task referral di DB berubah (atau task baru ditambahkan via admin), validasi referral tidak akan berjalan.

**Masalah:**
```ts
const required: Record<string, number> = {
  "task-invite-1":  1,  // hardcoded
  "task-invite-5":  5,
  "task-invite-10": 10,
};
const req = required[taskId];
// Jika req === undefined, validasi dilewati — task selesai tanpa syarat
```

Task ID `task-invite-1` dst. sesuai dengan yang di-seed, tapi jika admin menambah task referral baru via panel, task tersebut tidak akan punya validasi dan bisa diklaim tanpa memenuhi syarat.

---

### BUG-013 — `AuthProvider` Menggunakan `tgUser` Tanpa Guard di `useEffect`

**File:** `components/AuthProvider.tsx`  
**Dampak:** `authenticate()` dipanggil ulang setiap `tgUser` berubah referensi objek, bukan hanya saat nilai berubah — bisa menyebabkan multiple concurrent auth requests.

**Masalah:**
```ts
useEffect(() => {
  authenticate();
}, [tgUser]); // tgUser adalah objek — referensi bisa berubah meski datanya sama
```

`TelegramProvider` menetapkan `user: webApp.initDataUnsafe.user` di setiap render. Jika parent re-render, object reference berubah dan `authenticate()` dipanggil lagi.

---

### BUG-014 — `MiningProvider` Sync Tiap 10 Detik Tanpa Debounce/Guard

**File:** `components/MiningProvider.tsx`  
**Dampak:** Jika tab tidak aktif lama lalu aktif kembali, semua sync yang tertunda bisa terkirim sekaligus; juga tidak ada penanganan saat request masih in-flight.

**Masalah:**
```ts
const interval = setInterval(refresh, 10_000);
```

Tidak ada cek apakah request sebelumnya masih berjalan. Jika server lambat dan butuh >10 detik, dua request sync bisa berjalan bersamaan untuk user yang sama, menyebabkan race condition di `flushActiveContracts`.

---

### BUG-015 — `flushActiveContracts` Parallel Writes Tanpa Transaksi DB

**File:** `lib/miningService.ts`  
**Dampak:** Jika salah satu `contract.update` gagal di tengah-tengah, sebagian contract ter-flush dan sebagian tidak — state mining jadi inconsisten.

**Masalah:**
```ts
await Promise.all(
  contracts.map((c) => {
    return prisma.contract.update({ ... data: { accumulatedHashes: { increment: delta }, lastSyncAt: BigInt(nowMs) } });
  })
);
```

Jika ada 5 contract dan update ke-3 gagal, contract 1-2 sudah ter-flush (`lastSyncAt` maju) tapi contract 3-5 tidak. Saat sync berikutnya, delta untuk contract 1-2 akan dihitung dari `nowMs` yang baru sehingga ada gap hashes yang hilang.

---

### BUG-016 — Free Plan: Tidak Ada Rate Limiting untuk Reaktivasi

**File:** `app/api/purchase/free/route.ts`  
**Dampak:** Tidak ada batasan berapa kali user boleh reaktivasi free plan.

**Masalah:** Endpoint ini memang hanya boleh dipanggil jika tidak ada contract ACTIVE, tapi tidak ada cooldown antar reaktivasi. User bisa terus reaktivasi free plan 12 jam setiap kali expired, efektif mendapat free plan tanpa batas.

Ini mungkin disengaja, tapi perlu dikonfirmasi — karena free plan seharusnya menjadi entry point untuk mendorong pembelian plan berbayar.

---

### BUG-017 — `CronTrigger` adalah Server Component yang Memanggil Fungsi dengan In-Memory State

**File:** `components/CronTrigger.tsx`  
**Dampak:** Di Next.js App Router, Server Components bisa di-render di multiple server instances. State in-memory `cronState` di `lazyCron.ts` tidak ter-share antar instances.

**Masalah:** `cronState` adalah module-level variable. Di deployment dengan multiple server instances (Vercel, dsb.), tiap instance punya `cronState` sendiri. Cron bisa jalan N kali (N = jumlah instances) bersamaan.

---

### BUG-018 — ~~Swap Rollback Tidak Akurat: `increment: hashesToSwap`~~ ✅ FIXED

**Files diperbaiki:** `lib/miningService.ts`, `app/api/swap/route.ts`

**Fix:**
1. `flushAndLockHashes` sekarang mengembalikan `contractSnapshots: { id, hashes }[]` — array yang merekam `accumulatedHashes` per-contract tepat sesaat setelah flush dan sebelum reset ke 0.
2. Rollback di `swap/route.ts` menggunakan snapshot ini untuk me-restore setiap contract ke nilai pastinya via `contract.update({ data: { accumulatedHashes: s.hashes } })`, bukan `updateMany` dengan `increment: total` yang mendistribusi nilai secara merata ke semua contract.

---

### BUG-019 — `serializeUser` Kehilangan Type Safety

**File:** `app/api/auth/telegram/route.ts`  
**Dampak:** Perubahan schema Prisma `User` tidak akan terdeteksi oleh TypeScript karena fungsi menerima `Record<string, unknown>`.

**Masalah:**
```ts
function serializeUser(user: Record<string, unknown>) {  // type unsafe
  return { ...user, telegramId: String(user.telegramId) };
}
```

Field apapun yang ditambahkan ke model `User` Prisma tidak akan otomatis ikut terserialize/divalidasi.

---

## 🔵 BUG RENDAH / KUALITAS KODE

### BUG-020 — `TelegramProvider` Return `null` saat `!isReady` Memblokir Seluruh Render

**File:** `components/TelegramProvider.tsx`  
**Dampak:** UX — layar kosong ditampilkan saat WebApp belum `ready`, termasuk pada koneksi lambat.

```ts
if (!isReady) return null;  // blank screen
```

Sebaiknya tampilkan loading skeleton agar UX lebih baik.

---

### BUG-021 — `admin/plans` Tidak Validasi `slug` Unik saat Create

**File:** `app/api/admin/plans/route.ts`  
**Dampak:** Error 500 tanpa pesan yang jelas jika admin mencoba membuat plan dengan slug yang sudah ada.

Prisma akan throw `P2002` (unique constraint violation) yang tidak di-handle khusus, sehingga user melihat "Internal server error" generik.

---

### BUG-022 — `purchase/route.ts` Tidak Validasi `isFree` Plan

**File:** `app/api/purchase/route.ts`  
**Dampak:** User bisa membuat transaction PENDING untuk free plan, menciptakan data kotor.

**Masalah:**
```ts
const plan = await prisma.plan.findUnique({ where: { id: planId } });
if (!plan || !plan.isActive) { ... }
// Tidak ada cek plan.isFree
```

Free plan seharusnya hanya bisa di-claim via `/api/purchase/free`, bukan lewat flow pembayaran biasa.

---

### BUG-023 — `history/route.ts` Tidak Ada Paginasi

**File:** `app/api/history/route.ts`  
**Dampak:** User dengan riwayat transaksi sangat banyak akan menerima payload JSON yang besar setiap kali membuka halaman history.

Endpoint mengambil 50 transactions + 50 swaps sekaligus tanpa opsi pagination.

---

### BUG-024 — `AuthProvider` Dev Mode Menyimpan Seluruh User Object di `localStorage`

**File:** `components/AuthProvider.tsx`  
**Dampak:** Jika schema `IAuthUser` berubah (field ditambah/dihapus), data di localStorage dari sesi sebelumnya bisa menyebabkan bug halus di mode development.

**Masalah:**
```ts
const devUser = localStorage.getItem("dream_miner_dev_user");
if (devUser) {
  setUser(JSON.parse(devUser));  // tidak ada validasi schema
  setStatus("authenticated");
}
```

Tidak ada validasi bahwa object yang tersimpan cocok dengan `IAuthUser` yang diharapkan.

---

## Prioritas Perbaikan yang Disarankan

1. **BUG-001** — Validasi Telegram `initData` (security kritis)
2. **BUG-004** — Proteksi endpoint `/api/cron`
3. **BUG-005** — Timing-safe admin password comparison
4. **BUG-007** — Auth guard untuk wallet endpoint
5. **BUG-003** — Flush hashes sebelum expire di lazyCron
6. **BUG-002** — Race condition di swap
7. **BUG-006** — Hapus `ignoreBuildErrors: true`
8. **BUG-010** — Filter `expiresAt` di leaderboard
9. **BUG-008** — Tingkatkan limit verifikasi transaksi
10. **BUG-015** — Gunakan Prisma transaction saat flush contracts

---

*Laporan ini dibuat berdasarkan analisis statis kode. Beberapa bug (terutama race condition) mungkin membutuhkan load testing untuk direproduksi.*
