/**
 * TON Blockchain Transaction Verification Service
 * Network config sourced from AppSetting (DB).
 */

import { Address } from "@ton/core";
import { getSetting, SETTING_KEYS } from "@/lib/settings";

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

async function getApiEndpoint(): Promise<string> {
  const network = await getSetting(SETTING_KEYS.TON_NETWORK, "testnet");
  return network === "mainnet"
    ? "https://toncenter.com/api/v2/jsonRPC"
    : "https://testnet.toncenter.com/api/v2/jsonRPC";
}

export async function verifyTransaction(
  txBoc: string,
  expectedAmount: number,
  expectedReceiverAddress: string
): Promise<TransactionVerification> {
  try {
    const txHash = await parseBocToHash(txBoc);

    if (!txHash) {
      return { isValid: false, isConfirmed: false, amount: 0, fromAddress: "", toAddress: "", error: "Invalid transaction BOC" };
    }

    await sleep(3000);

    const txData = await getTransactionFromBlockchain(txHash);

    if (!txData) {
      return { isValid: false, isConfirmed: false, amount: 0, fromAddress: "", toAddress: "", error: "Transaction not found on blockchain" };
    }

    const isValid = verifyTransactionDetails(txData, expectedAmount, expectedReceiverAddress);

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
    return { isValid: false, isConfirmed: false, amount: 0, fromAddress: "", toAddress: "", error: error.message || "Verification failed" };
  }
}

async function parseBocToHash(bocBase64: string): Promise<string | null> {
  try {
    return bocBase64;
  } catch {
    return null;
  }
}

async function getTransactionFromBlockchain(txHash: string): Promise<any> {
  try {
    const endpoint = await getApiEndpoint();

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "1", jsonrpc: "2.0", method: "getTransactions",
        params: { address: txHash, limit: 1 },
      }),
    });

    const data = await response.json();

    if (data.result && data.result.length > 0) {
      const tx = data.result[0];
      return {
        hash: txHash,
        source:      tx.in_msg?.source      || "",
        destination: tx.in_msg?.destination || "",
        amount:      parseFloat(tx.in_msg?.value || "0") / 1e9,
        confirmed:   true,
        timestamp:   tx.utime || Date.now() / 1000,
      };
    }

    return null;
  } catch (error) {
    console.error("Blockchain fetch error:", error);
    return null;
  }
}

function verifyTransactionDetails(
  txData: any, expectedAmount: number, expectedReceiverAddress: string
): { valid: boolean; message: string } {
  const normalizedReceiver = normalizeAddress(txData.destination);
  const normalizedExpected = normalizeAddress(expectedReceiverAddress);

  if (normalizedReceiver !== normalizedExpected) {
    return { valid: false, message: `Receiver mismatch: expected ${normalizedExpected}, got ${normalizedReceiver}` };
  }

  const amountDiff = Math.abs(txData.amount - expectedAmount);
  if (amountDiff > 0.01) {
    return { valid: false, message: `Amount mismatch: expected ${expectedAmount}, got ${txData.amount}` };
  }

  if (!txData.confirmed) {
    return { valid: false, message: "Transaction not yet confirmed" };
  }

  return { valid: true, message: "Transaction verified successfully" };
}

function normalizeAddress(address: string): string {
  try {
    return Address.parse(address).toString();
  } catch {
    return address.toLowerCase().trim();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function pollTransactionStatus(
  txBoc: string,
  expectedAmount: number,
  expectedReceiverAddress: string,
  maxAttempts = 10,
  intervalMs = 5000
): Promise<TransactionVerification> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const verification = await verifyTransaction(txBoc, expectedAmount, expectedReceiverAddress);

    if (verification.isConfirmed || verification.error?.includes("not found")) {
      return verification;
    }

    await sleep(intervalMs);
    attempts++;
  }

  return { isValid: false, isConfirmed: false, amount: 0, fromAddress: "", toAddress: "", error: "Transaction verification timeout" };
}
