#!/bin/bash

# Generate Prisma Client
# This script regenerates the Prisma client after schema changes

echo "🔄 Generating Prisma Client..."

npx prisma generate

if [ $? -eq 0 ]; then
  echo "✅ Prisma Client generated successfully!"
  echo ""
  echo "📝 Generated files:"
  echo "   - lib/generated/prisma/**/*"
else
  echo "❌ Failed to generate Prisma Client"
  exit 1
fi
