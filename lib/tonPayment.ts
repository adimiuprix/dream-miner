import { Address, beginCell, toNano } from "@ton/core";
import { getSetting, SETTING_KEYS } from "@/lib/settings";

export interface PaymentRequest {
  to: string;
  amount: string;
  payload?: string;
}

export function createPaymentTransaction(request: PaymentRequest) {
  const { to, amount, payload } = request;

  try {
    Address.parse(to);
  } catch {
    throw new Error("Invalid TON address");
  }

  return {
    validUntil: Math.floor(Date.now() / 1000) + 600,
    messages: [
      {
        address: to,
        amount: toNano(amount).toString(),
        payload: payload
          ? beginCell()
              .storeUint(0, 32)
              .storeStringTail(payload)
              .endCell()
              .toBoc()
              .toString("base64")
          : undefined,
      },
    ],
  };
}

/** Get payment receiver address from DB settings */
export async function getPaymentReceiverAddress(): Promise<string> {
  return getSetting(
    SETTING_KEYS.PAYMENT_RECEIVER,
    "EQC23M4PIfrYhh8FTrwUryFV_Accw-ZrTHFXhtEHvBQWJ_oD"
  );
}
