/**
 * Telegram Notification Helper
 * Bot token dibaca dari env var TELEGRAM_BOT_TOKEN.
 * Chat ID tetap dari AppSetting (bukan rahasia).
 * Fire-and-forget — error tidak menghentikan flow utama.
 */

import { getSetting, SETTING_KEYS } from "@/lib/settings";

async function sendTelegramMessage(text: string): Promise<void> {
  const token  = process.env.TELEGRAM_BOT_TOKEN ?? null;
  const chatId = await getSetting(SETTING_KEYS.TELEGRAM_NOTIFY_CHAT_ID).catch(() => null);

  if (!token || !chatId) {
    console.warn("[TelegramNotification] TELEGRAM_BOT_TOKEN env or chat ID not configured");
    return;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[TelegramNotification] Failed:", err.description ?? res.status);
    }
  } catch (err) {
    console.error("[TelegramNotification] Error:", err);
  }
}

// ─── Notification templates ──────────────────────────────────────────────────

export interface SwapNotificationData {
  userId:        string;
  username?:     string | null;
  firstName:     string;
  walletAddress: string;
  hashesSwapped: number;
  tonReceived:   number;
  txHash?:       string | null;
  swapId:        string;
}

export async function notifySwapCompleted(data: SwapNotificationData): Promise<void> {
  const name   = data.username ? `@${data.username}` : data.firstName;
  const hashes = data.hashesSwapped >= 1_000_000
    ? (data.hashesSwapped / 1_000_000).toFixed(2) + "M"
    : data.hashesSwapped >= 1_000
      ? (data.hashesSwapped / 1_000).toFixed(1) + "K"
      : data.hashesSwapped.toFixed(2);

  const text = [
    `💸 <b>Withdrawal Successful</b>`,
    ``,
    `👤 <b>User:</b> ${name}`,
    `💰 <b>Amount:</b> ${data.tonReceived.toFixed(6)} TON`,
    `🔁 <b>Hashes Swapped:</b> ${hashes} H`,
    `📬 <b>To:</b> <code>${data.walletAddress}</code>`,
    `📅 <b>Date:</b> ${new Date().toUTCString()}`,
    data.txHash ? `🔗 <b>TX:</b> <code>${data.txHash}</code>` : null,
    `🆔 <b>Swap ID:</b> <code>${data.swapId}</code>`,
    ``,
    `✅ <b>Status:</b> Completed`,
  ].filter(Boolean).join("\n");

  await sendTelegramMessage(text);
}

export interface PurchaseNotificationData {
  userId:    string;
  username?: string | null;
  firstName: string;
  planName:  string;
  amount:    number;
  txHash?:   string | null;
}

export async function notifyPurchaseCompleted(data: PurchaseNotificationData): Promise<void> {
  const name = data.username ? `@${data.username}` : data.firstName;

  const text = [
    `🛒 <b>Plan Purchase Confirmed</b>`,
    ``,
    `👤 <b>User:</b> ${name}`,
    `📦 <b>Plan:</b> ${data.planName}`,
    `💰 <b>Amount:</b> ${data.amount} TON`,
    `📅 <b>Date:</b> ${new Date().toUTCString()}`,
    data.txHash ? `🔗 <b>TX:</b> <code>${data.txHash.slice(0, 40)}...</code>` : null,
    ``,
    `✅ <b>Status:</b> Completed`,
  ].filter(Boolean).join("\n");

  await sendTelegramMessage(text);
}
