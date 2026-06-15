/**
 * Get Telegram chat IDs - Forward message from channel/group to bot first
 * Usage: npx tsx scripts/get-chat-id.ts
 */

import "dotenv/config";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token || token === "dev") {
  console.error("❌ Set valid TELEGRAM_BOT_TOKEN in .env");
  process.exit(1);
}

fetch(`https://api.telegram.org/bot${token}/getUpdates`)
  .then((r) => r.json())
  .then((data) => {
    if (!data.ok || data.result.length === 0) {
      console.log("ℹ️  No messages. Forward a message from your channel/group to the bot.");
      return;
    }

    const chats = new Map();
    data.result.forEach((u: any) => {
      const chat = u.message?.chat || u.channel_post?.chat;
      if (chat && !chats.has(chat.id)) chats.set(chat.id, chat);
    });

    console.log(`\n✅ Found ${chats.size} chat(s):\n`);
    chats.forEach((chat: any) => {
      console.log(`📍 ${chat.type.toUpperCase()}: ${chat.title || chat.first_name}`);
      console.log(`   ID: ${chat.id}`);
      if (chat.username) console.log(`   Username: @${chat.username}`);
      console.log(`   Use: ${JSON.stringify({ telegramChatId: chat.username ? `@${chat.username}` : chat.id.toString() })}\n`);
    });
  })
  .catch((e) => console.error("❌ Error:", e));
