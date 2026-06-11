import { Address, beginCell, toNano } from "@ton/core";

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
