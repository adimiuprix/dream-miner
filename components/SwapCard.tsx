"use client";

import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { SwapModal } from "./SwapModal";

export default function SwapCard() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    if (!user?.id) {
      alert("Please log in first");
      return;
    }
    if (!user.walletAddress) {
      alert("⚠️ No wallet connected.\n\nPlease connect your TON wallet first before swapping.");
      return;
    }
    setIsModalOpen(true);
  };

  const handleSwapComplete = () => {
    // Reload to show updated balances
    window.location.reload();
  };

  return (
    <>
      <div className="px-4 mb-3">
        <button
          id="swap-hashes-btn"
          onClick={handleOpenModal}
          className="w-full flex items-center gap-3 text-left transition-opacity hover:opacity-90"
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
          </div>

          <div className="flex-1">
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>
              SWAP HASHES → TON
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

      {/* Swap Modal */}
      {user?.id && (
        <SwapModal
          open={isModalOpen}
          onOpenChange={(details) => setIsModalOpen(details.open)}
          userId={user.id}
          onSwapComplete={handleSwapComplete}
        />
      )}
    </>
  );
}
