import { NextResponse } from "next/server";
import { getSetting, getSettingNumber, SETTING_KEYS } from "@/lib/settings";

/**
 * GET /api/config
 * Returns public app config needed by the client.
 * Does NOT expose secrets.
 * Returns 500 if any required setting is missing from DB.
 */
export async function GET() {
  try {
    const [receiverAddress, hashToTonRate, minimumSwapHashes, botUsername] = await Promise.all([
      getSetting(SETTING_KEYS.PAYMENT_RECEIVER),
      getSettingNumber(SETTING_KEYS.HASH_TO_TON_RATE),
      getSettingNumber(SETTING_KEYS.MINIMUM_SWAP_HASHES),
      getSetting(SETTING_KEYS.BOT_USERNAME),
    ]);

    return NextResponse.json({
      success: true,
      config: {
        receiverAddress,
        hashToTonRate,
        minimumSwapHashes,
        botUsername,
      },
    });
  } catch (error) {
    console.error("[Config] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
