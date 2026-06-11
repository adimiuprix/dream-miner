"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import SubPageHeader from "../_components/SubPageHeader";

export default function InvitePage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [botUsername, setBotUsername] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (data?.config?.botUsername) {
          setBotUsername(data.config.botUsername);
        }
      })
      .catch((err) => console.error("[InvitePage] Failed to fetch config:", err));
  }, []);

  const referralLink =
    botUsername && user?.referralCode
      ? `https://t.me/${botUsername}/app?startapp=${user.referralCode}`
      : "";

  async function handleCopy() {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
    } catch {
      const el = document.createElement("textarea");
      el.value = referralLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShare() {
    if (!referralLink) return;
    const text = encodeURIComponent(`Join Dream Miner and start earning TON!\n${referralLink}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, "_blank");
  }

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-20" style={{ background: "var(--background)" }}>
      <SubPageHeader
        title="Invite Friends"
        description="Earn POWER for every referral"
        icon="fa-solid fa-user-plus"
        iconColor="#f5a623"
        iconBg="rgba(245,166,35,0.12)"
        iconBorder="rgba(245,166,35,0.2)"
      />

      {/* Hero */}
      <div
        className="rounded-2xl p-5 flex flex-col items-center gap-3 mb-4 text-center"
        style={{ background: "linear-gradient(135deg, #1a1200 0%, #0d0d0d 100%)", border: "1px solid rgba(245,166,35,0.25)" }}
      >
        <div className="flex items-center justify-center rounded-full"
          style={{ width: 60, height: 60, background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)" }}>
          <i className="fa-solid fa-user-plus" style={{ color: "#f5a623", fontSize: "24px" }} />
        </div>
        <div>
          <p className="text-lg font-extrabold" style={{ color: "#fff" }}>Invite & Earn</p>
          <p className="text-xs mt-1" style={{ color: "#6b6b6b" }}>
            Get POWER bonuses when friends join and buy plans
          </p>
        </div>
      </div>

      {/* Bonus cards */}
      <div
        className="rounded-2xl mb-4 overflow-hidden"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 36, height: 36, background: "rgba(0,212,170,0.12)", border: "1px solid rgba(0,212,170,0.2)" }}>
            <i className="fa-solid fa-gift" style={{ color: "var(--dm-green)", fontSize: "15px" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#fff" }}>Join Bonus</p>
            <p className="text-xs mt-0.5" style={{ color: "#6b6b6b" }}>When your friend joins</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-extrabold" style={{ color: "var(--dm-green)" }}>+2,000</p>
            <p className="text-xs" style={{ color: "#555" }}>POWER</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 36, height: 36, background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.2)" }}>
            <i className="fa-solid fa-gem" style={{ color: "#f5a623", fontSize: "15px" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#fff" }}>Purchase Bonus</p>
            <p className="text-xs mt-0.5" style={{ color: "#6b6b6b" }}>When friend buys a plan</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-extrabold" style={{ color: "#f5a623" }}>+50%</p>
            <p className="text-xs" style={{ color: "#555" }}>OF POWER</p>
          </div>
        </div>
      </div>

      {/* Referral link */}
      <div
        className="rounded-2xl p-4 mb-4"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-xs font-semibold mb-2" style={{ color: "#555", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Your referral link
        </p>
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="flex-1 text-xs font-mono truncate" style={{ color: "#888" }}>
            {referralLink || "Loading..."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleShare}
            disabled={!referralLink}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #00d4aa 0%, #00b890 100%)", color: "#050505" }}
          >
            <i className="fa-solid fa-paper-plane" />
            Share
          </button>
          <button
            onClick={handleCopy}
            disabled={!referralLink}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.08)",
              color: copied ? "var(--dm-green)" : "#a3a3a3",
            }}
          >
            <i className={copied ? "fa-solid fa-check" : "fa-regular fa-copy"} />
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </div>

      {/* Code */}
      {user?.referralCode && (
        <p className="text-center text-xs" style={{ color: "#444" }}>
          Code: <span className="font-mono" style={{ color: "#666" }}>{user.referralCode}</span>
        </p>
      )}
    </div>
  );
}
