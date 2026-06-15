/**
 * Compact Telegram membership validator
 */

const VALID_STATUSES = ["creator", "administrator", "member"];

export async function validateTelegramMembership(
  telegramUserId: bigint | number,
  chatId: string
): Promise<{ isValid: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (botToken === "dev") return { isValid: true };
  if (!botToken) return { isValid: false, error: "Bot token not configured" };

  try {
    const formattedChatId = chatId.startsWith("@") || chatId.startsWith("-")
      ? chatId
      : `-100${chatId}`;

    const res = await fetch(`https://api.telegram.org/bot${botToken}/getChatMember`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: formattedChatId, user_id: Number(telegramUserId) }),
    });

    const data = await res.json();

    if (!data.ok) {
      return {
        isValid: false,
        error: data.description?.includes("chat not found")
          ? "Invalid channel/group configuration"
          : "Unable to verify membership",
      };
    }

    return VALID_STATUSES.includes(data.result?.status)
      ? { isValid: true }
      : { isValid: false, error: "Please join the channel/group first" };

  } catch (error) {
    console.error("[Telegram] Validation error:", error);
    return { isValid: false, error: "Validation failed" };
  }
}

export const parseTelegramChatId = (metadata: string | null): string | null => {
  try {
    return metadata ? JSON.parse(metadata).telegramChatId ?? null : null;
  } catch {
    return null;
  }
};
