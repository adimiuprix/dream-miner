"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function HashCounter() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [miningRate, setMiningRate] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const initialBalanceRef = useRef<number>(0);

  // Fetch mining stats on mount
  useEffect(() => {
    if (!user?.id) return;

    const fetchMiningStats = async () => {
      try {
        const response = await fetch("/api/mining/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });

        const data = await response.json();

        if (data.success) {
          const { currentHashes, miningRate: rate, offlineHashes } = data.stats;
          
          // Show offline mining notification
          if (offlineHashes > 0) {
            console.log(`[Mining] Earned ${offlineHashes.toFixed(2)} hashes while offline`);
          }

          setBalance(currentHashes);
          setMiningRate(rate);
          initialBalanceRef.current = currentHashes;
          startTimeRef.current = Date.now();
        }
      } catch (error) {
        console.error("[Mining] Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMiningStats();

    // Sync to database every 30 seconds
    const syncInterval = setInterval(() => {
      fetchMiningStats();
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [user?.id]);

  // Real-time counter animation
  useEffect(() => {
    if (miningRate === 0) return;

    const animate = () => {
      const now = Date.now();
      const elapsedSeconds = (now - startTimeRef.current) / 1000;
      
      const newBalance = initialBalanceRef.current + elapsedSeconds * miningRate;
      setBalance(newBalance);

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [miningRate]);

  const estimatedTon = (balance * 0.0001).toFixed(8);

  if (isLoading) {
    return (
      <div className="mt-5 flex flex-col items-center gap-1">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--dm-green)", borderTopColor: "transparent" }}
        />
        <p style={{ fontSize: "13px", color: "#666" }}>Loading mining stats...</p>
      </div>
    );
  }

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
      {miningRate > 0 && (
        <p style={{ fontSize: "10px", color: "var(--dm-green)", marginTop: 2 }}>
          +{miningRate.toFixed(2)} H/s
        </p>
      )}
    </div>
  );
}
