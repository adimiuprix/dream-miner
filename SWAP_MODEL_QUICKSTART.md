# Swap Model - Quick Start 🚀

Model `Swap` baru telah dibuat untuk menyimpan data swap HASHES ke TON secara terpisah dari Transaction.

## ⚡ Quick Migration

### Windows:
```cmd
cd d:\dream-miner
scripts\migrate-swap-model.bat
```

### Linux/Mac:
```bash
cd /path/to/dream-miner
chmod +x scripts/migrate-swap-model.sh
./scripts/migrate-swap-model.sh
```

### Manual:
```bash
# 1. Create migration
npx prisma migrate dev --name add_swap_model

# 2. Generate client
npx prisma generate
```

## 📋 What Changed?

### Before: Transaction Table
```typescript
// Swap data tercampur dengan transaction lain
{
  type: "SWAP_HASH_TO_TON",
  amount: 0.00606900,
  metadata: "{...}" // Data dalam JSON string
}
```

### After: Dedicated Swap Table
```typescript
// Swap punya table sendiri dengan struktur jelas
{
  hashesSwapped: 421.45833334,
  tonReceived: 0.00606900,
  exchangeRate: 0.0000144,
  hashesBalanceBefore: 421.45833334,
  hashesBalanceAfter: 0,
  tonBalanceBefore: 0.5,
  tonBalanceAfter: 0.50606900,
  status: "COMPLETED"
}
```

## ✅ Benefits

1. **Clean Data Structure** - Semua field terstruktur, bukan JSON string
2. **Better Performance** - Indexed dan queryable
3. **Audit Trail** - Snapshot balance before/after
4. **Separation** - Swap terpisah dari transaction lain
5. **Easy Analytics** - Agregasi dan reporting lebih mudah

## 🧪 Testing

### Test API
```bash
# GET preview (check if API works)
curl http://localhost:3000/api/swap?userId=YOUR_USER_ID

# POST swap (actual swap)
curl -X POST http://localhost:3000/api/swap \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID"}'
```

### Check Database
```bash
# Open Prisma Studio
npx prisma studio

# Navigate to "Swap" model to see records
```

### Query Swaps
```typescript
// Get user's swaps
const swaps = await prisma.swap.findMany({
  where: { userId: "user123" },
  orderBy: { createdAt: "desc" }
});

// Get total swapped
const total = await prisma.swap.aggregate({
  _sum: {
    hashesSwapped: true,
    tonReceived: true
  }
});
```

## 📊 New Swap Model Fields

| Field | Type | Description |
|-------|------|-------------|
| `hashesSwapped` | Float | HASHES yang di-swap |
| `tonReceived` | Float | TON yang diterima |
| `exchangeRate` | Float | Rate saat swap (0.0000144) |
| `hashesBalanceBefore` | Float | HASHES sebelum swap |
| `hashesBalanceAfter` | Float | HASHES setelah swap (0) |
| `tonBalanceBefore` | Float | TON sebelum swap |
| `tonBalanceAfter` | Float | TON setelah swap |
| `status` | SwapStatus | COMPLETED/FAILED/CANCELLED |

## 🔍 Verify Migration

### 1. Check Prisma Client Generated
```bash
ls lib/generated/prisma/
# Should see: browser.ts, client.ts, models/Swap.ts, etc.
```

### 2. Check Database Schema
```sql
-- Open PostgreSQL
psql -d your_database

-- Check Swap table exists
\d "Swap"

-- Check SwapStatus enum exists
\dT "SwapStatus"
```

### 3. Test Import
```typescript
import { prisma } from "@/lib/prisma";

// Should work without errors
const count = await prisma.swap.count();
console.log("Swap count:", count);
```

## ❗ Troubleshooting

### Error: "Property 'swap' does not exist"
```bash
# Solution: Generate Prisma client
npx prisma generate
```

### Error: "Table 'Swap' does not exist"
```bash
# Solution: Run migration
npx prisma migrate dev --name add_swap_model
```

### Error: Migration conflicts
```bash
# Solution: Reset database (CAUTION: loses data)
npx prisma migrate reset
npx prisma migrate dev --name add_swap_model
```

## 📝 Files Modified

- ✅ `prisma/schema.prisma` - Added Swap model
- ✅ `app/api/swap/route.ts` - Use Swap table
- ✅ `scripts/migrate-swap-model.sh` - Migration script (Unix)
- ✅ `scripts/migrate-swap-model.bat` - Migration script (Windows)
- ✅ `SWAP_MODEL_MIGRATION.md` - Full documentation
- ✅ `SWAP_MODEL_QUICKSTART.md` - This file

## 🎯 Next Steps

1. ✅ Run migration script
2. ✅ Test swap API endpoint
3. ✅ Verify data in Prisma Studio
4. ✅ Test SwapModal in UI
5. ✅ Check swap records are created

---

**Ready! Run the migration script to get started.** 🚀
