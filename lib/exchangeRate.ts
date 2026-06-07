/**
 * Exchange rate configuration
 * 1,000 HASHES = 0.0144 TON
 * ~69,444 HASHES = 1 TON
 */
export const HASH_TO_TON_RATE = 0.0000144; // 1 HASH = 0.0000144 TON
export const MINIMUM_SWAP_HASHES = 1000;

/** Convert hashes to estimated TON */
export function hashesToTon(hashes: number): number {
  return hashes * HASH_TO_TON_RATE;
}

/** Convert TON to equivalent hashes */
export function tonToHashes(ton: number): number {
  return ton / HASH_TO_TON_RATE;
}
