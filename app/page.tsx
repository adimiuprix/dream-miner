"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MiningRing from "@/components/MiningRing";
import TopBar from "@/components/TopBar";
import dynamic from "next/dynamic";

const HashCounter = dynamic(() => import("@/components/HashCounter"), { ssr: false });

import StatsBar from "@/components/StatsBar";
import ContractSection from "@/components/ContractSection";
import SwapCard from "@/components/SwapCard";
import QuickActions, { QuickAction } from "@/components/QuickActions";
import { useAuth } from "@/components/AuthProvider";
import { useMining } from "@/components/MiningProvider";

export default function HomePage() {
  const { user } = useAuth();
  const { refresh } = useMining();
  const router = useRouter();
  const [claimLoading, setClaimLoading] = useState(false);

  async function claimFreePlan() {
    if (!user) {
      alert("Kamu harus login terlebih dahulu.");
      return;
    }

    setClaimLoading(true);
    try {
      const res = await fetch("/api/purchase/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error ?? "Gagal mengklaim free plan.");
        return;
      }

      // Refresh mining stats secara langsung tanpa reload halaman
      await refresh();

      alert("Free plan berhasil diaktifkan!");
    } catch (error) {
      console.error("claimFreePlan error:", error);
      alert("Terjadi kesalahan saat mengklaim free plan.");
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
      <SwapCard />
      <QuickActions actions={quickActions} />
    </div>
  );
}
