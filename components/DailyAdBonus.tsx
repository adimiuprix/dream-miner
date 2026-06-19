"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { useAds } from "./AdsgramProvider";
import { toast } from "./ui/toast";

export default function DailyAdBonus() {
  const { user } = useAuth();
  const { showAd } = useAds();
  const [canWatch, setCanWatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!user?.id) return;
    checkEligibility();
  }, [user?.id]);

  const checkEligibility = async () => {
    if (!user?.id) return;
    
    try {
      const res = await fetch(`/api/daily-ad/prepare?userId=${user.id}`);
      const data = await res.json();
      
      if (data.canWatch) {
        setCanWatch(true);
      } else if (data.nextAvailableAt) {
        setCanWatch(false);
        updateCountdown(data.nextAvailableAt);
      }
    } catch (error) {
      console.error("Failed to check eligibility:", error);
    }
  };

  const updateCountdown = (nextTime: number) => {
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = nextTime - now;
      
      if (diff <= 0) {
        setCanWatch(true);
        setTimeLeft("");
        clearInterval(interval);
        return;
      }
      
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${hours}h ${mins}m`);
    }, 1000);
    
    return () => clearInterval(interval);
  };

  const handleWatch = async () => {
    if (!user?.id || loading) return;

    setLoading(true);
    try {
      // Step 1: Get signed token
      const prepareRes = await fetch(`/api/daily-ad/prepare?userId=${user.id}`);
      const prepareData = await prepareRes.json();

      if (!prepareData.canWatch || !prepareData.token) {
        toast.create({ title: prepareData.error || "Cannot watch ad now", type: "error" });
        setLoading(false);
        return;
      }

      // Step 2: Show ad
      const watched = await showAd();
      
      if (!watched) {
        toast.create({ title: "Ad skipped", description: "Please watch the full ad", type: "warning" });
        setLoading(false);
        return;
      }

      // Step 3: Claim reward with token
      const claimRes = await fetch("/api/daily-ad/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: prepareData.token }),
      });

      const claimData = await claimRes.json();

      if (claimData.success) {
        toast.create({ 
          title: "Reward earned!", 
          description: `+${claimData.reward.toLocaleString()} POWER`,
          type: "success" 
        });
        setCanWatch(false);
        checkEligibility();
      } else {
        toast.create({ title: claimData.error || "Failed to claim", type: "error" });
      }
    } catch (error) {
      console.error("Watch ad error:", error);
      toast.create({ title: "Something went wrong", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!canWatch && !timeLeft) return null;

  return (
    <div className="px-4 mb-3">
      <button
        onClick={handleWatch}
        disabled={!canWatch || loading}
        className="w-full flex items-center gap-3 text-left transition-all hover:opacity-90 disabled:opacity-60"
        style={{
          background: "linear-gradient(90deg, #2b1a0c 0%, #1a140a 100%)",
          border: "1px solid rgba(245,166,35,0.18)",
          borderRadius: "14px",
          padding: "14px 16px",
        }}
      >
        {/* Icon */}
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{
            width: 36,
            height: 36,
            background: "rgba(245,166,35,0.1)",
            border: "1px solid rgba(245,166,35,0.2)",
          }}
        >
          <i className="fa-solid fa-play-circle" style={{ color: "#f5a623", fontSize: 18 }} />
        </div>

        {/* Text */}
        <div className="flex-1">
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>
            {canWatch ? "WATCH AD FOR 1,000 POWER" : `NEXT AD IN ${timeLeft}`}
          </p>
          <p style={{ fontSize: "11px", color: "#8a6a3a", marginTop: 2 }}>
            {canWatch ? "Daily bonus - Available now!" : "Come back later for more"}
          </p>
        </div>

        {/* Arrow */}
        {canWatch && (
          <i className="fa-solid fa-chevron-right" style={{ color: "#5a4a2a", fontSize: "12px" }} />
        )}
      </button>
    </div>
  );
}
