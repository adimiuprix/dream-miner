import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const message = `
    🎉 *Withdrawal Successful*

    Your withdrawal request has been processed successfully.

    💰 *Amount:* 1 TON
    📅 *Date:* 2026-06-11 16:42:18 UTC
    ✅ *Status:* Completed

    🔗 *Transaction Hash:*
    \`8f3c7e1a92b5d4f6c8e9a7b1d3f5e6a9c2b4d7e8f1a3c5b7d9e2f4a6c8b1d3e\`

    Thank you for using Dream Miner.
    `.trim()

    const token  = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_NOTIFY_CHAT_ID;

    if (!token || !chatId) {
      return NextResponse.json(
        { success: false, message: "Bot token or chat ID not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text:    message,
          parse_mode: "Markdown",
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.description);
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}