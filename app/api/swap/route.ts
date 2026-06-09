import { prisma } from "@/lib/prisma";
import { syncMiningProgress } from "@/lib/miningService";
import { HASH_TO_TON_RATE, MINIMUM_SWAP_HASHES, hashesToTon } from "@/lib/exchangeRate";
import { NextRequest, NextResponse } from "next/server";
import { TonClient, WalletContractV4, internal, toNano } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";

/**
 * POST /api/swap
 * Swap user's accumulated hashes for TON.
 *
 * Flow:
 *  1. Sync & flush accumulatedHashes ke DB
 *  2. Validasi minimum + wallet address user
 *  3. Simpan record swap di DB (status PENDING)
 *  4. Kirim TON on-chain ke wallet user
 *  5. Update swap record → COMPLETED (atau FAILED jika TX gagal)
 *
 * Blockchain call sengaja di luar prisma.$transaction karena tidak bisa
 * di-rollback — DB dan chain dipisah agar state tetap konsisten.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // ── 1. Sync & flush semua contract aktif ─────────────────────────────────
    const miningStats = await syncMiningProgress(userId);

    if (!miningStats) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentHashes = miningStats.currentHashes;

    // ── 2. Validasi ───────────────────────────────────────────────────────────
    if (currentHashes < MINIMUM_SWAP_HASHES) {
      return NextResponse.json(
        {
          error: `Insufficient hashes. Minimum ${MINIMUM_SWAP_HASHES} HASHES required.`,
          currentHashes,
          minimumRequired: MINIMUM_SWAP_HASHES,
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tonBalance: true, walletAddress: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.walletAddress) {
      return NextResponse.json(
        { error: "No TON wallet connected. Please connect your wallet first." },
        { status: 400 }
      );
    }

    // ── 3. Hitung jumlah & simpan swap record (PENDING) ───────────────────────
    const tonAmount    = hashesToTon(currentHashes);
    const hashesToSwap = currentHashes;
    const tonBalanceBefore = user.tonBalance;

    // Reset hashes di semua contracts dan catat swap sebagai PENDING
    const swap = await prisma.$transaction(async (tx) => {
      await tx.contract.updateMany({
        where: { userId },
        data: { accumulatedHashes: 0 },
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { tonBalance: { increment: tonAmount } },
      });

      return tx.swap.create({
        data: {
          userId,
          hashesSwapped:       hashesToSwap,
          tonReceived:         tonAmount,
          exchangeRate:        HASH_TO_TON_RATE,
          hashesBalanceBefore: hashesToSwap,
          hashesBalanceAfter:  0,
          tonBalanceBefore,
          tonBalanceAfter:     updatedUser.tonBalance,
          status:              "PENDING",
        },
      });
    });

    // ── 4. Kirim TON on-chain ─────────────────────────────────────────────────
    let txHash: string | null = null;

    try {
      const mnemonic = process.env.HOT_WALLET_MNEMONIC;
      if (!mnemonic) throw new Error("HOT_WALLET_MNEMONIC not configured");

      const isMainnet = process.env.TON_NETWORK === "mainnet";
      const endpoint  = isMainnet
        ? "https://toncenter.com/api/v2/jsonRPC"
        : "https://testnet.toncenter.com/api/v2/jsonRPC";

      const client = new TonClient({
        endpoint,
        apiKey: process.env.TON_API_KEY,
      });

      // Derive keypair & buka wallet
      const keyPair = await mnemonicToPrivateKey(mnemonic.split(" "));
      const wallet  = WalletContractV4.create({
        publicKey: keyPair.publicKey,
        workchain: 0,
      });
      const contract = client.open(wallet);

      // Kirim transfer
      const seqno = await contract.getSeqno();
      await contract.sendTransfer({
        seqno,
        secretKey: keyPair.secretKey,
        messages: [
          internal({
            to:    user.walletAddress,
            value: toNano(tonAmount.toFixed(9)),
            body:  `DreamMiner swap — ${hashesToSwap.toFixed(2)} HASHES`,
          }),
        ],
      });

      // Ambil hash dari TX terakhir setelah seqno naik (polling sederhana)
      const newSeqno = seqno + 1;
      txHash = `seqno:${newSeqno}`; // placeholder sampai bisa di-resolve via explorer

      console.log(
        `[Swap] Sent ${tonAmount.toFixed(9)} TON to ${user.walletAddress} (seqno ${seqno})`
      );
    } catch (chainErr) {
      // Blockchain gagal — tandai swap FAILED, kembalikan state DB
      console.error("[Swap] On-chain transfer failed:", chainErr);

      await prisma.$transaction(async (tx) => {
        // Kembalikan accumulatedHashes (set ke nilai sebelumnya)
        await tx.contract.updateMany({
          where: { userId },
          data: { accumulatedHashes: { increment: hashesToSwap } },
        });

        await tx.user.update({
          where: { id: userId },
          data: { tonBalance: { decrement: tonAmount } },
        });

        await tx.swap.update({
          where: { id: swap.id },
          data: { status: "FAILED" },
        });
      });

      return NextResponse.json(
        {
          error: "On-chain transfer failed. Your hashes have been restored.",
          detail: chainErr instanceof Error ? chainErr.message : String(chainErr),
        },
        { status: 502 }
      );
    }

    // ── 5. Tandai swap COMPLETED ──────────────────────────────────────────────
    const completedSwap = await prisma.swap.update({
      where: { id: swap.id },
      data: { status: "COMPLETED" },
    });

    console.log(
      `[Swap] User ${userId} swapped ${hashesToSwap.toFixed(2)} HASHES ` +
        `for ${tonAmount.toFixed(9)} TON → ${user.walletAddress}`
    );

    return NextResponse.json({
      success: true,
      swap: {
        id:                  completedSwap.id,
        hashesSwapped:       hashesToSwap,
        tonReceived:         tonAmount,
        exchangeRate:        HASH_TO_TON_RATE,
        newTonBalance:       tonBalanceBefore + tonAmount,
        hashesBalanceBefore: hashesToSwap,
        tonBalanceBefore,
        toAddress:           user.walletAddress,
        txHash,
        swappedAt:           completedSwap.createdAt,
      },
    });
  } catch (error) {
    console.error("[Swap] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/swap?userId=xxx
 * Preview: berapa TON yang akan diterima jika swap sekarang.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tonBalance: true, walletAddress: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const contracts = await prisma.contract.findMany({
      where: { userId, status: { in: ["ACTIVE", "EXPIRED"] } },
      select: { accumulatedHashes: true },
    });

    const currentHashes = contracts.reduce((sum, c) => sum + c.accumulatedHashes, 0);
    const tonAmount     = hashesToTon(currentHashes);
    const canSwap       = currentHashes >= MINIMUM_SWAP_HASHES && !!user.walletAddress;

    return NextResponse.json({
      success: true,
      preview: {
        currentHashes,
        estimatedTon:       tonAmount,
        exchangeRate:       HASH_TO_TON_RATE,
        minimumRequired:    MINIMUM_SWAP_HASHES,
        canSwap,
        hasWallet:          !!user.walletAddress,
        currentTonBalance:  user.tonBalance,
      },
    });
  } catch (error) {
    console.error("[Swap] Preview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
