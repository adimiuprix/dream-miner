/**
 * Serialization utilities for BigInt fields
 * BigInt cannot be directly serialized to JSON, so we need to convert them
 */

/**
 * Serialize a single contract object for JSON response
 */
export function serializeContract<T extends { lastSyncAt: bigint; expiresAt: bigint }>(
  contract: T
): Omit<T, "lastSyncAt" | "expiresAt"> & { lastSyncAt: number; expiresAt: number } {
  return {
    ...contract,
    lastSyncAt: Number(contract.lastSyncAt),
    expiresAt: Number(contract.expiresAt),
  };
}

/**
 * Serialize an array of contracts for JSON response
 */
export function serializeContracts<T extends { lastSyncAt: bigint; expiresAt: bigint }>(
  contracts: T[]
): Array<Omit<T, "lastSyncAt" | "expiresAt"> & { lastSyncAt: number; expiresAt: number }> {
  return contracts.map(serializeContract);
}

/**
 * Generic BigInt serializer for any object
 * Recursively converts all BigInt values to numbers
 */
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "bigint") {
    return Number(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt) as T;
  }

  if (typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = serializeBigInt(obj[key]);
      }
    }
    return result;
  }

  return obj;
}

/**
 * Custom JSON.stringify replacer for BigInt
 * Usage: JSON.stringify(data, bigIntReplacer)
 */
export function bigIntReplacer(_key: string, value: any): any {
  if (typeof value === "bigint") {
    return Number(value);
  }
  return value;
}
