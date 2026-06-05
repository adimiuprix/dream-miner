"use client";

import { useState } from "react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useAuth } from "@/components/AuthProvider";
import PageHeader from "@/components/ui/PageHeader";
import PlanCard from "@/components/PlanCard";
import ShopFooter from "@/components/ShopFooter";
import { POWER_PLANS, createPaymentTransaction, PAYMENT_RECEIVER_ADDRESS } from "@/lib/tonPayment";

export default function ShopPage() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (planId: string) => {
    if (!user) {
      alert("Please log in first");
      return;
    }

    const plan = POWER_PLANS.find((p) => p.id === planId);
    if (!plan) return;

    try {
      setLoading(planId);

      // Check if wallet is connected
      if (!wallet) {
        // Connect wallet first
        await tonConnectUI.openModal();
        setLoading(null);
        return;
      }

      // Create payment transaction
      const transaction = createPaymentTransaction({
        to: PAYMENT_RECEIVER_ADDRESS,
        amount: plan.price.toString(),
        payload: `Dream Miner - ${plan.power} POWER`,
      });

      // Send transaction
      const result = await tonConnectUI.sendTransaction(transaction);

      // Transaction sent successfully
      console.log("Transaction result:", result);

      // Save to database
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          planId: plan.id,
          txHash: result.boc, // Transaction hash
          fromAddress: wallet.account.address,
          toAddress: PAYMENT_RECEIVER_ADDRESS,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Success! You purchased ${plan.power} POWER`);
        // Optionally reload user data or redirect
        window.location.reload();
      } else {
        alert("Failed to process purchase: " + data.error);
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      
      if (error.message?.includes("cancel")) {
        alert("Transaction cancelled");
      } else {
        alert("Failed to complete purchase: " + error.message);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-20" style={{ background: "var(--background)" }}>
      <PageHeader 
        title="Shop" 
        description="Buy POWER and grow faster." 
        iconClass="fa-solid fa-cart-shopping" 
      />

      {/* Wallet Connection Status */}
      {!wallet && (
        <div 
          className="mb-4 p-3 rounded-xl flex items-center gap-2"
          style={{
            background: "rgba(245, 166, 35, 0.1)",
            border: "1px solid rgba(245, 166, 35, 0.3)",
          }}
        >
          <i className="fa-solid fa-wallet" style={{ color: "#f5a623" }} />
          <p style={{ fontSize: "13px", color: "#f5a623" }}>
            Connect your TON wallet to make purchases
          </p>
        </div>
      )}

      {wallet && (
        <div 
          className="mb-4 p-3 rounded-xl flex items-center gap-2"
          style={{
            background: "rgba(0, 212, 170, 0.1)",
            border: "1px solid rgba(0, 212, 170, 0.3)",
          }}
        >
          <i className="fa-solid fa-check-circle" style={{ color: "var(--dm-green)" }} />
          <p style={{ fontSize: "13px", color: "var(--dm-green)" }}>
            Wallet connected: {wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-4)}
          </p>
        </div>
      )}

      {/* Tab */}
      <div className="mb-4">
        <button
          id="tab-buy-power"
          className="flex items-center gap-2 pb-2 text-sm font-semibold"
          style={{
            color: "var(--dm-green)",
            borderBottom: "2px solid var(--dm-green)",
          }}
        >
          <i className="fa-solid fa-bolt" />
          Buy Power
        </button>
      </div>

      {/* Plans list */}
      <div className="flex flex-col gap-3">
        {POWER_PLANS.map((plan) => (
          <PlanCard 
            key={plan.id} 
            plan={plan} 
            onPurchase={handlePurchase}
            loading={loading === plan.id}
          />
        ))}
      </div>

      <ShopFooter />
    </div>
  );
}
