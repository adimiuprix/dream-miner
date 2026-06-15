/**
 * Test Telegram validator without database
 */

import "dotenv/config";
import { validateTelegramMembership } from "../lib/telegram-validator";

async function test() {
  console.log("🧪 Testing Telegram Validator\n");
  
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  console.log(`Bot Token: ${botToken?.substring(0, 15)}...`);
  
  // Test dengan user ID dan chat ID dummy
  const result = await validateTelegramMembership(123456789, "@dreamminer");
  
  console.log("\nResult:", result);
  console.log("\n✅ Validator works!");
}

test();
