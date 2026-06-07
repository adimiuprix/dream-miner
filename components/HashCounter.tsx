"use client";

import { useEffect, useRef, useState } from "react";
import { useMining } from "@/components/MiningProvider";

export default function HashCounter() {
  const { stats, isLoading } = useMining();
  const [balance, setBalance] = useState(0);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const initialBalanceRef = useRef<number>(0);

  // Setiap kali stats diperbarui (termasuk setelah refresh), reset baseline counter
  useEffect(() => {
    if (!stats) return;
    initialBalanceRef.current = stats.currentHashes;
    startTimeRef.current = Date.now();
    setBalance(stats.currentHashes);
  }, [stats]);

  // Animasi real-time berdasarkan miningRate dari context
  useEffect(() => {
    if (!stats || stats.miningRate === 0) return;

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setBalance(initialBalanceRef.current + elapsed * stats.miningRate);
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [stats?.miningRate]);

  if (isLoading) {
    return (
      <div className="mt-5 flex flex-col items-center gap-1">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--dm-green)", borderTopColor: "transparent" }}
        />
        <p style={{ fontSize: "13px", color: "#666" }}>Loading mining stats...</p>
      </div>
    );
  }

  const estimatedTon = (balance * 0.0001).toFixed(8);
  const rate = stats?.miningRate ?? 0;

  return (
    <div className="mt-5 flex flex-col items-center gap-1">
      <p
        id="hash-counter"
        style={{
          fontSize: "36px",
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "0.05em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          animation: "dm-counter-glow 3s ease-in-out infinite",
        }}
      >
        {balance.toFixed(8)}
      </p>
      <p style={{ fontSize: "13px", color: "#666", marginTop: 4 }}>HASHES mined</p>
      <p style={{ fontSize: "11px", color: "#3a3a3a" }}>
        ≈ {estimatedTon} TON at current rate
      </p>
      {rate > 0 && (
        <p style={{ fontSize: "10px", color: "var(--dm-green)", marginTop: 2 }}>
          +{rate.toFixed(2)} H/s
        </p>
      )}
    </div>
  );
}
