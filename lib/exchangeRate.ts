/**
 * Exchange rate — values sourced from AppSetting (DB).
 * Fallback to hardcoded defaults if DB is unavailable.
 */
import { getSettingNumber } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/settings";

// Fallback defaults (used if DB is unavailable)
const DEFAULT_HASH_TO_TON_RATE    = 0.0000144;
const DEFAULT_MINIMUM_SWAP_HASHES = 1000;

/** Get current exchange rate from DB */
export async function getHashToTonRate(): Promise<number> {
  return getSettingNumber(SETTING_KEYS.HASH_TO_TON_RATE, DEFAULT_HASH_TO_TON_RATE);
}

/** Get minimum swap hashes from DB */
export async function getMinimumSwapHashes(): Promise<number> {
  return getSettingNumber(SETTING_KEYS.MINIMUM_SWAP_HASHES, DEFAULT_MINIMUM_SWAP_HASHES);
}

/** Convert hashes to estimated TON using DB rate */
export async function hashesToTon(hashes: number): Promise<number> {
  const rate = await getHashToTonRate();
  return hashes * rate;
}

/** Convert TON to equivalent hashes using DB rate */
export async function tonToHashes(ton: number): Promise<number> {
  const rate = await getHashToTonRate();
  return ton / rate;
}
