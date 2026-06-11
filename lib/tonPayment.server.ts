/**
 * Server-only TON payment helpers (require DB access).
 * Import ini hanya boleh digunakan dari API routes / Server Components.
 */
import { getSetting, SETTING_KEYS } from "@/lib/settings";

/** Get payment receiver address from DB settings. Throws if not set. */
export async function getPaymentReceiverAddress(): Promise<string> {
  return getSetting(SETTING_KEYS.PAYMENT_RECEIVER);
}
