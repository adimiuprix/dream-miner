# ⚡ Lazy Cron - Quick Start Guide

## 🎯 What It Does

Automatically expires contracts and cleans up old data when users visit your app.

---

## ✅ Already Implemented

Everything is ready! No additional setup needed.

---

## 🧪 Quick Test

### **Test 1: Check if Cron is Running**

```bash
# Start your app
npm run dev

# Open any page
http://localhost:3000

# Check console logs - you should see:
[LazyCron] Running contract expiry check...
[LazyCron] No contracts to expire
[LazyCron] Running cleanup...
[LazyCron] All jobs completed
```

### **Test 2: Test Contract Expiry**

```sql
-- 1. Create a test expired contract
INSERT INTO "Contract" (
  id, "userId", "planId", power, price, bonus,
  status, "expiresAt", "createdAt", "updatedAt"
) VALUES (
  'test_expired_contract',
  'your_user_id',
  'plan-600k',
  600000,
  5,
  11800,
  'ACTIVE',
  '2026-01-01T00:00:00Z',  -- Already expired!
  NOW(),
  NOW()
);

-- 2. Check user power before
SELECT id, "firstName", power FROM "User" WHERE id = 'your_user_id';

-- 3. Force run expiry
curl -X POST http://localhost:3000/api/cron \
  -H "Content-Type: application/json" \
  -d '{"action": "runJob", "job": "expireContracts"}'

-- 4. Check contract status (should be EXPIRED)
SELECT status FROM "Contract" WHERE id = 'test_expired_contract';

-- 5. Check user power (should be reduced by 611,800)
SELECT id, "firstName", power FROM "User" WHERE id = 'your_user_id';
```

---

## 📊 Check Cron Status

```bash
# Get status
curl http://localhost:3000/api/cron

# Response shows last run times:
{
  "contractExpiry": {
    "lastRun": "2026-06-05T09:30:00Z",
    "nextRun": "2026-06-05T10:30:00Z"
  },
  "cleanup": {
    "lastRun": "2026-06-05T08:00:00Z",
    "nextRun": "2026-06-05T14:00:00Z"
  }
}
```

---

## ⚙️ Configuration

### **Change Intervals**

Edit `lib/lazyCron.ts`:

```typescript
const CRON_CONFIG = {
  CONTRACT_EXPIRY: {
    interval: 60 * 60 * 1000,  // ← Change this (1 hour)
  },
  CLEANUP: {
    interval: 6 * 60 * 60 * 1000,  // ← Change this (6 hours)
  },
};
```

**Common values:**
```typescript
30 * 60 * 1000        // 30 minutes
60 * 60 * 1000        // 1 hour
2 * 60 * 60 * 1000    // 2 hours
6 * 60 * 60 * 1000    // 6 hours
24 * 60 * 60 * 1000   // 24 hours (daily)
```

---

## 🚀 Production Setup

### **Low Traffic Apps**

Add Vercel Cron to ping your app:

```json
// vercel.json
{
  "crons": [
    {
      "path": "/",
      "schedule": "0 * * * *"  // Every hour
    }
  ]
}
```

### **High Traffic Apps**

No action needed! Users visiting will trigger cron automatically.

---

## 🔧 Manual Trigger

### **Force Run All Jobs**

```bash
curl -X POST http://localhost:3000/api/cron \
  -H "Content-Type: application/json" \
  -d '{"action": "forceAll"}'
```

### **Run Specific Job**

```bash
# Expire contracts
curl -X POST http://localhost:3000/api/cron \
  -d '{"action": "runJob", "job": "expireContracts"}'

# Cleanup old data
curl -X POST http://localhost:3000/api/cron \
  -d '{"action": "runJob", "job": "cleanup"}'
```

---

## 📝 What Gets Cleaned Up

### **Contract Expiry Job (Every 1 hour)**
- Finds contracts where `status='ACTIVE'` AND `expiresAt < NOW`
- Updates contract status → `EXPIRED`
- Removes power from user (base + bonus)

### **Cleanup Job (Every 6 hours)**
- Deletes `PENDING` transactions older than 30 days
- Keeps system clean and performant

---

## 🐛 Troubleshooting

### "Jobs not running"

**Check logs:**
```bash
npm run dev
# Watch for [LazyCron] messages
```

**Force run:**
```bash
curl -X POST http://localhost:3000/api/cron -d '{"action":"forceAll"}'
```

### "Contract still ACTIVE after expiry"

**Manually expire:**
```bash
curl -X POST http://localhost:3000/api/cron \
  -d '{"action":"runJob","job":"expireContracts"}'
```

**Check database:**
```sql
SELECT * FROM "Contract" 
WHERE status = 'ACTIVE' 
  AND "expiresAt" < NOW();
```

---

## ✅ Success Indicators

You know it's working when:

1. ✅ Console shows `[LazyCron]` messages
2. ✅ Expired contracts change to `EXPIRED` status
3. ✅ User power decreases when contract expires
4. ✅ Old PENDING transactions get deleted
5. ✅ API `/api/cron` returns status

---

## 📚 Full Documentation

See `LAZY_CRON_SYSTEM.md` for complete technical details.

---

**Status:** ✅ **Ready to Use**
