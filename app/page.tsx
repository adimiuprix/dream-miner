"use client";

import MiningRing from "@/components/MiningRing";
import TopBar from "@/components/TopBar";
import dynamic from "next/dynamic";

const HashCounter = dynamic(() => import("@/components/HashCounter"), { ssr: false });

import StatsBar from "@/components/StatsBar";
import ContractSection from "@/components/ContractSection";
import SwapCard from "@/components/SwapCard";
import QuickActions, { QuickAction } from "@/components/QuickActions";

const quickActions: QuickAction[] = [
  {
    id: "buy-power-btn",
    label: "Buy POWER",
    icon: "fa-solid fa-bolt",
    variant: "primary",
    onClick: () => {
      // TODO: handle buy power
    },
  },
  {
    id: "free-power-btn",
    label: "Free POWER",
    icon: "fa-solid fa-gift",
    variant: "secondary",
    onClick: () => {
      // TODO: handle free power
    },
  },
];

export default function HomePage() {
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
