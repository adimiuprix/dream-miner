# 🚀 Dream Miner - Quick Start Guide

**For:** Developers and testers  
**Goal:** Get the app running in 5 minutes

---

## ⚡ Quick Start (Local Development)

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Set Up Database
```bash
# Create a PostgreSQL database
# Update .env with your database URL

# Run migrations
npx prisma db push

# Or run migration (recommended for production)
npx prisma migrate dev
```

### 3️⃣ Configure Environment
Create/update `.env`:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dreamminer"

# TON Network (use testnet for development)
TON_NETWORK="testnet"

# TON API (optional, for better rate limits)
TON_API_KEY="your_key_from_toncenter.com"

# Your wallet address (IMPORTANT!)
PAYMENT_RECEIVER_ADDRESS="your_ton_wallet_address"
```

### 4️⃣ Update Manifest
Edit `public/tonconnect-manifest.json`:
```json
{
  "url": "http://localhost:3000",
  "name": "Dream Miner",
  "iconUrl": "http://localhost:3000/icon.png"
}
```

### 5️⃣ Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing the App

### Test 1: Authentication
```
1. Open the app
2. Should auto-login via Telegram Web App
3. Check console for user data
```

### Test 2: Mining System
```
1. Open home page
2. Check HashCounter shows "0.00000000 HASHES"
3. Wait 30 seconds → Should auto-sync
4. Check console for "[Mining] Synced user..."
```

### Test 3: Buy Power (Testnet)
```
1. Get testnet TON from faucet:
   https://t.me/testgiver_ton_bot

2. Go to Shop page (/shop)

3. Connect TON wallet:
   - Click any "Buy" button
   - Select wallet (Tonkeeper recommended)
   - Approve connection

4. Purchase smallest plan (1 TON):
   - Click "Buy 118K POWER (1 TON)"
   - Confirm in wallet app
   - Wait for verification (20-60s)
   - Should see success message

5. Check database:
   SELECT * FROM "Transaction" WHERE "userId" = 'your_id';
   SELECT * FROM "Contract" WHERE "userId" = 'your_id';
   SELECT power FROM "User" WHERE id = 'your_id';
```

### Test 4: Mining with Power
```
1. After purchasing power, go to home page
2. StatsBar should show:
   - Rate: ~102K H/day
   - Power: 118K
   - Next expiry: 30d

3. Wait 10 seconds
4. Hash counter should increase:
   - Rate: 1.18 H/s
   - After 10s: +11.8 hashes
```

### Test 5: Offline Mining
```
1. Close the app
2. Wait 1 hour
3. Open the app again
4. Should see notification in console:
   "Earned X hashes while offline"
5. Hashes should jump up by ~4,248 H (1.18 H/s × 3600s)
```

### Test 6: Swap System
```
1. Mine until you have >= 100 HASHES
   (or manually add: UPDATE "User" SET hashes = 1000 WHERE id = '...')

2. Go to home page
3. Click "SWAP HASHES → TON"
4. Should show preview
5. Confirm swap
6. Check database:
   - user.hashes should be 0
   - user.tonBalance should increase
```

### Test 7: Contract Expiry
```
1. Create expired contract (SQL):
   UPDATE "Contract" 
   SET "expiresAt" = NOW() - INTERVAL '1 day'
   WHERE id = 'contract_id';

2. Trigger cron manually:
   curl -X POST http://localhost:3000/api/cron \
     -H "Content-Type: application/json" \
     -d '{"action":"forceExpiry"}'

3. Check database:
   SELECT status FROM "Contract" WHERE id = 'contract_id';
   -- Should be 'EXPIRED'

   SELECT power FROM "User" WHERE id = 'user_id';
   -- Should be reduced
```

---

## 🗄️ Database Management

### View All Users
```sql
SELECT 
  id,
  "firstName",
  power,
  hashes,
  "tonBalance",
  "createdAt"
FROM "User"
ORDER BY "createdAt" DESC;
```

### View Active Contracts
```sql
SELECT 
  c.id,
  u."firstName",
  c."planId",
  c.power,
  c.price,
  c.status,
  c."expiresAt"
FROM "Contract" c
JOIN "User" u ON c."userId" = u.id
WHERE c.status = 'ACTIVE'
ORDER BY c."expiresAt" ASC;
```

### View Recent Transactions
```sql
SELECT 
  t.id,
  u."firstName",
  t.type,
  t.amount,
  t.status,
  t."createdAt"
FROM "Transaction" t
JOIN "User" u ON t."userId" = u.id
ORDER BY t."createdAt" DESC
LIMIT 20;
```

### Check Mining Stats
```sql
SELECT 
  u."firstName",
  u.power,
  u.hashes,
  u."tonBalance",
  (u.power / 100000.0) as "miningRatePerSecond",
  (u.power / 100000.0 * 86400) as "miningRatePerDay"
FROM "User" u
WHERE u.power > 0
ORDER BY u.power DESC;
```

### Manual Data Manipulation (Testing Only!)
```sql
-- Give user power for testing
UPDATE "User" 
SET power = 600000 
WHERE id = 'user_id';

-- Give user hashes for testing swap
UPDATE "User" 
SET hashes = 10000 
WHERE id = 'user_id';

-- Create test contract
INSERT INTO "Contract" (
  id, "userId", "planId", power, price, bonus,
  status, "expiresAt", "createdAt", "updatedAt"
) VALUES (
  'test_' || gen_random_uuid(),
  'user_id',
  'plan-600k',
  600000,
  5,
  11800,
  'ACTIVE',
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW()
);
```

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to database"
**Solution:**
```bash
# Check if PostgreSQL is running
# Windows:
sc query postgresql

# Check DATABASE_URL in .env
# Format: postgresql://user:password@localhost:5432/dbname

# Test connection
npx prisma db pull
```

### Issue: "Prisma Client not found"
**Solution:**
```bash
# Generate Prisma Client
npx prisma generate

# Rebuild
npm run build
```

### Issue: "TON wallet won't connect"
**Solution:**
1. Check manifest file is accessible: http://localhost:3000/tonconnect-manifest.json
2. Make sure URL matches in manifest
3. Try different wallet (Tonkeeper, MyTonWallet)
4. Check browser console for errors

### Issue: "Payment not verifying"
**Solution:**
```bash
# Check transaction on blockchain
# Testnet: https://testnet.tonscan.org/
# Mainnet: https://tonscan.org/

# Check receiver address matches
# In lib/tonPayment.ts
export const PAYMENT_RECEIVER_ADDRESS = "your_wallet_address";

# Manual verification
curl -X POST http://localhost:3000/api/verify-payment \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"tx_123"}'

# Check database
SELECT * FROM "Transaction" WHERE status = 'PENDING';
```

### Issue: "Mining rate is 0"
**Solution:**
```sql
-- Check if user has active contracts
SELECT * FROM "Contract" 
WHERE "userId" = 'user_id' 
  AND status = 'ACTIVE'
  AND "expiresAt" > NOW();

-- If no contracts, buy one or create test contract
-- See "Manual Data Manipulation" above
```

### Issue: "Hashes not increasing"
**Solution:**
1. Check browser console for errors
2. Check mining rate in StatsBar (should be > 0)
3. Open Network tab, check if /api/mining/sync is being called
4. Check database: `SELECT hashes FROM "User" WHERE id = 'user_id'`
5. Manually trigger sync: Click refresh or wait for 30s auto-sync

---

## 🌐 API Testing (with curl)

### Check Mining Status
```bash
curl "http://localhost:3000/api/mining/sync?userId=USER_ID"
```

### Sync Mining Progress
```bash
curl -X POST http://localhost:3000/api/mining/sync \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID"}'
```

### Get Swap Preview
```bash
curl "http://localhost:3000/api/swap?userId=USER_ID"
```

### Perform Swap
```bash
curl -X POST http://localhost:3000/api/swap \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID"}'
```

### Get User Contracts
```bash
curl "http://localhost:3000/api/contracts?userId=USER_ID"
```

### Check Cron Status
```bash
curl -X POST http://localhost:3000/api/cron \
  -H "Content-Type: application/json" \
  -d '{"action":"status"}'
```

### Force Run Expiry
```bash
curl -X POST http://localhost:3000/api/cron \
  -H "Content-Type: application/json" \
  -d '{"action":"forceExpiry"}'
```

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

#### 1. Environment Configuration
```env
# .env (production)
DATABASE_URL="postgresql://..."
TON_NETWORK="mainnet"
TON_API_KEY="your_mainnet_key"
PAYMENT_RECEIVER_ADDRESS="your_mainnet_wallet"
```

#### 2. Update Manifest
```json
// public/tonconnect-manifest.json
{
  "url": "https://yourdomain.com",
  "name": "Dream Miner",
  "iconUrl": "https://yourdomain.com/icon.png"
}
```

#### 3. Update TON Payment Config
```typescript
// lib/tonPayment.ts
export const PAYMENT_RECEIVER_ADDRESS = "YOUR_MAINNET_WALLET";
```

#### 4. Database Migration
```bash
# Run on production database
npx prisma migrate deploy
```

#### 5. Test Payment (Small Amount)
```
1. Deploy to production
2. Buy smallest plan (1 TON)
3. Verify transaction on tonscan.org
4. Check database for COMPLETED status
5. Verify power was added
```

### Deploy to Vercel

#### 1. Install Vercel CLI
```bash
npm i -g vercel
```

#### 2. Login
```bash
vercel login
```

#### 3. Configure Project
```bash
vercel
# Follow prompts
# Link to existing project or create new
```

#### 4. Set Environment Variables
```bash
# In Vercel Dashboard:
# Settings → Environment Variables

# Add:
DATABASE_URL
TON_NETWORK=mainnet
TON_API_KEY
PAYMENT_RECEIVER_ADDRESS
```

#### 5. Deploy
```bash
# Production deployment
vercel --prod
```

#### 6. Configure Domain
```bash
# In Vercel Dashboard:
# Settings → Domains
# Add your custom domain
```

#### 7. Update Telegram Bot
```
1. Go to @BotFather
2. /mybots → Your Bot → Bot Settings → Menu Button
3. Set URL to: https://yourdomain.com
```

---

## 📊 Monitoring (Production)

### Set Up Sentry (Error Tracking)
```bash
# Install
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard@latest -i nextjs

# Configure in sentry.config.ts
```

### Set Up Analytics
```bash
# Option 1: PostHog (open source)
npm install posthog-js

# Option 2: Mixpanel
npm install mixpanel-browser

# Option 3: Google Analytics 4
npm install @next/third-parties
```

### Database Monitoring
```sql
-- Create monitoring view
CREATE VIEW monitoring_stats AS
SELECT 
  (SELECT COUNT(*) FROM "User") as total_users,
  (SELECT COUNT(*) FROM "User" WHERE "lastPingAt" > NOW() - INTERVAL '1 day') as dau,
  (SELECT COUNT(*) FROM "Contract" WHERE status = 'ACTIVE') as active_contracts,
  (SELECT SUM(amount) FROM "Transaction" WHERE status = 'COMPLETED' AND type = 'PURCHASE_POWER') as total_revenue,
  (SELECT COUNT(*) FROM "Transaction" WHERE status = 'PENDING') as pending_transactions,
  (SELECT COUNT(*) FROM "Transaction" WHERE status = 'FAILED') as failed_transactions;

-- Query it
SELECT * FROM monitoring_stats;
```

### Health Check Endpoint
Create `app/api/health/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected"
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: "unhealthy", 
        error: "Database connection failed" 
      },
      { status: 503 }
    );
  }
}
```

Test it:
```bash
curl https://yourdomain.com/api/health
```

---

## 🎯 Post-Launch Tasks

### Week 1: Monitor & Fix
- [ ] Check error rates in Sentry
- [ ] Monitor verification success rate
- [ ] Track failed transactions
- [ ] Fix critical bugs
- [ ] Optimize slow queries

### Week 2: Improve UX
- [ ] Add offline mining notification
- [ ] Replace alerts with custom modals
- [ ] Add loading states
- [ ] Improve error messages
- [ ] Add success animations

### Week 3: Growth Features
- [ ] Implement referral system
- [ ] Add transaction history
- [ ] Create daily login bonus
- [ ] Add contract expiry warnings
- [ ] Build leaderboard ranking

### Month 2: Scale & Optimize
- [ ] Add rate limiting
- [ ] Optimize database queries
- [ ] Implement caching
- [ ] Add webhooks for faster verification
- [ ] Build admin dashboard

---

## 📚 Useful Resources

### TON Blockchain
- **Docs:** https://docs.ton.org/
- **Testnet Explorer:** https://testnet.tonscan.org/
- **Mainnet Explorer:** https://tonscan.org/
- **Testnet Faucet:** https://t.me/testgiver_ton_bot
- **TON Connect:** https://github.com/ton-connect

### Development
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Telegram Mini Apps:** https://core.telegram.org/bots/webapps

### Tools
- **Tonkeeper Wallet:** https://tonkeeper.com/
- **MyTonWallet:** https://mytonwallet.io/
- **TON Center API:** https://toncenter.com/

---

## ❓ FAQ

### Q: How do I get testnet TON?
**A:** Message @testgiver_ton_bot on Telegram. Send your wallet address.

### Q: Can I use this on mainnet right now?
**A:** Yes! Just update .env to `TON_NETWORK=mainnet` and use mainnet wallet address.

### Q: How much does it cost to run?
**A:** 
- Database: Free tier on Vercel (PostgreSQL) or $5-20/mo
- Hosting: Free tier on Vercel or $20/mo for Pro
- Domain: $10-15/year
- Total: ~$0-35/month

### Q: Is the blockchain verification secure?
**A:** Yes! Every payment is verified on the TON blockchain. Users cannot fake payments.

### Q: What happens if verification times out?
**A:** Transaction stays PENDING. User should contact support with transaction hash. You can manually verify.

### Q: Can users mine while offline?
**A:** Yes! Up to 24 hours of offline mining is calculated when they return.

### Q: How do I add new power plans?
**A:** Edit `lib/tonPayment.ts` → `POWER_PLANS` array. Add new plan object.

### Q: How do I change the mining rate?
**A:** Edit `lib/miningService.ts` → `POWER_TO_HASH_RATE` constant.

### Q: Can I change the swap exchange rate?
**A:** Yes! Edit `app/api/swap/route.ts` → `EXCHANGE_RATE` constant.

---

## 🎊 You're All Set!

Your Dream Miner app is ready to:
- ✅ Accept real TON payments
- ✅ Verify on blockchain
- ✅ Handle mining automatically
- ✅ Manage contracts
- ✅ Process swaps
- ✅ Scale to thousands of users

**Next Steps:**
1. Test thoroughly on testnet
2. Deploy to production
3. Submit to Telegram
4. Launch! 🚀

---

**Need Help?**
- Check `MINING_SYSTEM_COMPLETE.md`
- Check `BLOCKCHAIN_VERIFICATION.md`
- Check `LAZY_CRON_SYSTEM.md`
- Check `ENHANCEMENT_SUGGESTIONS.md`

**Good luck with your launch! 🎉**
