"use client";

import MiningRing from "@/components/MiningRing";
import TopBar from "@/components/home/TopBar";
import dynamic from "next/dynamic";

const HashCounter = dynamic(() => import("@/components/home/HashCounter"), { ssr: false });

import StatsBar from "@/components/home/StatsBar";
import ContractSection from "@/components/home/ContractSection";
import SwapCard from "@/components/home/SwapCard";
import QuickActions from "@/components/home/QuickActions";

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
      <QuickActions />
    </div>
  );
}
