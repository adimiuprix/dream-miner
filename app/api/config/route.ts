import { NextResponse } from "next/server";
import { getSetting, getSettingNumber, SETTING_KEYS } from "@/lib/settings";

/**
 * GET /api/config
 * Returns public app config needed by the client.
 * Does NOT expose secrets.
 */
export async function GET() {
  try {
    const [receiverAddress, hashToTonRate, minimumSwapHashes] = await Promise.all([
      getSetting(SETTING_KEYS.PAYMENT_RECEIVER, "EQC23M4PIfrYhh8FTrwUryFV_Accw-ZrTHFXhtEHvBQWJ_oD"),
      getSettingNumber(SETTING_KEYS.HASH_TO_TON_RATE, 0.0000144),
      getSettingNumber(SETTING_KEYS.MINIMUM_SWAP_HASHES, 1000),
    ]);

    return NextResponse.json({
      success: true,
      config: {
        receiverAddress,
        hashToTonRate,
        minimumSwapHashes,
      },
    });
  } catch (error) {
    console.error("[Config] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
