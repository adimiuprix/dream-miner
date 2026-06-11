# JWT Authentication Implementation Plan

> Status: **Pending** — saat ini semua route hanya menerima `userId` tanpa verifikasi apapun.

---

## Masalah Saat Ini

Semua user-facing API route menerima `userId` (UUID) sebagai parameter tanpa memverifikasi bahwa caller benar-benar pemilik akun tersebut. Siapapun yang mengetahui UUID user bisa melakukan request atas nama user tersebut — termasuk swap TON, complete task, dan update wallet address.

---

## Solusi: JWT Token

Tidak menggunakan HMAC Telegram (terlalu kompleks), cukup JWT sederhana yang diterbitkan saat login.

### Alur

```
[Telegram Mini App]
      │
      ▼
POST /api/auth/telegram  ← kirim data Telegram user
      │
      ▼
Server upsert user di DB
      │
      ▼
Return { user, token: "<JWT>" }   ← JWT berisi { userId, telegramId }
      │
      ▼
Client simpan JWT di memory (AuthProvider)
      │
      ▼
Setiap API call → Authorization: Bearer <JWT>
      │
      ▼
Route handler panggil getAuthUser(request) → dapat userId terverifikasi
```

---

## Langkah Implementasi

### 1. Install dependency

```bash
npm install jose
```

`jose` dipilih karena kompatibel dengan Next.js Edge Runtime, tidak butuh Node.js crypto native.

---

### 2. Buat `lib/auth.ts`

```ts
import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const EXPIRY = "30d";

/** Terbitkan JWT untuk user yang baru login */
export async function signToken(payload: { userId: string; telegramId: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(SECRET);
}

/** Verifikasi JWT dari request header, return payload atau null */
export async function getAuthUser(
  request: NextRequest
): Promise<{ userId: string; telegramId: string } | null> {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice(7);
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { userId: string; telegramId: string };
  } catch {
    return null;
  }
}
```

---

### 3. Update `.env`

```env
JWT_SECRET=ganti_dengan_random_string_panjang_minimal_32_karakter
```

Generate secret: `openssl rand -base64 32`

---

### 4. Update `POST /api/auth/telegram/route.ts`

Tambahkan import dan kembalikan token di response:

```ts
import { signToken } from "@/lib/auth";

// Di akhir handler, sebelum return response:
const token = await signToken({
  userId: user.id,
  telegramId: String(user.telegramId),
});

return NextResponse.json({ user: serializeUser(user), isNewUser, token });
```

---

### 5. Update `components/AuthProvider.tsx`

Simpan token setelah login berhasil:

```ts
// Tambah state
const [token, setToken] = useState<string | null>(null);

// Setelah fetch auth berhasil:
const data = await res.json();
setUser(data.user);
setToken(data.token);  // ← simpan token

// Expose via context agar bisa dipakai komponen lain
// atau buat helper di AuthProvider:
const authFetch = (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};
```

---

### 6. Update semua user-facing API routes

Ganti pola `const { userId } = body` dengan `getAuthUser()`:

```ts
// SEBELUM
const { userId } = await request.json();
if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

// SESUDAH
import { getAuthUser } from "@/lib/auth";

const authUser = await getAuthUser(request);
if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const { userId } = authUser;
```

**Routes yang perlu diupdate:**

| Route | Method | Parameter saat ini |
|---|---|---|
| `/api/contracts` | GET | `?userId=` query param |
| `/api/mining/sync` | POST | `body.userId` |
| `/api/swap` | POST | `body.userId` |
| `/api/purchase` | POST | `body.userId` |
| `/api/purchase/free` | POST | `body.userId` |
| `/api/tasks` | GET | `?userId=` query param |
| `/api/tasks/[id]/complete` | POST | `body.userId` |
| `/api/team` | GET | `?userId=` query param |
| `/api/history` | GET | `?userId=` query param |
| `/api/user/wallet` | POST | `body.userId` |
| `/api/verify-payment` | POST | `body.userId` |

---

### 7. Proteksi Admin Routes

Admin routes diproteksi terpisah dengan secret header — tidak perlu JWT user:

```ts
// lib/adminAuth.ts
export function isAdminRequest(request: NextRequest): boolean {
  const secret = request.headers.get("x-admin-secret");
  return secret === process.env.ADMIN_SECRET;
}
```

Tambah `ADMIN_SECRET=...` di `.env` dan set header di AdminSidebar/AdminMobileBar saat fetch.

---

## Catatan

- Token disimpan di **memory** (React state), bukan localStorage — hilang saat page refresh, tapi Telegram Mini App jarang di-refresh manual, auth akan re-run otomatis.
- Jika ingin persist, bisa simpan di `sessionStorage` saja (bukan localStorage untuk keamanan lebih baik).
- Token expiry 30 hari — cukup panjang untuk Mini App, tidak perlu refresh token logic.
