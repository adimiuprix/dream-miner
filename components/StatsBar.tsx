"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useMining } from "@/components/MiningProvider";

export default function StatsBar() {
  const { user } = useAuth();
  const { stats } = useMining();
  const [nextExpiryMs, setNextExpiryMs] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<string>("—");

  // Fetch next expiry dari contracts setiap kali stats berubah
  useEffect(() => {
    if (!user?.id || !stats) return;

    const fetchExpiry = async () => {
      try {
        const res = await fetch(`/api/contracts?userId=${user.id}`);
        const data = await res.json();

        if (data.success && data.contracts.length > 0) {
          const activeDates: number[] = data.contracts
            .filter((c: any) => c.status === "ACTIVE")
            .map((c: any) => c.expiresAt); // Already unix timestamp (number)

          setNextExpiryMs(activeDates.length > 0 ? Math.min(...activeDates) : null);
        } else {
          setNextExpiryMs(null);
        }
      } catch (err) {
        console.error("[StatsBar] fetch error:", err);
      }
    };

    fetchExpiry();
  }, [user?.id, stats]);

  // Countdown timer that updates every second
  useEffect(() => {
    if (!nextExpiryMs) {
      setCountdown("—");
      return;
    }

    const updateCountdown = () => {
      const nowMs = Date.now();
      const diffMs = nextExpiryMs - nowMs;

      if (diffMs <= 0) {
        setCountdown("Expired");
        return;
      }

      const seconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) {
        const remainingHours = hours % 24;
        setCountdown(`${days}d ${remainingHours}h`);
      } else if (hours > 0) {
        const remainingMinutes = minutes % 60;
        setCountdown(`${hours}h ${remainingMinutes}m`);
      } else if (minutes > 0) {
        const remainingSeconds = seconds % 60;
        setCountdown(`${minutes}m ${remainingSeconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [nextExpiryMs]);

  const power = stats?.totalPower ?? 0;
  const ratePerDay = (stats?.miningRate ?? 0) * 86400;

  return (
    <div className="px-4 mb-3">
      <div
        style={{
          background: "#141414",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        <div className="grid grid-cols-3">
          {/* Rate */}
          <div
            className="flex flex-col items-center justify-center py-3.5"
            style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-baseline gap-1">
              <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--dm-green)" }}>
                {ratePerDay.toFixed(1)}
              </span>
              <span style={{ fontSize: "11px", color: "#555" }}>H/day</span>
            </div>
            <span style={{ fontSize: "10px", color: "#444", marginTop: 3, letterSpacing: "0.04em" }}>
              Rate
            </span>
          </div>

          {/* Power */}
          <div
            className="flex flex-col items-center justify-center py-3.5"
            style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>
              {power >= 1_000_000
                ? `${(power / 1_000_000).toFixed(1)}M`
                : power >= 1_000
                ? `${(power / 1_000).toFixed(1)}K`
                : power}
            </span>
            <span style={{ fontSize: "10px", color: "#444", marginTop: 3, letterSpacing: "0.04em" }}>
              POWER
            </span>
          </div>

          {/* Next expiry countdown */}
          <div className="flex flex-col items-center justify-center py-3.5">
            <span
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: nextExpiryMs && countdown !== "Expired" ? "#fff" : "#555",
              }}
            >
              {countdown}
            </span>
            <span style={{ fontSize: "10px", color: "#444", marginTop: 3, letterSpacing: "0.04em" }}>
              Next expiry
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
