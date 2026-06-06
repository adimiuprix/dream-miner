# Swap Exchange Rate Update

## ✅ Perubahan

Exchange rate telah diupdate agar sesuai dengan mockup design.

### Before (Old Rate)
```javascript
const EXCHANGE_RATE = 0.0001;  // 1 HASH = 0.0001 TON
const MINIMUM_SWAP_HASHES = 100;

// Rate: 10,000 HASHES = 1 TON
```

### After (New Rate) ✨
```javascript
const EXCHANGE_RATE = 0.0000144;  // 1 HASH = 0.0000144 TON
const MINIMUM_SWAP_HASHES = 1000;

// Rate: 1,000 HASHES = 0.0144 TON
//       ~69,444 HASHES = 1 TON
```

## 📊 Perhitungan

### Formula
```
estimatedTon = currentHashes × EXCHANGE_RATE
```

### Contoh Perhitungan (sesuai mockup)

**Input:**
- User balance: 421.45833334 HASHES
- Exchange rate: 0.0000144 TON per HASH

**Output:**
```
estimatedTon = 421.45833334 × 0.0000144
            = 0.00606900 TON ✅
```

### Rate Reference Table

| HASHES | TON (Received) |
|--------|----------------|
| 100 | 0.00144000 |
| 500 | 0.00720000 |
| 1,000 | 0.01440000 |
| 5,000 | 0.07200000 |
| 10,000 | 0.14400000 |
| 50,000 | 0.72000000 |
| 69,444 | 1.00000000 |
| 100,000 | 1.44000000 |

## 🔧 Modified Files

1. **`app/api/swap/route.ts`**
   - Updated `EXCHANGE_RATE` from `0.0001` to `0.0000144`
   - Updated `MINIMUM_SWAP_HASHES` from `100` to `1000`

## ✨ Impact

### UI Display (SwapModal)
Sekarang akan menampilkan:
```
Your balance:    421.45833334 HASHES
Rate:            1,000 HASHES = 0.01440000 TON
Minimum swap:    1,000 HASHES

You'll receive:  ≈ 0.00606900 TON
```

### API Response Example
```json
{
  "success": true,
  "preview": {
    "currentHashes": 421.45833334,
    "estimatedTon": 0.00606900,
    "exchangeRate": 0.0000144,
    "minimumRequired": 1000,
    "canSwap": false,  // karena < 1000
    "currentTonBalance": 0.5
  }
}
```

## ⚠️ Important Notes

### Minimum Balance Check
User sekarang **HARUS memiliki minimal 1,000 HASHES** untuk swap (naik dari 100).

**Artinya:**
- User dengan < 1,000 HASHES tidak bisa swap
- Button "Continue" akan disabled dengan pesan:
  ```
  Insufficient Balance (Min: 1,000)
  ```

### Kenapa 1,000 HASHES minimum?
Karena di mockup terlihat "Minimum swap: 1,000 HASHES", maka saya update sesuai mockup.

## 🧪 Testing

### Test Case 1: Sufficient Balance
```
User has: 5,000 HASHES
Can swap: YES ✅
Will receive: 5,000 × 0.0000144 = 0.072 TON
```

### Test Case 2: Insufficient Balance
```
User has: 421.45833334 HASHES
Can swap: NO ❌ (less than 1,000)
Message: "Insufficient Balance (Min: 1,000)"
```

### Test Case 3: Exact Minimum
```
User has: 1,000 HASHES
Can swap: YES ✅
Will receive: 1,000 × 0.0000144 = 0.0144 TON
```

### Test Case 4: Large Balance
```
User has: 100,000 HASHES
Can swap: YES ✅
Will receive: 100,000 × 0.0000144 = 1.44 TON
```

## 📝 Verification Checklist

- [x] Exchange rate updated to 0.0000144
- [x] Minimum swap updated to 1,000 HASHES
- [x] Calculation: 421.45833334 HASHES = 0.00606900 TON ✅
- [x] Calculation: 1,000 HASHES = 0.0144 TON ✅
- [x] API route.ts updated
- [x] Comments updated with new rate
- [x] Mockup design match verified

## 🎯 Result

Exchange rate sekarang **SESUAI DENGAN MOCKUP**:
- 421.45833334 HASHES → 0.00606900 TON ✅
- 1,000 HASHES → 0.01440000 TON ✅
- Minimum swap: 1,000 HASHES ✅

---

**Update completed successfully! 🎉**
