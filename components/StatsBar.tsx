"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useMining } from "@/components/MiningProvider";

export default function StatsBar() {
  const { user } = useAuth();
  const { stats } = useMining();
  const [nextExpiry, setNextExpiry] = useState<Date | null>(null);

  // Fetch next expiry dari contracts setiap kali stats berubah
  useEffect(() => {
    if (!user?.id || !stats) return;

    const fetchExpiry = async () => {
      try {
        const res = await fetch(`/api/contracts?userId=${user.id}`);
        const data = await res.json();

        if (data.success && data.contracts.length > 0) {
          const dates: number[] = data.contracts
            .filter((c: any) => c.status === "ACTIVE")
            .map((c: any) => new Date(c.expiresAt).getTime());

          setNextExpiry(dates.length > 0 ? new Date(Math.min(...dates)) : null);
        } else {
          setNextExpiry(null);
        }
      } catch (err) {
        console.error("[StatsBar] fetch error:", err);
      }
    };

    fetchExpiry();
  }, [user?.id, stats]);

  const formatExpiry = (date: Date | null) => {
    if (!date) return "—";
    const diff = date.getTime() - Date.now();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return "Expired";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `${days}d`;
  };

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

          {/* Next expiry */}
          <div className="flex flex-col items-center justify-center py-3.5">
            <span
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: nextExpiry ? "#fff" : "#555",
              }}
            >
              {formatExpiry(nextExpiry)}
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
