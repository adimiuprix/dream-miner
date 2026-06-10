"use client";

import { TonConnectButton } from "@tonconnect/ui-react";
import { useAuth } from "@/components/AuthProvider";
import SubPageHeader from "../_components/SubPageHeader";

export default function WalletPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-20" style={{ background: "var(--background)" }}>
      <SubPageHeader
        title="Wallet"
        description="Connect your TON wallet"
        icon="fa-solid fa-wallet"
        iconColor="#3b82f6"
        iconBg="rgba(59,130,246,0.12)"
        iconBorder="rgba(59,130,246,0.2)"
      />

      <div className="flex flex-col gap-4">
        {/* Connect button */}
        <div
          className="rounded-2xl p-5 flex flex-col items-center gap-4"
          style={{ background: "#161616", border: "1px solid rgba(59,130,246,0.2)" }}
        >
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-wallet" style={{ color: "#3b82f6", fontSize: "18px" }} />
            <h3 className="text-base font-bold" style={{ color: "#fff" }}>TON Wallet</h3>
          </div>
          <p className="text-xs text-center" style={{ color: "#6b6b6b" }}>
            Connect your TON wallet to make purchases and receive swap payouts.
          </p>
          <TonConnectButton />
        </div>

        {/* Saved status */}
        {user?.walletAddress ? (
          <div
            className="rounded-2xl px-4 py-4 flex items-start gap-3"
            style={{ background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.2)" }}
          >
            <i className="fa-solid fa-circle-check mt-0.5" style={{ color: "var(--dm-green)", fontSize: "16px" }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--dm-green)" }}>Saved to account</p>
              <p className="text-xs font-mono break-all" style={{ color: "#5a8a75" }}>
                {user.walletAddress}
              </p>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl px-4 py-4 flex items-center gap-3"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <i className="fa-solid fa-circle-xmark" style={{ color: "#ef4444", fontSize: "16px" }} />
            <p className="text-sm" style={{ color: "#ef4444" }}>
              No wallet saved — connect a wallet above to enable swaps & purchases.
            </p>
          </div>
        )}

        {/* Info */}
        <div
          className="rounded-2xl px-4 py-4 flex flex-col gap-3"
          style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {[
            { icon: "fa-solid fa-cart-shopping", color: "#f5a623", text: "Required to buy Power plans from the shop" },
            { icon: "fa-solid fa-arrows-rotate", color: "var(--dm-green)", text: "TON from swaps will be sent to this wallet" },
            { icon: "fa-solid fa-shield-check",  color: "#3b82f6",         text: "Your wallet address is saved securely to your account" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-lg flex-shrink-0"
                style={{ width: 32, height: 32, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <i className={item.icon} style={{ color: item.color, fontSize: "12px" }} />
              </div>
              <p className="text-xs" style={{ color: "#6b6b6b" }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
