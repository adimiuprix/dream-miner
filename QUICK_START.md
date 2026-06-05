# 🚀 Quick Start - TON Payment Integration

## ⚡ 3-Step Setup

### Step 1: Update Wallet Address (1 minute)

```typescript
// File: lib/tonPayment.ts (line 74)
export const PAYMENT_RECEIVER_ADDRESS = "YOUR_TON_WALLET_ADDRESS";
```

Get wallet from: [Tonkeeper](https://tonkeeper.com/) | [Tonhub](https://tonhub.com/) | [MyTonWallet](https://mytonwallet.io/)

---

### Step 2: Run Database Migration (1 minute)

```bash
npx prisma db push
```

---

### Step 3: Test Locally (2 minutes)

```bash
npm run dev
```

1. Open http://localhost:3000
2. Go to **More** > Click **Wallet**
3. Click **Connect Wallet**
4. Go to **Shop** > Click any plan
5. Confirm in wallet

---

## 🎯 Production Checklist

### Before Deploy

```bash
# 1. Update manifest
# Edit: public/tonconnect-manifest.json
{
  "url": "https://your-domain.com",
  "iconUrl": "https://your-domain.com/icon-180x180.png"
}

# 2. Build
npm run build

# 3. Deploy
# Upload tonconnect-manifest.json to root (HTTPS required!)
```

---

## 📱 User Flow

```
User → Shop → Connect Wallet → Choose Plan → Confirm → Done! ✅
```

**Time**: ~30 seconds per purchase

---

## 🔍 Verify It Works

### Check Wallet Connection
```
More Page → Wallet section → See "Connect Wallet" button
```

### Check Purchase
```
Shop Page → Click plan → Wallet opens → Confirm → Success message
```

### Check Database
```sql
SELECT * FROM "Contract" ORDER BY "createdAt" DESC LIMIT 5;
```

---

## 💰 Payment Plans

| Plan | Power | Price | Bonus |
|------|-------|-------|-------|
| Starter | 118K | 1 TON | - |
| Bronze | 600K | 5 TON | +11.8K |
| Silver | 1.2M | 10 TON | +58.8K |
| Gold | 3.7M | 25 TON | +735K |
| Platinum | 17.6M | 100 TON | +5.9M |

---

## 🆘 Troubleshooting

### "Cannot connect wallet"
→ Check: manifest file accessible via HTTPS

### "Transaction fails"
→ Check: receiver address is valid TON address

### "Power not added"
→ Check: database migration completed

---

## 📂 Key Files

```
lib/tonPayment.ts         ← Update wallet address here
app/shop/page.tsx         ← Payment integration
app/api/purchase/route.ts ← Purchase logic
prisma/schema.prisma      ← Database models
```

---

## 🎓 Learn More

- Full Guide: `TON_PAYMENT_INTEGRATION.md`
- Setup Summary: `SETUP_SUMMARY.md`
- TON Docs: https://docs.ton.org/

---

**Ready?** Update wallet address → Run migration → Test! 🚀
