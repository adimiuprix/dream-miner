/**
 * Server-only TON payment helpers (require DB access).
 * Import ini hanya boleh digunakan dari API routes / Server Components.
 */
import { getSetting, SETTING_KEYS } from "@/lib/settings";

/** Get payment receiver address from DB settings */
export async function getPaymentReceiverAddress(): Promise<string> {
  return getSetting(
    SETTING_KEYS.PAYMENT_RECEIVER,
    "EQC23M4PIfrYhh8FTrwUryFV_Accw-ZrTHFXhtEHvBQWJ_oD"
  );
}
