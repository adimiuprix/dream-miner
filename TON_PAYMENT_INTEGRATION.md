# TON Payment Integration Guide

## 📦 What's Been Added

This integration adds full TON Connect payment functionality to Dream Miner, allowing users to purchase POWER using TON cryptocurrency.

### New Dependencies
```json
{
  "@tonconnect/ui-react": "^latest",
  "@ton/ton": "^latest",
  "@ton/core": "^latest"
}
```

### New Files Created

1. **`components/TonConnectProvider.tsx`** - TON Connect wrapper for the app
2. **`lib/tonPayment.ts`** - Payment utility functions and plan configurations
3. **`app/api/purchase/route.ts`** - API endpoints for purchase processing
4. **`public/tonconnect-manifest.json`** - TON Connect manifest file

### Modified Files

1. **`app/layout.tsx`** - Added TonConnectProvider
2. **`app/shop/page.tsx`** - Full payment integration with wallet connection
3. **`app/more/page.tsx`** - Added TON Connect button
4. **`components/shop/PlanCard.tsx`** - Added purchase functionality
5. **`prisma/schema.prisma`** - Added Contract and Transaction models

---

## 🚀 Setup Instructions

### 1. Update TON Wallet Address

**IMPORTANT:** You must replace the placeholder wallet address with your actual TON wallet address.

Open `lib/tonPayment.ts` and update:

```typescript
export const PAYMENT_RECEIVER_ADDRESS = "YOUR_TON_WALLET_ADDRESS_HERE";
```

Get your TON wallet address from:
- [Tonkeeper](https://tonkeeper.com/)
- [Tonhub](https://tonhub.com/)
- [MyTonWallet](https://mytonwallet.io/)

### 2. Update TON Connect Manifest

Edit `public/tonconnect-manifest.json`:

```json
{
  "url": "https://your-actual-domain.com",
  "name": "Dream Miner",
  "iconUrl": "https://your-domain.com/icon-180x180.png",
  "termsOfUseUrl": "https://your-domain.com/terms",
  "privacyPolicyUrl": "https://your-domain.com/privacy"
}
```

**Requirements:**
- Must be served over HTTPS
- Icon must be 180x180 PNG
- URLs must be publicly accessible

### 3. Database Migration

Run Prisma migration to create new tables:

```bash
npx prisma migrate dev --name add-contracts-and-transactions
```

Or push schema changes:

```bash
npx prisma db push
```

### 4. Deploy Manifest File

The `tonconnect-manifest.json` file **must** be accessible at:
```
https://your-domain.com/tonconnect-manifest.json
```

Wallets will fetch this file to display your app information.

---

## 💡 How It Works

### User Flow

1. **User visits Shop page**
   - Sees all available POWER plans
   - Gets prompted to connect wallet if not connected

2. **Connect TON Wallet**
   - Click any plan or go to More > Wallet
   - Click "Connect Wallet" button
   - Choose wallet app (Tonkeeper, Tonhub, etc.)
   - Approve connection in wallet

3. **Purchase POWER**
   - Click on desired plan
   - Confirm transaction in wallet
   - Payment sent to your receiver address
   - System creates contract and adds power to user

4. **Receive POWER**
   - Power immediately added to user account
   - Contract created with 30-day expiry
   - Bonus power automatically applied
   - User can start mining with increased rate

### Technical Flow

```
┌─────────────┐
│   User      │
│   Clicks    │
│   Plan      │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Check Wallet       │
│  Connection         │
└──────┬──────────────┘
       │
       ├─── Not Connected ──► Open TON Connect Modal
       │
       └─── Connected
              │
              ▼
       ┌──────────────────┐
       │  Create TX       │
       │  with @ton/core  │
       └──────┬───────────┘
              │
              ▼
       ┌──────────────────┐
       │  Send via        │
       │  TON Connect     │
       └──────┬───────────┘
              │
              ▼
       ┌──────────────────┐
       │  User Confirms   │
       │  in Wallet       │
       └──────┬───────────┘
              │
              ▼
       ┌──────────────────┐
       │  POST to         │
       │  /api/purchase   │
       └──────┬───────────┘
              │
              ▼
       ┌──────────────────┐
       │  Save to DB:     │
       │  - Transaction   │
       │  - Contract      │
       │  - Update Power  │
       └──────┬───────────┘
              │
              ▼
       ┌──────────────────┐
       │  Success!        │
       │  Reload Page     │
       └──────────────────┘
```

---

## 🔧 API Endpoints

### POST `/api/purchase`

Create a new purchase transaction.

**Request Body:**
```json
{
  "userId": "user_id",
  "planId": "plan-118k",
  "txHash": "transaction_hash",
  "fromAddress": "sender_wallet",
  "toAddress": "receiver_wallet"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": { ... },
  "contract": { ... },
  "message": "Purchase completed successfully"
}
```

### PUT `/api/purchase`

Update transaction status (for delayed confirmation).

**Request Body:**
```json
{
  "transactionId": "tx_id",
  "txHash": "blockchain_hash",
  "status": "COMPLETED"
}
```

---

## 📊 Database Schema

### Contract Model

```prisma
model Contract {
  id        String   @id @default(cuid())
  userId    String
  planId    String
  power     Float
  price     Float
  bonus     Float
  status    ContractStatus
  expiresAt DateTime
  createdAt DateTime
  updatedAt DateTime
}
```

### Transaction Model

```prisma
model Transaction {
  id          String   @id @default(cuid())
  userId      String
  type        TransactionType
  amount      Float
  status      TransactionStatus
  txHash      String?
  fromAddress String?
  toAddress   String?
  metadata    String?
  createdAt   DateTime
  updatedAt   DateTime
}
```

---

## 🎨 UI Components

### Shop Page Features

- **Wallet Connection Status**: Shows if wallet is connected
- **Plan Cards**: Interactive cards with loading states
- **Purchase Flow**: One-click purchase with confirmation
- **Error Handling**: User-friendly error messages

### More Page Features

- **TON Connect Button**: Native wallet connection UI
- **Wallet Panel**: Expandable section for wallet management

---

## 🧪 Testing

### Development Testing

1. **Local Testing (without Telegram)**:
   - Run `npm run dev`
   - Open http://localhost:3000
   - App will use dev mode authentication

2. **Test Wallet Connection**:
   - Go to More > Wallet
   - Click "Connect Wallet"
   - Use Tonkeeper/Tonhub in test mode

3. **Test Purchase Flow**:
   - Connect wallet
   - Go to Shop
   - Click any plan
   - Confirm in wallet (use testnet TON)

### Production Testing

1. **Use TON Testnet**:
   - Configure wallets for testnet
   - Get test TON from faucets
   - Test full purchase flow

2. **Verify Database**:
   ```sql
   SELECT * FROM "Contract" WHERE "userId" = 'user_id';
   SELECT * FROM "Transaction" WHERE "userId" = 'user_id';
   ```

---

## 🔐 Security Notes

### Important Considerations

1. **Never store private keys** - TON Connect handles this
2. **Verify transactions** - Check blockchain before crediting power
3. **Validate amounts** - Always validate on backend
4. **Rate limiting** - Implement on API endpoints
5. **Audit logs** - Keep transaction records

### Recommended Additions

```typescript
// Add transaction verification
async function verifyTransaction(txHash: string) {
  // Check on TON blockchain
  // Verify amount matches plan price
  // Verify receiver address is correct
}

// Add webhook for blockchain confirmations
// app/api/webhook/ton/route.ts
```

---

## 📝 Environment Variables

Add to `.env`:

```bash
# TON Payment
TON_RECEIVER_ADDRESS=UQD...your-wallet-address
TON_NETWORK=mainnet  # or testnet

# Optional: TON API
TON_API_KEY=your-api-key-from-toncenter
```

---

## 🚦 Going Live Checklist

- [ ] Update `PAYMENT_RECEIVER_ADDRESS` with real wallet
- [ ] Update `tonconnect-manifest.json` with production URLs
- [ ] Deploy manifest file to HTTPS endpoint
- [ ] Run database migrations
- [ ] Test with TON testnet
- [ ] Implement transaction verification
- [ ] Add webhook for confirmations
- [ ] Set up monitoring and alerts
- [ ] Test error scenarios
- [ ] Verify power calculation is correct
- [ ] Test contract expiry logic

---

## 🆘 Troubleshooting

### Wallet Won't Connect

**Problem**: TON Connect modal doesn't open

**Solutions**:
- Check manifest URL is accessible
- Verify HTTPS is enabled
- Check browser console for errors
- Ensure `TonConnectProvider` is in layout

### Transaction Fails

**Problem**: sendTransaction throws error

**Solutions**:
- Check user has enough TON balance
- Verify receiver address format
- Check network (mainnet vs testnet)
- Look at wallet app error message

### Purchase Not Recording

**Problem**: Transaction succeeds but power not added

**Solutions**:
- Check API endpoint logs
- Verify database connection
- Check user ID matches
- Verify transaction status in DB

---

## 📚 Resources

- [TON Connect Documentation](https://docs.ton.org/applications/ton-connect/)
- [TON Pay SDK](https://docs.ton.org/applications/ton-pay/)
- [@tonconnect/ui-react](https://docs.ton.org/applications/ton-connect/api-reference/ui-react)
- [TON Blockchain Explorer](https://tonscan.org/)
- [Telegram Mini Apps Guide](https://docs.telegram-mini-apps.com/)

---

## 💬 Support

For issues or questions:
- Check console logs (browser and server)
- Review TON Connect documentation
- Test in Telegram's test environment
- Verify wallet app is updated

---

**Last Updated**: June 5, 2026
**Version**: 1.0.0
