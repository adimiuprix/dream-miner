"use client";

import { useEffect, useRef, useState } from "react";

interface HashCounterProps {
  initialBalance?: number;
  miningRatePerSecond?: number;
  exchangeRate?: number;
}

export default function HashCounter({
  initialBalance = 1500.5,
  miningRatePerSecond = 2.5,
  exchangeRate = 0.0001, // 1 HASH = 0.0001 TON
}: HashCounterProps) {
  const [balance, setBalance] = useState(initialBalance);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Reset starting time whenever component mounts or config changes
    startTimeRef.current = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsedSeconds = (now - startTimeRef.current) / 1000;
      
      const newBalance = initialBalance + elapsedSeconds * miningRatePerSecond;
      setBalance(newBalance);

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [initialBalance, miningRatePerSecond]);

  const estimatedTon = (balance * exchangeRate).toFixed(8);

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
    </div>
  );
}
