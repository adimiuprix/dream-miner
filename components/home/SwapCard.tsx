"use client";

import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function SwapCard() {
  const { user } = useAuth();
  const [isSwapping, setIsSwapping] = useState(false);

  const handleSwap = async () => {
    if (!user?.id) {
      alert("Please log in first");
      return;
    }

    try {
      setIsSwapping(true);

      // Get swap preview
      const previewRes = await fetch(`/api/swap?userId=${user.id}`);
      const previewData = await previewRes.json();

      if (!previewData.success) {
        alert("Failed to get swap preview");
        return;
      }

      const { preview } = previewData;

      if (!preview.canSwap) {
        alert(
          `Insufficient hashes. You need at least ${preview.minimumRequired} HASHES.\n` +
          `You have ${preview.currentHashes.toFixed(2)} HASHES.`
        );
        return;
      }

      // Confirm swap
      const confirmed = confirm(
        `Swap ${preview.currentHashes.toFixed(2)} HASHES for ${preview.estimatedTon.toFixed(4)} TON?\n\n` +
        `Exchange rate: 1 HASH = ${preview.exchangeRate} TON\n` +
        `Current TON balance: ${preview.currentTonBalance.toFixed(4)} TON`
      );

      if (!confirmed) {
        return;
      }

      // Perform swap
      const swapRes = await fetch("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const swapData = await swapRes.json();

      if (!swapData.success) {
        alert("Swap failed: " + (swapData.error || "Unknown error"));
        return;
      }

      // Success
      alert(
        `✅ Success!\n\n` +
        `Swapped: ${swapData.swap.hashesSwapped.toFixed(2)} HASHES\n` +
        `Received: ${swapData.swap.tonReceived.toFixed(4)} TON\n` +
        `New balance: ${swapData.swap.newTonBalance.toFixed(4)} TON`
      );

      // Reload to show updated balances
      window.location.reload();
    } catch (error: any) {
      console.error("Swap error:", error);
      alert("Failed to swap: " + error.message);
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="px-4 mb-3">
      <button
        id="swap-hashes-btn"
        onClick={handleSwap}
        disabled={isSwapping}
        className="w-full flex items-center gap-3 text-left transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{
          background: "linear-gradient(90deg, #0c2b20 0%, #081a14 100%)",
          border: "1px solid rgba(0,212,170,0.18)",
          borderRadius: "14px",
          padding: "14px 16px",
        }}
      >
        {/* Reload icon */}
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{
            width: 36,
            height: 36,
            background: "rgba(0,212,170,0.1)",
            border: "1px solid rgba(0,212,170,0.2)",
          }}
        >
          {isSwapping ? (
            <div
              className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--dm-green)", borderTopColor: "transparent" }}
            />
          ) : (
            <Image
              src="/reload.svg"
              alt="swap"
              width={18}
              height={18}
              style={{
                filter:
                  "invert(66%) sepia(98%) saturate(400%) hue-rotate(120deg) brightness(1.1)",
              }}
            />
          )}
        </div>

        <div className="flex-1">
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>
            {isSwapping ? "SWAPPING..." : "SWAP HASHES → TON"}
          </p>
          <p style={{ fontSize: "11px", color: "#5a8a75", marginTop: 2 }}>
            Convert all your HASHES to TON
          </p>
        </div>

        <i
          className="fa-solid fa-chevron-right"
          style={{ color: "#3a5a4a", fontSize: "12px" }}
        />
      </button>
    </div>
  );
}
