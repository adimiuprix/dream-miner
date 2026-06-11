/**
 * Telegram Notification Helper
 * Kirim notifikasi langsung ke Telegram API.
 * Fire-and-forget — error tidak menghentikan flow utama.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Kirim pesan ke Telegram channel yang dikonfigurasi di env.
 */
async function sendTelegramMessage(text: string): Promise<void> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_NOTIFY_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[TelegramNotification] Bot token or chat ID not configured");
    return;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id:    chatId,
          text,
          parse_mode: "HTML",
        }),
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

/**
 * Kirim notifikasi swap berhasil ke channel.
 */
export async function notifySwapCompleted(data: SwapNotificationData): Promise<void> {
  const name    = data.username ? `@${data.username}` : data.firstName;
  const hashes  = data.hashesSwapped >= 1_000_000
    ? (data.hashesSwapped / 1_000_000).toFixed(2) + "M"
    : data.hashesSwapped >= 1_000
      ? (data.hashesSwapped / 1_000).toFixed(1) + "K"
      : data.hashesSwapped.toFixed(2);
  const date    = new Date().toUTCString();

  const text = [
    `💸 <b>Withdrawal Successful</b>`,
    ``,
    `👤 <b>User:</b> ${name}`,
    `💰 <b>Amount:</b> ${data.tonReceived.toFixed(6)} TON`,
    `🔁 <b>Hashes Swapped:</b> ${hashes} H`,
    `📬 <b>To:</b> <code>${data.walletAddress}</code>`,
    `📅 <b>Date:</b> ${date}`,
    data.txHash ? `🔗 <b>TX:</b> <code>${data.txHash}</code>` : null,
    `🆔 <b>Swap ID:</b> <code>${data.swapId}</code>`,
    ``,
    `✅ <b>Status:</b> Completed`,
  ]
    .filter((line) => line !== null)
    .join("\n");

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

/**
 * Kirim notifikasi pembelian plan berhasil ke channel.
 */
export async function notifyPurchaseCompleted(data: PurchaseNotificationData): Promise<void> {
  const name = data.username ? `@${data.username}` : data.firstName;
  const date = new Date().toUTCString();

  const text = [
    `🛒 <b>Plan Purchase Confirmed</b>`,
    ``,
    `👤 <b>User:</b> ${name}`,
    `📦 <b>Plan:</b> ${data.planName}`,
    `💰 <b>Amount:</b> ${data.amount} TON`,
    `📅 <b>Date:</b> ${date}`,
    data.txHash ? `🔗 <b>TX:</b> <code>${data.txHash.slice(0, 40)}...</code>` : null,
    ``,
    `✅ <b>Status:</b> Completed`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  await sendTelegramMessage(text);
}
