import { Address, beginCell, toNano } from "@ton/core";

export interface PaymentRequest {
  to: string; // Receiver wallet address
  amount: string; // Amount in TON
  payload?: string; // Optional comment/memo
}

/**
 * Create a TON payment transaction
 * @param request Payment details
 * @returns Transaction object for TON Connect
 */
export function createPaymentTransaction(request: PaymentRequest) {
  const { to, amount, payload } = request;

  // Validate address
  try {
    Address.parse(to);
  } catch (error) {
    throw new Error("Invalid TON address");
  }

  // Create transaction
  const transaction = {
    validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
    messages: [
      {
        address: to,
        amount: toNano(amount).toString(),
        payload: payload
          ? beginCell()
              .storeUint(0, 32) // Text comment opcode
              .storeStringTail(payload)
              .endCell()
              .toBoc()
              .toString("base64")
          : undefined,
      },
    ],
  };

  return transaction;
}

/**
 * Power plan configurations
 */
export const POWER_PLANS = [
  {
    id: "plan-118k",
    power: "118K",
    powerValue: 118000,
    finalReturn: "1.100 TON",
    price: 1,
    bonus: null,
    bonusValue: 0,
    bonusColor: null,
  },
  {
    id: "plan-600k",
    power: "600K",
    powerValue: 600000,
    finalReturn: "5.610 TON",
    price: 5,
    bonus: "+11.8K POWER",
    bonusValue: 11800,
    bonusColor: "#00d4aa",
  },
  {
    id: "plan-1m2",
    power: "1.2M",
    powerValue: 1200000,
    finalReturn: "11.550 TON",
    price: 10,
    bonus: "+58.8K POWER",
    bonusValue: 58800,
    bonusColor: "#8b5cf6",
  },
  {
    id: "plan-3m7",
    power: "3.7M",
    powerValue: 3700000,
    finalReturn: "34.375 TON",
    price: 25,
    bonus: "+735K POWER",
    bonusValue: 735000,
    bonusColor: "#8b5cf6",
  },
  {
    id: "plan-17m6",
    power: "17.6M",
    powerValue: 17600000,
    finalReturn: "165.000 TON",
    price: 100,
    bonus: "+5.9M POWER",
    bonusValue: 5900000,
    bonusColor: "#f5a623",
  },
];

/**
 * Your receiving wallet address
 * IMPORTANT: Replace this with your actual TON wallet address
 */
export const PAYMENT_RECEIVER_ADDRESS = "EQC23M4PIfrYhh8FTrwUryFV_Accw-ZrTHFXhtEHvBQWJ_oD";
