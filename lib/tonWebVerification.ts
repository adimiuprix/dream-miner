/**
 * TON Blockchain Verification using TonWeb
 * Network config sourced from AppSetting (DB) — lazy loaded per call.
 */

import TonWeb from "tonweb";
import { Address } from "@ton/core";
import { getSetting, SETTING_KEYS } from "@/lib/settings";

export interface TransactionVerificationResult {
  isValid: boolean;
  isConfirmed: boolean;
  amount: number;
  fromAddress: string;
  toAddress: string;
  message?: string;
  timestamp?: number;
  hash?: string;
  error?: string;
}

/** Create a TonWeb instance with config from DB — called per request, not at module load */
async function createTonWeb(): Promise<InstanceType<typeof TonWeb>> {
  const [network, apiKey] = await Promise.all([
    getSetting(SETTING_KEYS.TON_NETWORK),
    getSetting(SETTING_KEYS.TON_API_KEY),
  ]);

  const endpoint = network === "mainnet"
    ? "https://toncenter.com/api/v2/jsonRPC"
    : "https://testnet.toncenter.com/api/v2/jsonRPC";

  return new TonWeb(
    new TonWeb.HttpProvider(endpoint, {
      apiKey: apiKey || undefined,
    })
  );
}

/**
 * Jumlah transaksi yang di-fetch per halaman dari TonCenter.
 * BUG-008: nilai lama 20 terlalu kecil — pada wallet ramai, transaksi user
 * bisa tidak ada di 20 terakhir meski pembayaran sudah masuk.
 * 100 adalah limit maksimum yang didukung TonCenter API v2.
 */
const TX_FETCH_LIMIT = 100;

export async function verifyTransactionByReceiverAddress(
  receiverAddress: string,
  expectedAmount: number,
  senderAddress: string,
  timeWindowSeconds = 300
): Promise<TransactionVerificationResult> {
  try {
    console.log("[TonWebVerification] Verifying:", { receiver: receiverAddress, expectedAmount, sender: senderAddress });

    const tonweb = await createTonWeb();
    const transactions = await tonweb.getTransactions(receiverAddress, TX_FETCH_LIMIT);

    if (!transactions || transactions.length === 0) {
      return {
        isValid: false, isConfirmed: false, amount: 0,
        fromAddress: "", toAddress: receiverAddress,
        error: "No transactions found for receiver address",
      };
    }

    const now    = Math.floor(Date.now() / 1000);
    const cutoff = now - timeWindowSeconds;

    for (const tx of transactions) {
      try {
        // TonCenter mengembalikan transaksi dari terbaru ke terlama.
        // Begitu menemukan transaksi yang lebih lama dari cutoff, semua
        // transaksi berikutnya pasti juga lebih lama — hentikan iterasi.
        if (tx.utime < cutoff) break;

        const inMsg = tx.in_msg;
        if (!inMsg?.source || !inMsg?.value) continue;

        const amount           = parseFloat(inMsg.value) / 1e9;
        const normalizedSource = normalizeAddress(inMsg.source);
        const normalizedSender = normalizeAddress(senderAddress);
        const senderMatches    = normalizedSource === normalizedSender;
        const amountMatches    = Math.abs(amount - expectedAmount) <= 0.001;

        console.log("[TonWebVerification] Checking tx:", { timestamp: tx.utime, source: normalizedSource, amount, senderMatches, amountMatches });

        if (senderMatches && amountMatches) {
          return {
            isValid: true, isConfirmed: true,
            amount,
            fromAddress: inMsg.source,
            toAddress:   receiverAddress,
            message:     "Transaction verified successfully",
            timestamp:   tx.utime,
            hash:        tx.transaction_id?.hash || "",
          };
        }
      } catch (err) {
        console.error("[TonWebVerification] Error parsing tx:", err);
        continue;
      }
    }

    return {
      isValid: false, isConfirmed: false, amount: 0,
      fromAddress: senderAddress, toAddress: receiverAddress,
      error: "No matching transaction found in recent transactions",
    };
  } catch (error: any) {
    console.error("[TonWebVerification] Error:", error);
    return {
      isValid: false, isConfirmed: false, amount: 0,
      fromAddress: senderAddress, toAddress: receiverAddress,
      error: error.message || "Verification failed",
    };
  }
}

function normalizeAddress(address: string): string {
  try {
    return Address.parse(address).toString({ bounceable: false, urlSafe: true });
  } catch {
    return address.toLowerCase().trim();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function pollForTransaction(
  receiverAddress: string,
  expectedAmount: number,
  senderAddress: string,
  maxAttempts = 12,
  intervalMs  = 5000
): Promise<TransactionVerificationResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`[TonWebVerification] Attempt ${attempt + 1}/${maxAttempts}`);

    const result = await verifyTransactionByReceiverAddress(receiverAddress, expectedAmount, senderAddress, 300);

    if (result.isValid && result.isConfirmed) {
      console.log("[TonWebVerification] Verified!");
      return result;
    }

    if (attempt < maxAttempts - 1) await sleep(intervalMs);
  }

  return {
    isValid: false, isConfirmed: false, amount: 0,
    fromAddress: senderAddress, toAddress: receiverAddress,
    error: `Transaction verification timeout after ${maxAttempts} attempts`,
  };
}
