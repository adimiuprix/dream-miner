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
      console.log("Transaction sent to blockchain:", result);

      // Save to database with PENDING status
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          planId: plan.id,
          txHash: result.boc,
          fromAddress: wallet.account.address,
          toAddress: PAYMENT_RECEIVER_ADDRESS,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        alert("Failed to process purchase: " + data.error);
        setLoading(null);
        return;
      }

      console.log("Transaction saved to database:", data.transaction);

      // Show pending message
      alert("Transaction sent! Verifying on blockchain...");

      // Start verification polling
      const transactionId = data.transaction.id;
      const verified = await pollVerificationStatus(transactionId);

      if (verified) {
        alert(`Success! You purchased ${plan.power} POWER. Power has been added to your account.`);
        // Reload to show updated power
        window.location.reload();
      } else {
        alert("Transaction verification failed or timed out. Please contact support if payment was deducted.");
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

  /**
   * Poll verification status until completed or timeout
   */
  const pollVerificationStatus = async (
    transactionId: string,
    maxAttempts: number = 12, // 12 attempts = 60 seconds
    intervalMs: number = 5000 // 5 seconds
  ): Promise<boolean> => {
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        // Trigger verification
        const verifyResponse = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionId }),
        });

        const verifyData = await verifyResponse.json();

        console.log(`Verification attempt ${attempts + 1}:`, verifyData);

        // Check if completed
        if (verifyData.status === "COMPLETED") {
          return true;
        }

        // Check if failed
        if (verifyData.status === "FAILED") {
          console.error("Verification failed:", verifyData.message);
          return false;
        }

        // Still pending, wait and retry
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        attempts++;
      } catch (error) {
        console.error("Polling error:", error);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    // Timeout
    console.error("Verification timeout");
    return false;
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
