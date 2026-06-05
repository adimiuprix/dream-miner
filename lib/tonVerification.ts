/**
 * TON Blockchain Transaction Verification Service
 */

import { Address } from "@ton/core";

// TON API endpoints
const TON_API_MAINNET = "https://toncenter.com/api/v2/jsonRPC";
const TON_API_TESTNET = "https://testnet.toncenter.com/api/v2/jsonRPC";

// Choose network (change to mainnet in production)
const TON_NETWORK = process.env.TON_NETWORK || "testnet";
const TON_API_ENDPOINT = TON_NETWORK === "mainnet" ? TON_API_MAINNET : TON_API_TESTNET;

export interface TransactionVerification {
  isValid: boolean;
  isConfirmed: boolean;
  amount: number;
  fromAddress: string;
  toAddress: string;
  message?: string;
  timestamp?: number;
  error?: string;
}

/**
 * Verify a TON transaction on blockchain
 * @param txBoc - Transaction BOC (Bag of Cells) from TON Connect
 * @param expectedAmount - Expected amount in TON
 * @param expectedReceiverAddress - Expected receiver wallet address
 */
export async function verifyTransaction(
  txBoc: string,
  expectedAmount: number,
  expectedReceiverAddress: string
): Promise<TransactionVerification> {
  try {
    // Parse BOC to get transaction hash
    const txHash = await parseBocToHash(txBoc);

    if (!txHash) {
      return {
        isValid: false,
        isConfirmed: false,
        amount: 0,
        fromAddress: "",
        toAddress: "",
        error: "Invalid transaction BOC",
      };
    }

    // Wait a bit for blockchain confirmation
    await sleep(3000); // 3 seconds

    // Get transaction from blockchain
    const txData = await getTransactionFromBlockchain(txHash);

    if (!txData) {
      return {
        isValid: false,
        isConfirmed: false,
        amount: 0,
        fromAddress: "",
        toAddress: "",
        error: "Transaction not found on blockchain",
      };
    }

    // Verify transaction details
    const isValid = verifyTransactionDetails(
      txData,
      expectedAmount,
      expectedReceiverAddress
    );

    return {
      isValid: isValid.valid,
      isConfirmed: txData.confirmed,
      amount: txData.amount,
      fromAddress: txData.source,
      toAddress: txData.destination,
      message: isValid.message,
      timestamp: txData.timestamp,
    };
  } catch (error: any) {
    console.error("Transaction verification error:", error);
    return {
      isValid: false,
      isConfirmed: false,
      amount: 0,
      fromAddress: "",
      toAddress: "",
      error: error.message || "Verification failed",
    };
  }
}

/**
 * Parse BOC to extract transaction hash
 */
async function parseBocToHash(bocBase64: string): Promise<string | null> {
  try {
    // BOC is base64 encoded transaction
    // For now, we use it as-is since TON Connect provides the hash
    // In production, you might need to decode BOC properly
    return bocBase64;
  } catch (error) {
    console.error("BOC parsing error:", error);
    return null;
  }
}

/**
 * Get transaction from TON blockchain via API
 */
async function getTransactionFromBlockchain(txHash: string): Promise<any> {
  try {
    // Method 1: Try to get transaction by hash (simplified approach)
    const response = await fetch(TON_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: "1",
        jsonrpc: "2.0",
        method: "getTransactions",
        params: {
          address: txHash, // This is simplified, actual implementation varies
          limit: 1,
        },
      }),
    });

    const data = await response.json();

    if (data.result && data.result.length > 0) {
      const tx = data.result[0];

      // Parse transaction data
      return {
        hash: txHash,
        source: tx.in_msg?.source || "",
        destination: tx.in_msg?.destination || "",
        amount: parseFloat(tx.in_msg?.value || "0") / 1e9, // Convert from nanoton to TON
        confirmed: true,
        timestamp: tx.utime || Date.now() / 1000,
      };
    }

    return null;
  } catch (error) {
    console.error("Blockchain fetch error:", error);
    return null;
  }
}

/**
 * Verify transaction details match expectations
 */
function verifyTransactionDetails(
  txData: any,
  expectedAmount: number,
  expectedReceiverAddress: string
): { valid: boolean; message: string } {
  // Normalize addresses for comparison
  const normalizedReceiver = normalizeAddress(txData.destination);
  const normalizedExpected = normalizeAddress(expectedReceiverAddress);

  // Check receiver address
  if (normalizedReceiver !== normalizedExpected) {
    return {
      valid: false,
      message: `Receiver mismatch: expected ${normalizedExpected}, got ${normalizedReceiver}`,
    };
  }

  // Check amount (with small tolerance for fees)
  const tolerance = 0.01; // 0.01 TON tolerance
  const amountDiff = Math.abs(txData.amount - expectedAmount);

  if (amountDiff > tolerance) {
    return {
      valid: false,
      message: `Amount mismatch: expected ${expectedAmount}, got ${txData.amount}`,
    };
  }

  // Check if transaction is confirmed
  if (!txData.confirmed) {
    return {
      valid: false,
      message: "Transaction not yet confirmed",
    };
  }

  return {
    valid: true,
    message: "Transaction verified successfully",
  };
}

/**
 * Normalize TON address for comparison
 */
function normalizeAddress(address: string): string {
  try {
    // Parse and re-format address to standard form
    const addr = Address.parse(address);
    return addr.toString();
  } catch {
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
 * Poll for transaction confirmation
 * Use this to check transaction status periodically
 */
export async function pollTransactionStatus(
  txBoc: string,
  expectedAmount: number,
  expectedReceiverAddress: string,
  maxAttempts: number = 10,
  intervalMs: number = 5000
): Promise<TransactionVerification> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const verification = await verifyTransaction(
      txBoc,
      expectedAmount,
      expectedReceiverAddress
    );

    // If confirmed or definitively invalid, return
    if (verification.isConfirmed || verification.error?.includes("not found")) {
      return verification;
    }

    // Wait before next attempt
    await sleep(intervalMs);
    attempts++;
  }

  return {
    isValid: false,
    isConfirmed: false,
    amount: 0,
    fromAddress: "",
    toAddress: "",
    error: "Transaction verification timeout",
  };
}
