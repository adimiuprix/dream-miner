"use client";

import { useState, useEffect } from "react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useAuth } from "@/components/AuthProvider";
import PageHeader from "@/components/ui/PageHeader";
import PlanCard, { PowerPlan } from "@/components/PlanCard";
import ShopFooter from "@/components/ShopFooter";
import { createPaymentTransaction, PAYMENT_RECEIVER_ADDRESS } from "@/lib/tonPayment";
import { toast } from "@/components/ui/toast";

export default function ShopPage() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [plans, setPlans] = useState<PowerPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  // Fetch plans from database on mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setPlansLoading(true);
        const response = await fetch("/api/plans");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch plans");
        }

        setPlans(data.plans);
      } catch (err: any) {
        console.error("Failed to load plans:", err);
        setPlansError(err.message || "Failed to load plans");
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handlePurchase = async (planId: string) => {
    if (!user) {
      toast.create({ title: "Please log in first.", type: "error" });
      return;
    }

    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    try {
      setLoading(planId);

      if (!wallet) {
        await tonConnectUI.openModal();
        setLoading(null);
        return;
      }

      const transaction = createPaymentTransaction({
        to: PAYMENT_RECEIVER_ADDRESS,
        amount: plan.price.toString(),
        payload: `Dream Miner - ${plan.name} POWER`,
      });

      const result = await tonConnectUI.sendTransaction(transaction);

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
        toast.create({ title: "Purchase failed.", description: data.error, type: "error" });
        setLoading(null);
        return;
      }

      toast.create({ title: "Transaction sent!", description: "Verifying on blockchain...", type: "loading" });

      const transactionId = data.transaction.id;
      const verified = await pollVerificationStatus(transactionId);

      if (verified) {
        toast.create({
          title: "Purchase successful!",
          description: `${plan.name} POWER has been added to your account.`,
          type: "success",
        });
        window.location.reload();
      } else {
        toast.create({
          title: "Verification failed or timed out.",
          description: "Contact support if payment was deducted.",
          type: "error",
        });
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      if (error.message?.includes("cancel")) {
        toast.create({ title: "Transaction cancelled.", type: "info" });
      } else {
        toast.create({ title: "Purchase failed.", description: error.message, type: "error" });
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
      {plansLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-full rounded-2xl px-4 py-4 animate-pulse"
              style={{
                background: "#161616",
                border: "1px solid rgba(255,255,255,0.06)",
                height: 72,
              }}
            />
          ))}
        </div>
      )}

      {plansError && !plansLoading && (
        <div
          className="p-4 rounded-xl text-center"
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
            fontSize: "13px",
          }}
        >
          <i className="fa-solid fa-circle-exclamation mb-2 text-lg" />
          <p>{plansError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 underline text-xs"
          >
            Try again
          </button>
        </div>
      )}

      {!plansLoading && !plansError && (
        <div className="flex flex-col gap-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onPurchase={handlePurchase}
              loading={loading === plan.id}
            />
          ))}
        </div>
      )}

      <ShopFooter />
    </div>
  );
}
