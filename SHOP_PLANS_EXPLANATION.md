# Shop Plans - Data Source Explanation 🛒

## 📍 Lokasi Data Plan

### File: `lib/tonPayment.ts`

Data plan **hardcoded** dalam konstanta `POWER_PLANS`.

```typescript
export const POWER_PLANS = [
  {
    id: "plan-118k",
    power: "118K",
    powerValue: 118000,
    finalReturn: "1.100 TON",
    price: 1,
    bonus: null,
    bonusValue: 0,
    bonusColor: null,
  },
  {
    id: "plan-600k",
    power: "600K",
    powerValue: 600000,
    finalReturn: "5.610 TON",
    price: 5,
    bonus: "+11.8K POWER",
    bonusValue: 11800,
    bonusColor: "#00d4aa",
  },
  // ... 3 plans lagi
];
```

---

## 🔄 Flow Penggunaan

### 1. Shop Page Import Plans

**File:** `app/shop/page.tsx`

```typescript
import { POWER_PLANS } from "@/lib/tonPayment";

export default function ShopPage() {
  return (
    <div>
      {POWER_PLANS.map((plan) => (
        <PlanCard 
          key={plan.id} 
          plan={plan} 
          onPurchase={handlePurchase}
        />
      ))}
    </div>
  );
}
```

### 2. Purchase API Validasi Plan

**File:** `app/api/purchase/route.ts`

```typescript
import { POWER_PLANS } from "@/lib/tonPayment";

export async function POST(request: NextRequest) {
  const { planId } = await request.json();
  
  // Validate plan exists
  const plan = POWER_PLANS.find((p) => p.id === planId);
  
  if (!plan) {
    return NextResponse.json(
      { error: "Invalid plan" }, 
      { status: 400 }
    );
  }
  
  // Use plan data
  const totalPower = plan.powerValue + plan.bonusValue;
  // ...
}
```

---

## 📊 Plan Structure

### Interface Plan

```typescript
interface PowerPlan {
  id: string;              // Unique identifier
  power: string;           // Display text (e.g., "600K")
  powerValue: number;      // Numeric value (e.g., 600000)
  finalReturn: string;     // Expected return (display)
  price: number;           // Price in TON
  bonus: string | null;    // Bonus text (e.g., "+11.8K POWER")
  bonusValue: number;      // Bonus numeric value
  bonusColor: string | null; // Badge color
}
```

---

## 🎯 Available Plans

### Plan 1: Starter (118K)
```typescript
{
  id: "plan-118k",
  power: "118K",
  powerValue: 118000,
  price: 1,           // 1 TON
  bonus: null,        // No bonus
  bonusValue: 0,
}
```

**Mining Rate:** 118,000 / 100,000 = **1.18 hashes/second**

---

### Plan 2: Basic (600K)
```typescript
{
  id: "plan-600k",
  power: "600K",
  powerValue: 600000,
  price: 5,           // 5 TON
  bonus: "+11.8K POWER",
  bonusValue: 11800,  // ~2% bonus
}
```

**Total Power:** 600,000 + 11,800 = **611,800**

**Mining Rate:** 611,800 / 100,000 = **6.12 hashes/second**

---

### Plan 3: Pro (1.2M)
```typescript
{
  id: "plan-1m2",
  power: "1.2M",
  powerValue: 1200000,
  price: 10,          // 10 TON
  bonus: "+58.8K POWER",
  bonusValue: 58800,  // ~4.9% bonus
}
```

**Total Power:** 1,200,000 + 58,800 = **1,258,800**

**Mining Rate:** 1,258,800 / 100,000 = **12.59 hashes/second**

---

### Plan 4: Advanced (3.7M)
```typescript
{
  id: "plan-3m7",
  power: "3.7M",
  powerValue: 3700000,
  price: 25,          // 25 TON
  bonus: "+735K POWER",
  bonusValue: 735000, // ~19.9% bonus
}
```

**Total Power:** 3,700,000 + 735,000 = **4,435,000**

**Mining Rate:** 4,435,000 / 100,000 = **44.35 hashes/second**

---

### Plan 5: Elite (17.6M)
```typescript
{
  id: "plan-17m6",
  power: "17.6M",
  powerValue: 17600000,
  price: 100,         // 100 TON
  bonus: "+5.9M POWER",
  bonusValue: 5900000, // ~33.5% bonus
}
```

**Total Power:** 17,600,000 + 5,900,000 = **23,500,000**

**Mining Rate:** 23,500,000 / 100,000 = **235 hashes/second**

---

## 📈 Bonus Percentage

| Plan | Base Power | Bonus | Total | Bonus % |
|------|-----------|-------|-------|---------|
| 118K | 118,000 | 0 | 118,000 | 0% |
| 600K | 600,000 | 11,800 | 611,800 | ~2% |
| 1.2M | 1,200,000 | 58,800 | 1,258,800 | ~4.9% |
| 3.7M | 3,700,000 | 735,000 | 4,435,000 | ~19.9% |
| 17.6M | 17,600,000 | 5,900,000 | 23,500,000 | ~33.5% |

**Note:** Semakin besar plan, semakin besar bonus persentasenya.

---

## 💰 Mining Returns per Plan

### Daily Mining (24 hours)

| Plan | Total Power | Hashes/Second | Daily Hashes | Days to 1 TON* |
|------|-------------|---------------|--------------|---------------|
| 118K | 118,000 | 1.18 | 101,952 | ~680 days |
| 600K | 611,800 | 6.12 | 528,768 | ~131 days |
| 1.2M | 1,258,800 | 12.59 | 1,087,776 | ~64 days |
| 3.7M | 4,435,000 | 44.35 | 3,831,840 | ~18 days |
| 17.6M | 23,500,000 | 235 | 20,304,000 | ~3.4 days |

*Based on exchange rate: 1 TON = 69,444 HASHES (0.0000144 TON per HASH)

---

## 🔧 Mengubah Plans

### Cara Edit Plans

**File:** `lib/tonPayment.ts`

```typescript
export const POWER_PLANS = [
  {
    id: "plan-custom",        // ← Unique ID
    power: "2M",              // ← Display text
    powerValue: 2000000,      // ← Numeric value
    finalReturn: "20 TON",    // ← Display (optional)
    price: 15,                // ← Price in TON
    bonus: "+100K POWER",     // ← Display text or null
    bonusValue: 100000,       // ← Numeric bonus
    bonusColor: "#00d4aa",    // ← Badge color or null
  },
  // ... existing plans
];
```

### Validasi Setelah Edit

1. **Restart dev server:** Plans di-cache saat import
2. **Check purchase:** Test buy plan baru
3. **Check mining:** Verify power calculation correct

---

## ⚙️ Configuration

### Payment Receiver Address

**File:** `lib/tonPayment.ts`

```typescript
export const PAYMENT_RECEIVER_ADDRESS = 
  "EQC23M4PIfrYhh8FTrwUryFV_Accw-ZrTHFXhtEHvBQWJ_oD";
```

**IMPORTANT:** 
- ⚠️ Ganti dengan wallet address Anda sendiri
- ⚠️ Semua payment akan masuk ke address ini
- ⚠️ Pastikan address valid TON address

---

## 🔄 Alternative: Dynamic Plans dari Database

### Jika Mau Plans dari Database (Future Enhancement):

#### 1. Create Plan Model
```prisma
model Plan {
  id          String   @id @default(cuid())
  name        String   // "600K"
  powerValue  Float    // 600000
  bonusValue  Float    // 11800
  price       Float    // 5 TON
  isActive    Boolean  @default(true)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
}
```

#### 2. Create API Endpoint
```typescript
// app/api/plans/route.ts
export async function GET() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" }
  });
  
  return NextResponse.json({ plans });
}
```

#### 3. Fetch di Shop Page
```typescript
// app/shop/page.tsx
const [plans, setPlans] = useState([]);

useEffect(() => {
  fetch("/api/plans")
    .then(res => res.json())
    .then(data => setPlans(data.plans));
}, []);
```

**Benefits:**
- ✅ Can add/edit/remove plans without code changes
- ✅ Admin panel untuk manage plans
- ✅ A/B testing plans
- ✅ Limited time offers

**Current:**
- ✅ Simple, no database overhead
- ✅ Fast (no API calls)
- ✅ Type-safe (TypeScript constants)

---

## 📝 Summary

### Data Source
**File:** `lib/tonPayment.ts`
**Variable:** `POWER_PLANS`
**Type:** Hardcoded constant array

### Usage
1. **Shop Page:** Display plans
2. **Purchase API:** Validate and get plan details
3. **Contract Creation:** Store power and bonus values

### Pros
✅ Simple dan cepat
✅ No database queries needed
✅ Type-safe dengan TypeScript
✅ Easy to version control

### Cons
❌ Perlu restart server untuk update plans
❌ Tidak bisa ubah tanpa deployment
❌ No admin panel

---

## 🎯 Key Points

1. **Plans hardcoded** di `lib/tonPayment.ts`
2. **5 plans available:** 118K, 600K, 1.2M, 3.7M, 17.6M
3. **Bonus increases** dengan plan size
4. **Validated** di purchase API
5. **Used for contract** creation

---

**Location:** `lib/tonPayment.ts` → `POWER_PLANS` ✅
