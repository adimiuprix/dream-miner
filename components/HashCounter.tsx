"use client";

import { useEffect, useRef, useState } from "react";
import { hashesToTon } from "@/lib/exchangeRate";
import { useMining } from "@/components/MiningProvider";

export default function HashCounter() {
  const { stats, isLoading } = useMining();
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  // Setiap kali stats diperbarui dari server, reset baseline animasi
  useEffect(() => {
    if (!stats) return;

    // Baseline = hashes tersimpan di DB + hashes pending sejak lastSyncAt
    const base = stats.currentHashes + stats.pendingHashes;
    const syncedAt = new Date(stats.lastSyncAt).getTime();
    const rate = stats.miningRate;

    // Batalkan frame sebelumnya
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const animate = () => {
      const elapsed = (Date.now() - syncedAt) / 1000;
      setDisplay(base + elapsed * rate);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [stats]);

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

  const estimatedTon = hashesToTon(display).toFixed(8);
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
        {display.toFixed(8)}
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
