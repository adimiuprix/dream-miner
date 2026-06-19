"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MiningRing from "@/components/MiningRing";
import TopBar from "@/components/TopBar";
import dynamic from "next/dynamic";
import { toast } from "@/components/ui/toast";
import DailyAdBonus from "@/components/DailyAdBonus";

const HashCounter = dynamic(() => import("@/components/HashCounter"), { ssr: false });

import StatsBar from "@/components/StatsBar";
import ContractSection from "@/components/ContractSection";
import SwapCard from "@/components/SwapCard";
import QuickActions, { QuickAction } from "@/components/QuickActions";
import { useAuth } from "@/components/AuthProvider";
import { useMining } from "@/components/MiningProvider";
import { useAds } from "@/components/AdsgramProvider";

export default function HomePage() {
  const { user } = useAuth();
  const { refresh } = useMining();
  const { showAd } = useAds();
  const router = useRouter();
  const [claimLoading, setClaimLoading] = useState(false);

  async function claimFreePlan() {
    if (!user) {
      toast.create({ title: "Please log in first.", type: "error" });
      return;
    }

    setClaimLoading(true);
    try {
      // Step 1: Get signed token
      const prepareRes = await fetch("/api/ad-session/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          rewardType: "free-power",
          amount: 0, // Free plan, no direct reward
        }),
      });

      const prepareData = await prepareRes.json();
      
      if (!prepareData.success || !prepareData.token) {
        toast.create({ title: "Failed to prepare", type: "error" });
        setClaimLoading(false);
        return;
      }

      // Step 2: Show ad first
      toast.create({ title: "Watch a short ad to claim free power", type: "info" });
      const watched = await showAd();

      if (!watched) {
        toast.create({ title: "Please watch the ad to claim", type: "warning" });
        setClaimLoading(false);
        return;
      }

      // Step 3: Verify token
      const verifyRes = await fetch("/api/ad-session/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: prepareData.token }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyData.valid) {
        toast.create({ title: "Verification failed", type: "error" });
        setClaimLoading(false);
        return;
      }

      // Step 4: Claim free plan
      const res = await fetch("/api/purchase/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.create({ title: data.error ?? "Failed to claim free plan.", type: "error" });
        return;
      }

      await refresh();

      toast.create({ title: "Free plan activated!", description: "Your mining has started.", type: "success" });
    } catch (error) {
      console.error("claimFreePlan error:", error);
      toast.create({ title: "Something went wrong.", description: "Please try again.", type: "error" });
    } finally {
      setClaimLoading(false);
    }
  }

  const quickActions: QuickAction[] = [
    {
      id: "buy-power-btn",
      label: "Buy POWER",
      icon: "fa-solid fa-bolt",
      variant: "primary",
      onClick: () => router.push("/shop"),
    },
    {
      id: "free-power-btn",
      label: claimLoading ? "Loading..." : "Free POWER",
      icon: "fa-solid fa-gift",
      variant: "secondary",
      onClick: claimFreePlan,
    },
  ];

  return (
    <div
      className="flex flex-col min-h-full w-full pb-20"
      style={{ background: "var(--background)" }}
    >
      <TopBar />

      <div className="flex flex-col items-center pt-6 pb-4">
        <MiningRing />
        <HashCounter />
      </div>

      <StatsBar />
      <ContractSection />
      <DailyAdBonus />
      <SwapCard />
      <QuickActions actions={quickActions} />
    </div>
  );
}
