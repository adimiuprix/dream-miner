#!/bin/bash

# Migration script for Swap model
# This creates the database migration and generates Prisma client

echo "🚀 Starting Swap Model Migration..."
echo ""

# Step 1: Create migration
echo "📝 Step 1: Creating database migration..."
npx prisma migrate dev --name add_swap_model

if [ $? -ne 0 ]; then
  echo "❌ Migration failed!"
  exit 1
fi

echo "✅ Migration created successfully!"
echo ""

# Step 2: Generate Prisma client
echo "🔄 Step 2: Generating Prisma Client..."
npx prisma generate

if [ $? -ne 0 ]; then
  echo "❌ Client generation failed!"
  exit 1
fi

echo "✅ Prisma Client generated successfully!"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Swap Model Migration Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Changes applied:"
echo "  ✓ Created 'Swap' table"
echo "  ✓ Added 'SwapStatus' enum"
echo "  ✓ Removed 'SWAP_HASH_TO_TON' from TransactionType"
echo "  ✓ Generated TypeScript types"
echo ""
echo "Next steps:"
echo "  1. Verify schema: npx prisma studio"
echo "  2. Test swap API: POST /api/swap"
echo "  3. Check swap records in database"
echo ""
