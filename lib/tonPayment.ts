import { Address, beginCell, toNano } from "@ton/core";

export interface PaymentRequest {
  to: string;      // Receiver wallet address
  amount: string;  // Amount in TON
  payload?: string; // Optional comment/memo
}

/**
 * Create a TON payment transaction object for TonConnect UI.
 */
export function createPaymentTransaction(request: PaymentRequest) {
  const { to, amount, payload } = request;

  try {
    Address.parse(to);
  } catch {
    throw new Error("Invalid TON address");
  }

  return {
    validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
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

/**
 * Your receiving wallet address.
 * IMPORTANT: Replace with your actual TON wallet address.
 */
export const PAYMENT_RECEIVER_ADDRESS =
  "EQC23M4PIfrYhh8FTrwUryFV_Accw-ZrTHFXhtEHvBQWJ_oD";

// NOTE: Plan definitions have been moved to the database (Plan model).
// Use GET /api/plans to fetch plans, or prisma.plan.findMany() server-side.
