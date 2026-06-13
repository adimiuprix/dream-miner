# Bug Report — Dream Miner

> Dibuat: 12 Juni 2026  
> Diperbarui: 13 Juni 2026  
> Cakupan: Seluruh codebase (`app/`, `components/`, `lib/`, `prisma/`)

---

## Ringkasan

| Tingkat | Jumlah | Sudah Fix |
|---|---|---|
| 🔴 Kritis | 5 | 5 ✅ |
| 🟠 Tinggi | 6 | 6 ✅ |
| 🟡 Sedang | 8 | 6 ✅ |
| 🔵 Rendah / Kode | 5 | 5 ✅ |
| **Total** | **24** | **22 ✅** |

> **2 bug belum diperbaiki:** BUG-016 (perlu keputusan product), BUG-017 (perlu perubahan arsitektur deployment).

---

## 🔴 BUG KRITIS

### BUG-001 — ~~Tidak Ada Validasi Telegram `initData` di API Auth~~ ✅ FIXED

**File:** `app/api/auth/telegram/route.ts`

**Fix:** Ditambahkan fungsi `verifyTelegramInitData()` menggunakan HMAC-SHA256 sesuai spesifikasi resmi Telegram. Server sekarang wajib menerima `initData` dari client dan memverifikasinya dengan `BOT_TOKEN`. Request tanpa `initData` valid ditolak dengan HTTP 401. Dev mode aktif jika `BOT_TOKEN=dev` di `.env`.

```ts
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

Client (`components/AuthProvider.tsx`) sekarang mengirim `initData` dari `TelegramProvider` di setiap request auth.

> ⚠️ Pastikan `BOT_TOKEN` di production **bukan** `"dev"`.

---

### BUG-002 — ~~Race Condition pada Swap: Double-Counting Hashes~~ ✅ FIXED

**File:** `app/api/swap/route.ts`, `lib/miningService.ts`

**Fix:** Seluruh operasi swap (flush pending hashes → baca total → validasi minimum → reset ke 0 → buat swap record) dijalankan dalam **satu Serializable DB transaction** di `flushAndLockHashes`. PostgreSQL mendeteksi konflik antar transaksi concurrent pada baris yang sama dan mengabort salah satunya, sehingga:
- Dua swap concurrent untuk user yang sama tidak bisa keduanya lolos.
- Mining sync concurrent tidak akan menyebabkan hashes hilang.

---

### BUG-003 — ~~`lazyCron.expireContracts` Kehilangan Hashes Saat Expiry~~ ✅ FIXED

**File:** `lib/lazyCron.ts`

**Fix:** Fungsi `expireContracts()` lokal yang salah dihapus dan diganti dengan panggilan ke `markExpiredContracts()` dari `lib/miningService.ts`, yang sudah mengimplementasikan urutan yang benar: flush hashes terlebih dahulu, baru ubah status ke `EXPIRED`.

---

### BUG-004 — ~~Endpoint `/api/cron` Tidak Terproteksi~~ ✅ FIXED

**File:** `middleware.ts`

**Fix:** Ditambahkan `/api/cron/:path*` ke matcher middleware. Setiap request ke `/api/cron` sekarang diperiksa oleh `verifyAdminToken` — tanpa token admin yang valid, server mengembalikan HTTP 401.

```ts
// middleware.ts
if (pathname.startsWith("/api/cron")) {
  const payload = await verifyAdminToken(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/cron/:path*"],
};
```

---

### BUG-005 — ~~Admin Password Dibandingkan dengan Plain String (Timing Attack)~~ ✅ FIXED

**File:** `app/api/admin/auth/route.ts`

**Fix:** Ganti `===` dengan `timingSafeEqual` dari Node.js `crypto`. Password di-pad ke panjang yang sama sebelum dibandingkan agar comparison benar-benar constant-time dan tidak bocorkan informasi panjang password.

```ts
const pwBuf     = Buffer.from(password);
const adminBuf  = Buffer.from(adminPassword);
const maxLen    = Math.max(pwBuf.length, adminBuf.length);
const pwPadded  = Buffer.concat([pwBuf,    Buffer.alloc(maxLen - pwBuf.length)]);
const admPadded = Buffer.concat([adminBuf, Buffer.alloc(maxLen - adminBuf.length)]);

const contentMatch = timingSafeEqual(pwPadded, admPadded);
const lengthMatch  = pwBuf.length === adminBuf.length;
if (!contentMatch || !lengthMatch) { /* reject */ }
```

---

## 🟠 BUG TINGGI

### BUG-006 — ~~`ignoreBuildErrors: true` Menyembunyikan TypeScript Errors~~ ✅ FIXED

**Files diperbaiki:** `next.config.ts`, `tsconfig.json`, `app/(app)/more/settings/page.tsx`

**Fix:**
- `next.config.ts` — hapus `typescript.ignoreBuildErrors`
- `tsconfig.json` — exclude folder `types/` (file generated Next.js)
- `app/(app)/more/settings/page.tsx` — `"mainnet" ? "Mainnet" : "Testnet"` (selalu truthy) diganti dengan nilai literal `"Mainnet"`

`tsc --noEmit` sekarang berjalan bersih tanpa error.

---

### BUG-007 — ~~`api/user/wallet` Tidak Ada Autentikasi User~~ ✅ FIXED

**File:** `app/api/user/wallet/route.ts`, `hooks/use-wallet-sync.ts`

**Fix:** Server kini memverifikasi `initData` dari Telegram dan memastikan `user.id` di request cocok dengan `user.id` di dalam `initData`. Client (`hooks/use-wallet-sync.ts`) mengirim `initData` bersama setiap request wallet PATCH.

```ts
// Verifikasi bahwa caller adalah pemilik akun
if (!verifyInitDataForUser(initData, botToken, user.telegramId)) {
  return NextResponse.json({ error: "Unauthorized: initData mismatch" }, { status: 401 });
}
```

---

### BUG-008 — ~~Verifikasi Pembayaran: Hanya Cek 20 Transaksi Terakhir~~ ✅ FIXED

**Files diperbaiki:** `lib/tonWebVerification.ts`, `app/api/verify-payment/route.ts`

**Fix:**
1. `TX_FETCH_LIMIT` dinaikkan dari `20` ke `100` (limit maksimum TonCenter API v2).
2. Loop iterasi menggunakan `break` saat menemukan transaksi lebih lama dari cutoff (efisien karena TonCenter mengembalikan urutan terbaru duluan).
3. Time window dihitung dinamis dari `transaction.createdAt`: minimal 30 menit, maksimal 2 jam.

---

### BUG-009 — ~~`txHash` di Swap Bukan Hash Blockchain yang Nyata~~ ✅ FIXED

**Files diperbaiki:** `lib/tonTxPoller.ts` (baru), `app/api/swap/route.ts`, `prisma/schema.prisma`

**Fix:**
1. `lib/tonTxPoller.ts` — fungsi `pollTxHash()` yang poll blockchain tiap 2 detik (maks 15 attempt = 30 detik) hingga seqno wallet naik, lalu ambil hash asli dari transaksi terakhir.
2. `app/api/swap/route.ts` — placeholder `seqno:N` diganti dengan `await pollTxHash(...)`. Jika timeout, `txHash` bernilai `null` — swap tetap COMPLETED karena TON sudah terkirim.
3. `prisma/schema.prisma` — field `txHash String?` ditambahkan ke model `Swap`.

---

### BUG-010 — ~~Leaderboard Tidak Filter Expired Contracts~~ ✅ FIXED

**File:** `app/api/leaderboard/route.ts`

**Fix:** Tambahkan `expiresAt: { gt: BigInt(Date.now()) }` di filter query contracts. Contract yang sudah melewati expiry tidak lagi ikut dihitung dalam total power user di leaderboard.

```ts
contracts: {
  where: {
    status: "ACTIVE",
    expiresAt: { gt: BigInt(Date.now()) },  // ← ditambahkan
  },
}
```

---

### BUG-011 — ~~Team Page `powerLog` Menampilkan Data Fiktif~~ ✅ FIXED

**File:** `app/api/team/route.ts`

**Fix:** Purchase entries di `powerLog` sekarang menggunakan `meta.power` yang tersimpan di metadata transaksi saat pembelian terjadi — nilainya tidak terpengaruh jika admin mengubah config plan setelahnya. `stats.totalPowerEarned` (dari bonus contracts di DB) tetap sebagai angka agregat yang akurat.

> Catatan: Nilai join bonus per entri masih menggunakan config saat ini karena nilai historis tidak disimpan per-event. Ini adalah limitasi yang bisa diatasi dengan menyimpan nilai bonus saat join di tabel tersendiri jika diperlukan.

---

## 🟡 BUG SEDANG

### BUG-012 — ~~Task Completion: Validasi Referral Hardcode Task ID~~ ✅ FIXED

**Files diperbaiki:** `prisma/schema.prisma`, `prisma/seed.ts`, `app/api/tasks/[id]/complete/route.ts`

**Fix:**
1. Field `metadata String?` ditambahkan ke model `Task` di schema Prisma (`prisma db push` sudah dijalankan).
2. REFERRAL tasks di seed sekarang menyimpan `{ "requiredReferrals": N }` di field metadata.
3. Complete route membaca `task.metadata` untuk validasi, bukan hardcoded ID — task referral baru yang dibuat admin pun tervalidasi selama `metadata` diisi.

```ts
// Baca requiredReferrals dari metadata, bukan hardcode ID
const meta = JSON.parse(task.metadata ?? "{}");
if (typeof meta.requiredReferrals === "number") {
  const count = await prisma.user.count({ where: { referredById: userId } });
  if (count < meta.requiredReferrals) { /* reject */ }
}
```

---

### BUG-013 — ~~`AuthProvider` Menggunakan `tgUser` Tanpa Guard di `useEffect`~~ ✅ FIXED

**File:** `components/AuthProvider.tsx`

**Fix:** Dependency `useEffect` diubah dari `[tgUser]` (object reference) ke `[tgUser?.id]` (primitive number). `authenticate()` sekarang hanya dipanggil ulang jika `telegramId` benar-benar berubah nilainya.

```ts
// Sebelum: }, [tgUser]);   ← re-trigger setiap object reference berubah
// Sesudah:
}, [tgUser?.id]);            // ← hanya trigger saat id berubah
```

---

### BUG-014 — ~~`MiningProvider` Sync Tiap 10 Detik Tanpa Guard~~ ✅ FIXED

**File:** `components/MiningProvider.tsx`

**Fix:** Ditambahkan `isSyncingRef` sebagai in-flight guard. Jika request sync sebelumnya belum selesai saat interval berikutnya tiba, interval tersebut di-skip — tidak ada dua request sync yang berjalan bersamaan untuk satu user.

```ts
const isSyncingRef = useRef(false);

const refresh = useCallback(async () => {
  if (isSyncingRef.current) return;  // ← skip jika masih in-flight
  isSyncingRef.current = true;
  try { /* ... */ } finally { isSyncingRef.current = false; }
}, [user?.id]);
```

---

### BUG-015 — ~~`flushActiveContracts` Parallel Writes Tanpa Transaksi DB~~ ✅ FIXED

**File:** `lib/miningService.ts`

**Fix:** `Promise.all()` diganti dengan `prisma.$transaction([...])`. Semua contract updates dalam satu flush sekarang bersifat atomik — jika salah satu gagal, seluruh batch di-rollback sehingga tidak ada gap/inkonsistensi hashes.

```ts
// Sebelum: await Promise.all(contracts.map(...update...))
// Sesudah:
await prisma.$transaction(
  contracts.map((c) => prisma.contract.update({ where: { id: c.id }, data: { ... } }))
);
```

---

### BUG-016 — Free Plan: Tidak Ada Rate Limiting untuk Reaktivasi

**File:** `app/api/purchase/free/route.ts`  
**Status:** ⏳ Belum diperbaiki — perlu keputusan product.

**Masalah:** Tidak ada cooldown antar reaktivasi free plan. User bisa reaktivasi setiap 12 jam tanpa batas, efektif menggunakan free plan selamanya tanpa membeli plan berbayar.

**Opsi perbaikan:**
- Batasi maksimum N kali reaktivasi seumur hidup per user.
- Atau terima ini sebagai intended behavior (free plan = akuisisi user).

---

### BUG-017 — `CronTrigger` dengan In-Memory State Tidak Kompatibel Multi-Instance

**File:** `components/CronTrigger.tsx`, `lib/lazyCron.ts`  
**Status:** ⏳ Belum diperbaiki — perlu perubahan arsitektur.

**Masalah:** `cronState` adalah module-level variable. Di deployment multi-instance (Vercel, dll.), tiap instance punya state sendiri sehingga cron bisa jalan N kali bersamaan.

**Solusi yang disarankan:** Pindahkan state cron ke database (tabel `CronLock`) atau gunakan external scheduler (Vercel Cron Jobs, pg-boss, BullMQ).

---

### BUG-018 — ~~Swap Rollback Tidak Akurat: `increment: hashesToSwap`~~ ✅ FIXED

**Files diperbaiki:** `lib/miningService.ts`, `app/api/swap/route.ts`

**Fix:** `flushAndLockHashes` mengembalikan `contractSnapshots: { id, hashes }[]`. Rollback menggunakan snapshot ini untuk me-restore nilai `accumulatedHashes` per-contract secara tepat via `contract.update`, bukan `updateMany` dengan `increment` yang mendistribusi nilai merata.

---

### BUG-019 — ~~`serializeUser` Kehilangan Type Safety~~ ✅ FIXED

**File:** `app/api/auth/telegram/route.ts`

**Fix:** Parameter `serializeUser` diubah dari `Record<string, unknown>` ke tipe Prisma `User` yang eksplisit. TypeScript sekarang akan mendeteksi jika ada field model `User` yang tidak ter-handle saat schema Prisma berubah.

---

## 🔵 BUG RENDAH / KUALITAS KODE

### BUG-020 — ~~`TelegramProvider` Return `null` saat `!isReady` Memblokir Seluruh Render~~ ✅ FIXED

**File:** `components/TelegramProvider.tsx`

**Fix:** `return null` diganti dengan spinner loading yang menampilkan indikator visual saat WebApp Telegram belum `ready`. User tidak lagi melihat layar kosong pada koneksi lambat.

---

### BUG-021 — ~~`admin/plans` Tidak Validasi `slug` Unik saat Create~~ ✅ FIXED

**File:** `app/api/admin/plans/route.ts`

**Fix:** Ditambahkan pengecekan eksplisit sebelum `prisma.plan.create()`. Jika slug sudah ada, server mengembalikan HTTP 409 dengan pesan error yang jelas daripada HTTP 500 generik dari Prisma.

```ts
const existing = await prisma.plan.findUnique({ where: { slug } });
if (existing) {
  return NextResponse.json({ error: `Slug "${slug}" already exists` }, { status: 409 });
}
```

---

### BUG-022 — ~~`purchase/route.ts` Tidak Validasi `isFree` Plan~~ ✅ FIXED

**File:** `app/api/purchase/route.ts`

**Fix:** Ditambahkan guard `if (plan.isFree)` setelah validasi plan aktif. Request untuk membeli free plan via endpoint ini ditolak dengan HTTP 400 dan pesan yang mengarahkan ke `/api/purchase/free`.

---

### BUG-023 — ~~`history/route.ts` Tidak Ada Paginasi~~ ✅ FIXED

**File:** `app/api/history/route.ts`

**Fix:** Endpoint sekarang menerima query params `?page=1&pageSize=20`. Default pageSize 20, maksimum 50. Response menyertakan `page` dan `pageSize` untuk navigasi client.

```
GET /api/history?userId=xxx&page=2&pageSize=20
```

---

### BUG-024 — ~~`AuthProvider` Dev Mode Menyimpan Seluruh User Object di `localStorage`~~ ✅ FIXED

**File:** `components/AuthProvider.tsx`

**Fix:** Ditambahkan validasi field wajib (`id`, `telegramId`, `firstName`) sebelum menggunakan data dari localStorage. Jika validasi gagal (schema berubah), data lama dihapus otomatis dan user diminta login ulang.

```ts
const parsed = JSON.parse(raw) as Partial<IAuthUser>;
if (parsed.id && parsed.telegramId && parsed.firstName) {
  setUser(parsed as IAuthUser);
} else {
  localStorage.removeItem("dream_miner_dev_user");  // data lama tidak valid
  setStatus("new_user");
}
```

---

## Status Keseluruhan

| Kategori | Total | Fixed | Pending |
|---|---|---|---|
| 🔴 Kritis | 5 | 5 | 0 |
| 🟠 Tinggi | 6 | 6 | 0 |
| 🟡 Sedang | 8 | 6 | 2 |
| 🔵 Rendah | 5 | 5 | 0 |
| **Total** | **24** | **22** | **2** |

**BUG-016** dan **BUG-017** adalah satu-satunya yang belum diselesaikan, keduanya bukan bug keamanan — BUG-016 membutuhkan keputusan product, BUG-017 membutuhkan perubahan arsitektur deployment.

---

*Laporan ini dibuat berdasarkan analisis statis kode. Beberapa bug (terutama race condition) mungkin membutuhkan load testing untuk direproduksi.*
