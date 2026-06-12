import { prisma } from "@/lib/prisma";
import { flushAndLockHashes } from "@/lib/miningService";
import { getHashToTonRate, getMinimumSwapHashes } from "@/lib/exchangeRate";
import { NextRequest, NextResponse } from "next/server";
import { TonClient, WalletContractV4, internal, toNano } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";
import { notifySwapCompleted } from "@/lib/telegramNotification";
import { getSetting, SETTING_KEYS } from "@/lib/settings";

/**
 * POST /api/swap
 * Swap user's accumulated hashes for TON.
 *
 * Flow:
 *  1. Validasi awal (minimum hashes, wallet address)
 *  2. Atomic lock: flush pending hashes + baca total + reset ke 0 dalam satu
 *     DB transaction dengan row-level lock (SELECT FOR UPDATE) untuk mencegah
 *     race condition dengan mining sync atau swap concurrent.
 *  3. Simpan swap record (status PENDING)
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

    // ── 1. Validasi awal: user + wallet ──────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tonBalance: true, walletAddress: true, username: true, firstName: true },
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

    const [minimumSwapHashes, hashToTonRate] = await Promise.all([
      getMinimumSwapHashes(),
      getHashToTonRate(),
    ]);

    // ── 2. Atomic lock: flush + baca + reset hashes ───────────────────────────
    // flushAndLockHashes menjalankan flush, baca total, validasi minimum, reset
    // ke 0, dan buat swap record dalam SATU Serializable DB transaction.
    // Jika concurrent sync atau swap lain berlomba untuk user yang sama,
    // PostgreSQL akan abort salah satunya — tidak ada double-counting.
    const { hashesToSwap, tonAmount, swap, contractSnapshots } = await flushAndLockHashes({
      userId,
      minimumSwapHashes,
      hashToTonRate,
      tonBalanceBefore: user.tonBalance,
    });

    const tonBalanceBefore = user.tonBalance;

    // ── 4. Kirim TON on-chain ─────────────────────────────────────────────────
    let txHash: string | null = null;

    try {
      const [mnemonic, tonNetwork, tonApiKey] = await Promise.all([
        getSetting(SETTING_KEYS.HOT_WALLET_MNEMONIC),
        getSetting(SETTING_KEYS.TON_NETWORK),
        getSetting(SETTING_KEYS.TON_API_KEY),
      ]);

      if (!mnemonic) throw new Error("hot_wallet_mnemonic not configured in AppSetting");

      const isMainnet = tonNetwork === "mainnet";
      const endpoint  = isMainnet
        ? "https://toncenter.com/api/v2/jsonRPC"
        : "https://testnet.toncenter.com/api/v2/jsonRPC";

      const client = new TonClient({
        endpoint,
        apiKey: tonApiKey || undefined,
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
      // Blockchain gagal — kembalikan state DB dan tandai swap FAILED
      console.error("[Swap] On-chain transfer failed:", chainErr);

      await prisma.$transaction(async (tx) => {
        // Kembalikan accumulatedHashes ke nilai semula per-contract menggunakan
        // snapshot yang direkam sebelum reset (BUG-018 fix).
        // Ini memastikan tiap contract mendapat kembali nilai yang tepat —
        // bukan total swap didistribusi merata ke semua contract.
        await Promise.all(
          contractSnapshots.map((s) =>
            tx.contract.update({
              where: { id: s.id },
              data:  { accumulatedHashes: s.hashes },
            })
          )
        );

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

    // ── 6. Kirim notifikasi ke Telegram channel (fire-and-forget) ─────────────
    notifySwapCompleted({
      userId,
      username:      user.username,
      firstName:     user.firstName,
      walletAddress: user.walletAddress!,
      hashesSwapped: hashesToSwap,
      tonReceived:   tonAmount,
      txHash,
      swapId:        completedSwap.id,
    });

    return NextResponse.json({
      success: true,
      swap: {
        id:                  completedSwap.id,
        hashesSwapped:       hashesToSwap,
        tonReceived:         tonAmount,
        exchangeRate:        hashToTonRate,
        newTonBalance:       tonBalanceBefore + tonAmount,
        hashesBalanceBefore: hashesToSwap,
        tonBalanceBefore,
        toAddress:           user.walletAddress,
        txHash,
        swappedAt:           completedSwap.createdAt,
      },
    });
  } catch (error) {
    // Error khusus dari flushAndLockHashes saat hashes tidak cukup
    if (
      error instanceof Error &&
      (error as Error & { code?: string }).code === "INSUFFICIENT_HASHES"
    ) {
      const e = error as Error & { code: string; currentHashes: number; minimumRequired: number };
      return NextResponse.json(
        {
          error: e.message,
          currentHashes:   e.currentHashes,
          minimumRequired: e.minimumRequired,
        },
        { status: 400 }
      );
    }

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

    const [minimumSwapHashes, hashToTonRate] = await Promise.all([
      getMinimumSwapHashes(),
      getHashToTonRate(),
    ]);

    const currentHashes = contracts.reduce((sum, c) => sum + c.accumulatedHashes, 0);
    const tonAmount     = currentHashes * hashToTonRate;
    const canSwap       = currentHashes >= minimumSwapHashes && !!user.walletAddress;

    return NextResponse.json({
      success: true,
      preview: {
        currentHashes,
        estimatedTon:       tonAmount,
        exchangeRate:       hashToTonRate,
        minimumRequired:    minimumSwapHashes,
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
