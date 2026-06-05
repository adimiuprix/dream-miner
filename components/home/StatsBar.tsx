"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function StatsBar() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    miningRate: 0,
    power: 0,
    nextExpiry: null as Date | null,
  });

  useEffect(() => {
    if (!user?.id) return;

    const fetchStats = async () => {
      try {
        // Get mining stats
        const response = await fetch(`/api/mining/sync?userId=${user.id}`);
        const data = await response.json();

        if (data.success) {
          // Get next expiry from contracts
          const contractsRes = await fetch(`/api/contracts?userId=${user.id}`);
          const contractsData = await contractsRes.json();

          let nextExpiry = null;
          if (contractsData.success && contractsData.contracts.length > 0) {
            // Find earliest expiry
            const expiryDates = contractsData.contracts
              .filter((c: any) => c.status === "ACTIVE")
              .map((c: any) => new Date(c.expiresAt));
            
            if (expiryDates.length > 0) {
              nextExpiry = new Date(Math.min(...expiryDates.map((d: Date) => d.getTime())));
            }
          }

          setStats({
            miningRate: data.stats.miningRate * 86400, // Convert to per day
            power: data.stats.totalPower,
            nextExpiry,
          });
        }
      } catch (error) {
        console.error("[StatsBar] Fetch error:", error);
      }
    };

    fetchStats();

    // Update every minute
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const formatExpiry = (date: Date | null) => {
    if (!date) return "—";
    
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return "Expired";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `${days}d`;
  };

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
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>
                <span style={{ color: "var(--dm-green)" }}>
                  {stats.miningRate.toFixed(1)}
                </span>
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
              {stats.power >= 1000000
                ? `${(stats.power / 1000000).toFixed(1)}M`
                : stats.power >= 1000
                ? `${(stats.power / 1000).toFixed(1)}K`
                : stats.power}
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
                color: stats.nextExpiry ? "#fff" : "#555",
              }}
            >
              {formatExpiry(stats.nextExpiry)}
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
