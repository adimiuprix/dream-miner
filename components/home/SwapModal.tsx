"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogBody,
} from "@/components/ui/dialog";
import { AlertTriangle, User, ArrowDownUp, Shield } from "lucide-react";

interface SwapPreview {
  canSwap: boolean;
  currentHashes: number;
  currentTonBalance: number;
  estimatedTon: number;
  exchangeRate: number;
  minimumRequired: number;
}

interface SwapModalProps {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  userId: string;
  onSwapComplete?: () => void;
}

export function SwapModal({ open, onOpenChange, userId, onSwapComplete }: SwapModalProps) {
  const [preview, setPreview] = useState<SwapPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch swap preview when modal opens
  useEffect(() => {
    if (open && userId) {
      fetchSwapPreview();
    }
  }, [open, userId]);

  const fetchSwapPreview = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`/api/swap?userId=${userId}`);
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to load swap preview");
        return;
      }

      setPreview(data.preview);
    } catch (err: any) {
      console.error("Failed to fetch swap preview:", err);
      setError("Failed to load swap preview");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!preview?.canSwap) return;

    try {
      setIsSwapping(true);

      const res = await fetch("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Swap failed");
        return;
      }

      // Success - close modal and notify parent
      onOpenChange({ open: false });
      onSwapComplete?.();
      
      // Optional: Show success message
      setTimeout(() => {
        alert(
          `✅ Success!\n\n` +
          `Swapped: ${data.swap.hashesSwapped.toFixed(2)} HASHES\n` +
          `Received: ${data.swap.tonReceived.toFixed(4)} TON\n` +
          `New balance: ${data.swap.newTonBalance.toFixed(4)} TON`
        );
      }, 100);
    } catch (err: any) {
      console.error("Swap error:", err);
      setError(err.message || "Failed to swap");
    } finally {
      setIsSwapping(false);
    }
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      lazyMount
      unmountOnExit
    >
      <DialogContent
        size="md"
        showCloseButton={true}
        bottomStickOnMobile={true}
        className="!bg-[#0a1612] !border-[#1a3329]"
      >
        <DialogBody scrollFade={false} className="!p-0">
          <div className="relative px-4 pb-4">
            {/* Header with glowing icon */}
            <div className="flex flex-col items-center pt-8 pb-6">
          {/* Glowing TON Icon */}
          <div className="relative mb-6">
            {/* Outer glow */}
            <div className="absolute inset-0 rounded-full blur-2xl opacity-30"
              style={{ background: "radial-gradient(circle, #00d4aa 0%, transparent 70%)" }}
            />
            {/* Middle glow */}
            <div className="absolute inset-[-20px] rounded-full blur-xl opacity-20"
              style={{ background: "radial-gradient(circle, #00d4aa 0%, transparent 70%)" }}
            />
            {/* Icon container */}
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #0c2b20 0%, #081a14 100%)",
                border: "2px solid rgba(0, 212, 170, 0.3)",
                boxShadow: "0 0 30px rgba(0, 212, 170, 0.2), inset 0 0 20px rgba(0, 212, 170, 0.1)"
              }}
            >
              <div className="w-14 h-14 rounded-full bg-[#0088cc] flex items-center justify-center">
                <span className="text-2xl font-bold text-white">◇</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">
            Swap HASHES → TON
          </h2>
          <p className="text-sm text-gray-400">
            Convert your mined balance into TON instantly.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4 px-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-[#00d4aa] border-t-transparent animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchSwapPreview}
                className="text-[#00d4aa] text-sm hover:underline"
              >
                Try again
              </button>
            </div>
          ) : preview ? (
            <>
              {/* You'll receive box */}
              <div
                className="rounded-2xl p-5 border"
                style={{
                  background: "linear-gradient(135deg, rgba(0, 212, 170, 0.08) 0%, rgba(0, 212, 170, 0.03) 100%)",
                  borderColor: "rgba(0, 212, 170, 0.2)",
                }}
              >
                <p className="text-[#00d4aa] text-sm font-medium mb-2">
                  You'll receive
                </p>
                <p className="text-[#00d4aa] text-3xl font-bold tracking-tight">
                  ≈ {formatNumber(preview.estimatedTon, 8)} TON
                </p>
              </div>

              {/* Info boxes */}
              <div
                className="rounded-2xl p-4 space-y-3 border"
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  borderColor: "rgba(255, 255, 255, 0.05)",
                }}
              >
                {/* Your balance */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#00d4aa]/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-[#00d4aa]" />
                    </div>
                    <span className="text-gray-400 text-sm">Your balance</span>
                  </div>
                  <span className="text-[#0088cc] font-semibold text-sm">
                    {formatNumber(preview.currentHashes, 8)} HASHES
                  </span>
                </div>

                {/* Rate */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#00d4aa]/10 flex items-center justify-center">
                      <ArrowDownUp className="w-4 h-4 text-[#00d4aa]" />
                    </div>
                    <span className="text-gray-400 text-sm">Rate</span>
                  </div>
                  <span className="text-white font-semibold text-sm">
                    1,000 HASHES = {formatNumber(preview.exchangeRate * 1000, 8)} TON
                  </span>
                </div>

                {/* Minimum swap */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#00d4aa]/10 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-[#00d4aa]" />
                    </div>
                    <span className="text-gray-400 text-sm">Minimum swap</span>
                  </div>
                  <span className="text-white font-semibold text-sm">
                    {formatNumber(preview.minimumRequired, 0)} HASHES
                  </span>
                </div>
              </div>

              {/* Warning box */}
              <div
                className="rounded-xl p-4 border flex items-start gap-3"
                style={{
                  background: "rgba(234, 179, 8, 0.05)",
                  borderColor: "rgba(234, 179, 8, 0.2)",
                }}
              >
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-200/90 text-sm leading-relaxed">
                  Your HASHES balance will be fully cleared on swap.
                </p>
              </div>

              {/* Continue button */}
              <button
                onClick={handleSwap}
                disabled={!preview.canSwap || isSwapping}
                className="w-full py-4 rounded-xl font-bold text-white text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: preview.canSwap 
                    ? "linear-gradient(135deg, #00d4aa 0%, #00a887 100%)"
                    : "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
                  boxShadow: preview.canSwap 
                    ? "0 4px 20px rgba(0, 212, 170, 0.3)"
                    : "none",
                }}
              >
                {isSwapping ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Swapping...
                  </span>
                ) : !preview.canSwap ? (
                  `Insufficient Balance (Min: ${formatNumber(preview.minimumRequired, 0)})`
                ) : (
                  <>Continue →</>
                )}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </DialogBody>
  </DialogContent>
</Dialog>
  );
}
