@echo off
REM Migration script for Swap model (Windows)
REM This creates the database migration and generates Prisma client

echo.
echo Starting Swap Model Migration...
echo.

REM Step 1: Create migration
echo Step 1: Creating database migration...
call npx prisma migrate dev --name add_swap_model

if %errorlevel% neq 0 (
  echo Migration failed!
  exit /b 1
)

echo Migration created successfully!
echo.

REM Step 2: Generate Prisma client
echo Step 2: Generating Prisma Client...
call npx prisma generate

if %errorlevel% neq 0 (
  echo Client generation failed!
  exit /b 1
)

echo Prisma Client generated successfully!
echo.

REM Summary
echo ========================================
echo Swap Model Migration Complete!
echo ========================================
echo.
echo Changes applied:
echo   * Created 'Swap' table
echo   * Added 'SwapStatus' enum
echo   * Removed 'SWAP_HASH_TO_TON' from TransactionType
echo   * Generated TypeScript types
echo.
echo Next steps:
echo   1. Verify schema: npx prisma studio
echo   2. Test swap API: POST /api/swap
echo   3. Check swap records in database
echo.

pause
