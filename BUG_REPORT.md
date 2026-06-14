# Bug Report — Dream Miner

> Dibuat: 12 Juni 2026  
> Diperbarui: 14 Juni 2026  
> Cakupan: Seluruh codebase (`app/`, `components/`, `lib/`, `prisma/`)

---

## Ringkasan

| Tingkat | Jumlah | Sudah Fix |
|---|---|---|
| 🔴 Kritis | 6 | 5 ✅ |
| 🟠 Tinggi | 9 | 6 ✅ |
| 🟡 Sedang | 10 | 6 ✅ |
| 🔵 Rendah / Kode | 6 | 5 ✅ |
| **Total** | **31** | **22 ✅** |

> **9 bug belum diperbaiki:** BUG-NEW-01 s/d BUG-NEW-07, BUG-016, BUG-017.

---

## 🔴 BUG KRITIS

### BUG-001 — ~~Tidak Ada Validasi Telegram `initData` di API Auth~~ ✅ FIXED

**File:** `app/api/auth/telegram/route.ts`

**Fix:** Ditambahkan fungsi `verifyTelegramInitData()` menggunakan HMAC-SHA256 sesuai spesifikasi resmi Telegram. Server sekarang wajib menerima `initData` dari client dan memverifikasinya dengan `TELEGRAM_BOT_TOKEN`. Request tanpa `initData` valid ditolak dengan HTTP 401. Dev mode aktif jika `TELEGRAM_BOT_TOKEN=dev` di `.env`.

Client (`components/AuthProvider.tsx`) sekarang mengirim `initData` dari `TelegramProvider` di setiap request auth.

> ⚠️ Pastikan `TELEGRAM_BOT_TOKEN` di production **bukan** `"dev"`.

---

### BUG-002 — ~~Race Condition pada Swap: Double-Counting Hashes~~ ✅ FIXED

**File:** `app/api/swap/route.ts`, `lib/miningService.ts`

**Fix:** Seluruh operasi swap dijalankan dalam **satu Serializable DB transaction** di `flushAndLockHashes`. Dua swap concurrent untuk user yang sama tidak bisa keduanya lolos, dan mining sync concurrent tidak akan menyebabkan hashes hilang.

---

### BUG-003 — ~~`lazyCron.expireContracts` Kehilangan Hashes Saat Expiry~~ ✅ FIXED

**File:** `lib/lazyCron.ts`

**Fix:** Fungsi lokal yang salah dihapus dan diganti dengan `markExpiredContracts()` dari `lib/miningService.ts` yang flush hashes terlebih dahulu sebelum mengubah status ke `EXPIRED`.

---

### BUG-004 — ~~Endpoint `/api/cron` Tidak Terproteksi~~ ✅ FIXED

**File:** `middleware.ts`

**Fix:** Ditambahkan `/api/cron/:path*` ke matcher middleware. Setiap request ke `/api/cron` diperiksa oleh `verifyAdminToken` — tanpa token admin yang valid dikembalikan HTTP 401.

---

### BUG-005 — ~~Admin Password Dibandingkan dengan Plain String (Timing Attack)~~ ✅ FIXED

**File:** `app/api/admin/auth/route.ts`

**Fix:** Ganti `===` dengan `timingSafeEqual` dari Node.js `crypto`. Password di-pad ke panjang yang sama agar comparison constant-time.

---

### BUG-NEW-01 — `userId` Tidak Diverifikasi di Endpoint User-Facing

**Files:** `app/api/mining/sync/route.ts`, `app/api/swap/route.ts`, `app/api/purchase/free/route.ts`, `app/api/history/route.ts`, `app/api/contracts/route.ts`, `app/api/tasks/route.ts`, `app/api/tasks/[id]/complete/route.ts`  
**Dampak:** 🔴 **Kritis** — User A yang mengetahui `userId` user B dapat melakukan operasi atas nama user B: sync mining, memicu swap, mengklaim free plan, melihat history transaksi, mengklaim task reward.

**Masalah:** Semua endpoint ini hanya menerima `userId` dari body/query tanpa memverifikasi bahwa caller adalah pemilik akun tersebut. Tidak ada session token atau validasi `initData` Telegram.

```ts
// Contoh di /api/mining/sync — tidak ada verifikasi ownership
const { userId } = await request.json();
const stats = await syncMiningProgress(userId);  // langsung dieksekusi
```

**Risiko konkret:**
- Penyerang bisa memicu swap hashes milik user lain ke wallet penyerang sendiri (karena wallet address sudah tersimpan di akun user lain, bukan akun penyerang — tapi tetap bisa mengganggu)
- Penyerang bisa menguras hashes user lain dengan memicu sync berulang
- Penyerang bisa mengklaim free plan dan task reward atas nama user lain

**Perbaikan yang disarankan:** Gunakan pola yang sama dengan `/api/user/wallet` — kirim `initData` Telegram di setiap request dan verifikasi di server bahwa `user.id` di `initData` cocok dengan `userId` yang diminta.

---

## 🟠 BUG TINGGI

### BUG-006 — ~~`ignoreBuildErrors: true` Menyembunyikan TypeScript Errors~~ ✅ FIXED

**Files diperbaiki:** `next.config.ts`, `tsconfig.json`, `app/(app)/more/settings/page.tsx`

**Fix:** `typescript.ignoreBuildErrors` dihapus, folder `types/` di-exclude dari tsconfig, bug string literal selalu truthy diperbaiki. `tsc --noEmit` sekarang berjalan bersih.

---

### BUG-007 — ~~`api/user/wallet` Tidak Ada Autentikasi User~~ ✅ FIXED

**File:** `app/api/user/wallet/route.ts`, `hooks/use-wallet-sync.ts`

**Fix:** Server memverifikasi `initData` Telegram dan memastikan `telegramId` di initData cocok dengan pemilik akun. Client mengirim `initData` bersama setiap request wallet PATCH.

---

### BUG-008 — ~~Verifikasi Pembayaran: Hanya Cek 20 Transaksi Terakhir~~ ✅ FIXED

**Files diperbaiki:** `lib/tonWebVerification.ts`, `app/api/verify-payment/route.ts`

**Fix:** `TX_FETCH_LIMIT` dinaikkan ke `100`, loop menggunakan `break` pada cutoff, time window dihitung dinamis (min 30 menit, maks 2 jam).

---

### BUG-009 — ~~`txHash` di Swap Bukan Hash Blockchain yang Nyata~~ ✅ FIXED

**Files diperbaiki:** `lib/tonTxPoller.ts` (baru), `app/api/swap/route.ts`, `prisma/schema.prisma`

**Fix:** `pollTxHash()` poll seqno tiap 2 detik hingga naik, lalu ambil hash transaksi asli dari chain. Field `txHash String?` ditambahkan ke model `Swap`.

---

### BUG-010 — ~~Leaderboard Tidak Filter Expired Contracts~~ ✅ FIXED

**File:** `app/api/leaderboard/route.ts`

**Fix:** Tambahkan `expiresAt: { gt: BigInt(Date.now()) }` di filter contracts query.

---

### BUG-011 — ~~Team Page `powerLog` Menampilkan Data Fiktif~~ ✅ FIXED

**File:** `app/api/team/route.ts`

**Fix:** Purchase entries menggunakan `meta.power` dari metadata transaksi historis, bukan nilai plan saat ini.

---

### BUG-NEW-02 — `purchase/free` Tidak Ada DB Lock — Race Condition Double Activation

**File:** `app/api/purchase/free/route.ts`  
**Dampak:** 🟠 **Tinggi** — Dua request concurrent (misalnya user tap tombol dua kali cepat) bisa sama-sama lolos pengecekan `activeContract` dan membuat dua free plan ACTIVE sekaligus, memberikan user mining power double.

**Masalah:**
```ts
// Cek apakah sudah ada contract aktif
const activeContract = await prisma.contract.findFirst({ where: { ... } });
if (activeContract) return error;  // ← window race condition di sini

// Dua request bisa sama-sama lolos sampai sini
contract = await prisma.contract.update(...)  // atau create
```

**Perbaikan:** Bungkus seluruh operasi cek + update/create dalam `prisma.$transaction` dengan isolation level yang sesuai, atau gunakan `upsert` dengan kondisi yang lebih ketat.

---

### BUG-NEW-03 — `verify-payment` Tidak Validasi Ownership Transaksi

**File:** `app/api/verify-payment/route.ts`  
**Dampak:** 🟠 **Tinggi** — User A bisa mengirim `transactionId` milik user B ke endpoint ini. Jika verifikasi blockchain lolos, contract akan aktif di akun B — bukan eksploitasi langsung tapi bisa digunakan untuk mengganggu atau memanipulasi state akun lain.

**Masalah:**
```ts
const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
// Tidak ada validasi bahwa transaction.userId === caller's userId
```

**Perbaikan:** Tambahkan `userId` di request body dan validasi bahwa `transaction.userId === userId` sebelum diproses.

---

### BUG-NEW-04 — `PURCHASE` Task Validation Masih Hardcode Task ID

**File:** `app/api/tasks/[id]/complete/route.ts`  
**Dampak:** 🟠 **Tinggi** — Task `task-buy-first-plan` dan `task-connect-wallet` masih menggunakan hardcoded ID untuk validasi PURCHASE type, sama seperti pola yang sudah diperbaiki di BUG-012 untuk REFERRAL type. Task PURCHASE baru yang dibuat admin tidak akan punya validasi dan bisa diklaim tanpa syarat.

**Masalah:**
```ts
if (task.type === "PURCHASE") {
  if (taskId === "task-buy-first-plan") { ... }   // ← hardcoded
  if (taskId === "task-connect-wallet") { ... }   // ← hardcoded
}
```

**Perbaikan:** Gunakan `task.metadata` (sama seperti BUG-012) dengan field seperti `{ "purchaseType": "first_plan" }` atau `{ "purchaseType": "connect_wallet" }`.

---

## 🟡 BUG SEDANG

### BUG-012 — ~~Task Completion: Validasi Referral Hardcode Task ID~~ ✅ FIXED

**Files diperbaiki:** `prisma/schema.prisma`, `prisma/seed.ts`, `app/api/tasks/[id]/complete/route.ts`

**Fix:** Field `metadata String?` ditambahkan ke model `Task`. REFERRAL tasks menyimpan `{ "requiredReferrals": N }`. Complete route membaca dari metadata, bukan hardcoded ID.

---

### BUG-013 — ~~`AuthProvider` Menggunakan `tgUser` Tanpa Guard di `useEffect`~~ ✅ FIXED

**File:** `components/AuthProvider.tsx`

**Fix:** Dependency `useEffect` diubah dari `[tgUser]` ke `[tgUser?.id]` (primitive). `authenticate()` hanya dipanggil ulang jika telegramId benar-benar berubah.

---

### BUG-014 — ~~`MiningProvider` Sync Tiap 10 Detik Tanpa Guard~~ ✅ FIXED

**File:** `components/MiningProvider.tsx`

**Fix:** `isSyncingRef` guard ditambahkan. Jika request sync sebelumnya belum selesai, interval berikutnya di-skip.

---

### BUG-015 — ~~`flushActiveContracts` Parallel Writes Tanpa Transaksi DB~~ ✅ FIXED

**File:** `lib/miningService.ts`

**Fix:** `Promise.all()` diganti dengan `prisma.$transaction([...])`. Semua contract updates dalam satu flush bersifat atomik.

---

### BUG-016 — Free Plan: Tidak Ada Rate Limiting untuk Reaktivasi

**File:** `app/api/purchase/free/route.ts`  
**Status:** ⏳ Belum diperbaiki — perlu keputusan product.

**Masalah:** Tidak ada cooldown antar reaktivasi free plan. User bisa reaktivasi setiap 12 jam tanpa batas.

**Opsi:** Batasi maksimum N kali reaktivasi seumur hidup, atau terima sebagai intended behavior.

---

### BUG-017 — `CronTrigger` dengan In-Memory State Tidak Kompatibel Multi-Instance

**File:** `components/CronTrigger.tsx`, `lib/lazyCron.ts`  
**Status:** ⏳ Belum diperbaiki — perlu perubahan arsitektur.

**Masalah:** `cronState` adalah module-level variable. Di Vercel (multi-instance), cron bisa jalan N kali bersamaan.

**Solusi:** Pindahkan state cron ke DB (`CronLock` table) atau gunakan Vercel Cron Jobs.

---

### BUG-018 — ~~Swap Rollback Tidak Akurat: `increment: hashesToSwap`~~ ✅ FIXED

**Files diperbaiki:** `lib/miningService.ts`, `app/api/swap/route.ts`

**Fix:** `flushAndLockHashes` mengembalikan `contractSnapshots`. Rollback me-restore nilai per-contract secara tepat via snapshot, bukan `updateMany` dengan `increment` merata.

---

### BUG-019 — ~~`serializeUser` Kehilangan Type Safety~~ ✅ FIXED

**File:** `app/api/auth/telegram/route.ts`

**Fix:** Parameter `serializeUser` diubah ke tipe Prisma `User` yang eksplisit.

---

### BUG-NEW-05 — `markExpiredContracts` Ada TOCTOU Window

**File:** `lib/miningService.ts`  
**Dampak:** 🟡 **Sedang** — Ada jeda waktu antara query `findMany` contract yang expired dan `updateMany` status ke EXPIRED. Jika mining sync berjalan di sela-sela dua operasi ini (di instance yang berbeda), contract yang sudah diflush bisa diflush lagi oleh sync berikutnya dengan delta yang tumpang tindih.

**Masalah:**
```ts
const expiredContracts = await prisma.contract.findMany(...)  // T1: baca
await Promise.all(...flushActiveContracts...)                  // T2: flush
await prisma.contract.updateMany({ data: { status: "EXPIRED" } })  // T3: update
// Antara T2 dan T3: mining sync bisa flush ulang contract yang sama
```

**Perbaikan:** Bungkus seluruh operasi dalam satu transaksi, atau lakukan `updateMany` ke EXPIRED terlebih dahulu, baru flush.

---

### BUG-NEW-06 — History Pagination Tidak Akurat untuk Combined View

**File:** `app/api/history/route.ts`  
**Dampak:** 🟡 **Sedang** — `skip/take` diterapkan secara terpisah ke tabel `transactions` dan `swaps`. Client yang mencoba menampilkan timeline gabungan (transactions + swaps disortir by date) akan mendapat data yang tidak konsisten antar halaman — item bisa duplikat atau hilang.

**Masalah:**
```ts
// Kedua query menggunakan skip/take yang sama tapi dari tabel berbeda
transactions: skip=20, take=20  // item 21-40 dari transactions
swaps:        skip=20, take=20  // item 21-40 dari swaps
// Bukan item 21-40 dari gabungan keduanya
```

**Perbaikan:** Ambil semua data yang relevan, merge dan sort di server, lalu paginate dari combined list. Atau buat dua endpoint terpisah dengan pagination independen dan biarkan client merge.

---

## 🔵 BUG RENDAH / KUALITAS KODE

### BUG-020 — ~~`TelegramProvider` Return `null` saat `!isReady` Memblokir Seluruh Render~~ ✅ FIXED

**File:** `components/TelegramProvider.tsx`

**Fix:** `return null` diganti dengan spinner loading.

---

### BUG-021 — ~~`admin/plans` Tidak Validasi `slug` Unik saat Create~~ ✅ FIXED

**File:** `app/api/admin/plans/route.ts`

**Fix:** Pengecekan eksplisit sebelum `prisma.plan.create()`. Jika slug sudah ada, dikembalikan HTTP 409.

---

### BUG-022 — ~~`purchase/route.ts` Tidak Validasi `isFree` Plan~~ ✅ FIXED

**File:** `app/api/purchase/route.ts`

**Fix:** Guard `if (plan.isFree)` ditambahkan — request untuk free plan ditolak dan diarahkan ke `/api/purchase/free`.

---

### BUG-023 — ~~`history/route.ts` Tidak Ada Paginasi~~ ✅ FIXED

**File:** `app/api/history/route.ts`

**Fix:** Endpoint menerima `?page=1&pageSize=20`. Default 20, maksimum 50 per page.

---

### BUG-024 — ~~`AuthProvider` Dev Mode Menyimpan Seluruh User Object di `localStorage`~~ ✅ FIXED

**File:** `components/AuthProvider.tsx`

**Fix:** Validasi field wajib sebelum pakai data localStorage. Data tidak valid dihapus otomatis.

---

### BUG-NEW-07 — `tonWebVerification.ts` Ada Fungsi `sleep` yang Tidak Terpakai

**File:** `lib/tonWebVerification.ts`  
**Dampak:** 🔵 **Rendah** — Fungsi `sleep()` didefinisikan di file ini tapi hanya digunakan oleh `pollForTransaction()` — sebuah fungsi polling alternatif yang tidak dipanggil dari mana pun di codebase (fungsi yang dipakai adalah `pollTxHash()` dari `lib/tonTxPoller.ts`). Dead code ini membingungkan dan berpotensi menimbulkan duplikasi logika.

**Perbaikan:** Hapus `pollForTransaction()` dan `sleep()` dari `tonWebVerification.ts`, atau dokumentasikan dengan jelas kapan fungsi ini digunakan.

---

## Status Keseluruhan

| Kategori | Total | Fixed | Pending |
|---|---|---|---|
| 🔴 Kritis | 6 | 5 | 1 |
| 🟠 Tinggi | 9 | 6 | 3 |
| 🟡 Sedang | 10 | 6 | 4 |
| 🔵 Rendah | 6 | 5 | 1 |
| **Total** | **31** | **22** | **9** |

### Bug Pending (urutan prioritas)

| ID | Tingkat | Deskripsi | Aksi |
|---|---|---|---|
| BUG-NEW-01 | 🔴 Kritis | `userId` tidak diverifikasi di endpoint user-facing | Perlu fix segera |
| BUG-NEW-02 | 🟠 Tinggi | Race condition double activation free plan | Perlu fix segera |
| BUG-NEW-03 | 🟠 Tinggi | `verify-payment` tidak validasi ownership transaksi | Perlu fix segera |
| BUG-NEW-04 | 🟠 Tinggi | PURCHASE task validation masih hardcode task ID | Perlu fix |
| BUG-NEW-05 | 🟡 Sedang | `markExpiredContracts` TOCTOU window | Perlu fix |
| BUG-NEW-06 | 🟡 Sedang | History pagination tidak akurat untuk combined view | Perlu fix |
| BUG-016 | 🟡 Sedang | Free plan reaktivasi tanpa rate limiting | Keputusan product |
| BUG-017 | 🟡 Sedang | CronTrigger tidak kompatibel multi-instance | Arsitektur |
| BUG-NEW-07 | 🔵 Rendah | Dead code `pollForTransaction` di tonWebVerification | Cleanup |

---

*Laporan ini dibuat berdasarkan analisis statis kode. Beberapa bug (terutama race condition) mungkin membutuhkan load testing untuk direproduksi.*
