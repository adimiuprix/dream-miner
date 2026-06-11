/**
 * App Settings Helper
 * Read and write settings from AppSetting key-value store.
 *
 * Usage:
 *   const rate = await getSetting("hash_to_ton_rate", 0.0000144);
 *   await setSetting("hash_to_ton_rate", "0.0000288");
 */

import { prisma } from "@/lib/prisma";

// ─── Setting keys — single source of truth ───────────────────────────────────
export const SETTING_KEYS = {
  // APP_CONFIG
  HASH_TO_TON_RATE:       "hash_to_ton_rate",
  MINIMUM_SWAP_HASHES:    "minimum_swap_hashes",
  POWER_TO_HASH_RATE:     "power_to_hash_rate",
  JOIN_BONUS_POWER:       "join_bonus_power",
  PURCHASE_BONUS_PERCENT: "purchase_bonus_percent",
  PAYMENT_RECEIVER:       "payment_receiver_address",

  // HOT_WALLET
  HOT_WALLET_MNEMONIC:    "hot_wallet_mnemonic",
  TON_NETWORK:            "ton_network",
  TON_API_KEY:            "ton_api_key",

  // TELEGRAM
  TELEGRAM_BOT_TOKEN:     "telegram_bot_token",
  TELEGRAM_NOTIFY_CHAT_ID:"telegram_notify_chat_id",
  BOT_USERNAME:           "bot_username",
} as const;

export type SettingKey = typeof SETTING_KEYS[keyof typeof SETTING_KEYS];

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Get a setting value as string. Returns defaultValue if key not found. */
export async function getSetting(key: SettingKey, defaultValue = ""): Promise<string> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key } });
    return row?.value ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

/** Get a setting value as number. */
export async function getSettingNumber(key: SettingKey, defaultValue = 0): Promise<number> {
  const raw = await getSetting(key, String(defaultValue));
  const n = parseFloat(raw);
  return isNaN(n) ? defaultValue : n;
}

/** Get a setting value as boolean. */
export async function getSettingBool(key: SettingKey, defaultValue = false): Promise<boolean> {
  const raw = await getSetting(key, String(defaultValue));
  return raw === "true" || raw === "1";
}

/** Get all settings (no cache) — for admin UI. */
export async function getAllSettings() {
  return prisma.appSetting.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });
}

// ─── Write ────────────────────────────────────────────────────────────────────

/** Update a setting value. */
export async function setSetting(key: SettingKey, value: string): Promise<void> {
  await prisma.appSetting.update({ where: { key }, data: { value } });
}

/** Bulk update settings. */
export async function setSettings(entries: { key: SettingKey; value: string }[]): Promise<void> {
  await Promise.all(
    entries.map((e) =>
      prisma.appSetting.update({ where: { key: e.key }, data: { value: e.value } })
    )
  );
}
