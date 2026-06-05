/**
 * Alternative TON Blockchain Verification using TonWeb
 * This is a more robust implementation
 */

import TonWeb from "tonweb";
import { Address } from "@ton/core";

const TON_NETWORK = process.env.TON_NETWORK;

// Initialize TonWeb
const tonweb = new TonWeb(
  new TonWeb.HttpProvider(
    TON_NETWORK === "mainnet"
      ? "https://toncenter.com/api/v2/jsonRPC"
      : "https://testnet.toncenter.com/api/v2/jsonRPC",
    {
      apiKey: process.env.TON_API_KEY, // Optional: get from https://toncenter.com/
    }
  )
);

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

/**
 * Verify transaction by checking recent transactions of receiver address
 * This is more reliable than trying to parse BOC
 */
export async function verifyTransactionByReceiverAddress(
  receiverAddress: string,
  expectedAmount: number,
  senderAddress: string,
  timeWindowSeconds: number = 300 // 5 minutes
): Promise<TransactionVerificationResult> {
  try {
    console.log("Verifying transaction:", {
      receiver: receiverAddress,
      expectedAmount,
      sender: senderAddress,
    });

    // Get recent transactions for receiver address
    const transactions = await tonweb.getTransactions(receiverAddress, 20);

    if (!transactions || transactions.length === 0) {
      return {
        isValid: false,
        isConfirmed: false,
        amount: 0,
        fromAddress: "",
        toAddress: receiverAddress,
        error: "No transactions found for receiver address",
      };
    }

    // Current timestamp
    const now = Math.floor(Date.now() / 1000);
    const cutoffTime = now - timeWindowSeconds;

    // Look for matching transaction
    for (const tx of transactions) {
      try {
        // Check timestamp (within time window)
        if (tx.utime < cutoffTime) {
          continue; // Too old
        }

        // Get incoming message
        const inMsg = tx.in_msg;
        if (!inMsg || !inMsg.source || !inMsg.value) {
          continue;
        }

        // Parse amount (convert from nanoton to TON)
        const amount = parseFloat(inMsg.value) / 1e9;

        // Parse source address
        const sourceAddr = inMsg.source;

        // Normalize addresses for comparison
        const normalizedSource = normalizeAddress(sourceAddr);
        const normalizedExpectedSender = normalizeAddress(senderAddress);

        // Check if sender matches
        const senderMatches = normalizedSource === normalizedExpectedSender;

        // Check if amount matches (with small tolerance)
        const tolerance = 0.001; // 0.001 TON
        const amountMatches = Math.abs(amount - expectedAmount) <= tolerance;

        console.log("Checking transaction:", {
          timestamp: tx.utime,
          source: normalizedSource,
          amount,
          senderMatches,
          amountMatches,
        });

        if (senderMatches && amountMatches) {
          // Found matching transaction!
          return {
            isValid: true,
            isConfirmed: true,
            amount,
            fromAddress: sourceAddr,
            toAddress: receiverAddress,
            message: "Transaction verified successfully",
            timestamp: tx.utime,
            hash: tx.transaction_id?.hash || "",
          };
        }
      } catch (error) {
        console.error("Error parsing transaction:", error);
        continue;
      }
    }

    // No matching transaction found
    return {
      isValid: false,
      isConfirmed: false,
      amount: 0,
      fromAddress: senderAddress,
      toAddress: receiverAddress,
      error: "No matching transaction found in recent transactions",
    };
  } catch (error: any) {
    console.error("Verification error:", error);
    return {
      isValid: false,
      isConfirmed: false,
      amount: 0,
      fromAddress: senderAddress,
      toAddress: receiverAddress,
      error: error.message || "Verification failed",
    };
  }
}

/**
 * Normalize address for comparison
 */
function normalizeAddress(address: string): string {
  try {
    const addr = Address.parse(address);
    return addr.toString({ bounceable: false, urlSafe: true });
  } catch {
    // If parsing fails, try basic normalization
    return address.toLowerCase().trim();
  }
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Poll for transaction with retries
 */
export async function pollForTransaction(
  receiverAddress: string,
  expectedAmount: number,
  senderAddress: string,
  maxAttempts: number = 12,
  intervalMs: number = 5000
): Promise<TransactionVerificationResult> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    console.log(`Verification attempt ${attempts + 1}/${maxAttempts}`);

    const result = await verifyTransactionByReceiverAddress(
      receiverAddress,
      expectedAmount,
      senderAddress,
      300 // 5 minute window
    );

    // If found, return immediately
    if (result.isValid && result.isConfirmed) {
      console.log("Transaction verified!");
      return result;
    }

    // Wait before next attempt
    attempts++;
    if (attempts < maxAttempts) {
      console.log(`Waiting ${intervalMs}ms before next attempt...`);
      await sleep(intervalMs);
    }
  }

  // Timeout
  return {
    isValid: false,
    isConfirmed: false,
    amount: 0,
    fromAddress: senderAddress,
    toAddress: receiverAddress,
    error: `Transaction verification timeout after ${maxAttempts} attempts`,
  };
}
