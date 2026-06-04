"use client";

import { useState } from "react";

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<"members" | "power-log">("members");

  return (
    <div className="flex flex-col min-h-full px-4 pt-4" style={{ background: "var(--background)" }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>Team</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6b6b6b" }}>Grow your network, earn more.</p>
        </div>
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            width: 44, height: 44,
            background: "rgba(0,212,170,0.08)",
            border: "1px solid rgba(0,212,170,0.2)",
          }}
        >
          <i className="fa-solid fa-users" style={{ color: "var(--dm-green)", fontSize: "20px" }} />
        </div>
      </div>

      {/* Bonus cards */}
      <div
        className="rounded-2xl mb-4 overflow-hidden"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Referral bonus */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 36, height: 36, background: "rgba(0,212,170,0.12)", border: "1px solid rgba(0,212,170,0.2)" }}>
            <i className="fa-solid fa-gift" style={{ color: "var(--dm-green)", fontSize: "15px" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#fff" }}>Referral Bonus</p>
            <p className="text-xs mt-0.5" style={{ color: "#6b6b6b" }}>For each referred user</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-extrabold" style={{ color: "var(--dm-green)" }}>+2,000</p>
            <p className="text-xs" style={{ color: "#555" }}>POWER</p>
          </div>
        </div>

        {/* Premium bonus */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 36, height: 36, background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.2)" }}>
            <i className="fa-solid fa-gem" style={{ color: "#f5a623", fontSize: "15px" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#fff" }}>Premium Bonus</p>
            <p className="text-xs mt-0.5" style={{ color: "#6b6b6b" }}>For each premium user</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-extrabold" style={{ color: "#f5a623" }}>+4,000</p>
            <p className="text-xs" style={{ color: "#555" }}>POWER</p>
          </div>
        </div>

        {/* Commission */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 36, height: 36, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <i className="fa-solid fa-percent" style={{ color: "#a3a3a3", fontSize: "15px" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#fff" }}>Commission</p>
            <p className="text-xs mt-0.5" style={{ color: "#6b6b6b" }}>on purchases</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-extrabold" style={{ color: "#fff" }}>10%</p>
            <p className="text-xs" style={{ color: "#555" }}>COMM.</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div
        className="grid grid-cols-2 gap-0 rounded-2xl mb-4 overflow-hidden"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Referred */}
        <div className="flex items-center gap-3 px-4 py-4" style={{ borderRight: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-center rounded-full"
            style={{ width: 34, height: 34, background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)" }}>
            <i className="fa-solid fa-user-plus" style={{ color: "var(--dm-green)", fontSize: "13px" }} />
          </div>
          <div>
            <p className="text-lg font-extrabold" style={{ color: "#fff" }}>0</p>
            <p className="text-xs" style={{ color: "#6b6b6b" }}>Referred</p>
          </div>
        </div>

        {/* Valid */}
        <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-center rounded-full"
            style={{ width: 34, height: 34, background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)" }}>
            <i className="fa-solid fa-shield-check" style={{ color: "var(--dm-green)", fontSize: "13px" }} />
          </div>
          <div>
            <p className="text-lg font-extrabold" style={{ color: "#fff" }}>0</p>
            <p className="text-xs" style={{ color: "#6b6b6b" }}>Valid</p>
          </div>
        </div>

        {/* Pending */}
        <div className="flex items-center gap-3 px-4 py-4" style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-center rounded-full"
            style={{ width: 34, height: 34, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)" }}>
            <i className="fa-regular fa-clock" style={{ color: "#f5a623", fontSize: "13px" }} />
          </div>
          <div>
            <p className="text-lg font-extrabold" style={{ color: "#f5a623" }}>0</p>
            <p className="text-xs" style={{ color: "#6b6b6b" }}>Pending</p>
          </div>
        </div>

        {/* Power */}
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex items-center justify-center rounded-full"
            style={{ width: 34, height: 34, background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)" }}>
            <i className="fa-solid fa-bolt" style={{ color: "var(--dm-green)", fontSize: "13px" }} />
          </div>
          <div>
            <p className="text-lg font-extrabold" style={{ color: "var(--dm-green)" }}>0.00</p>
            <p className="text-xs" style={{ color: "#6b6b6b" }}>POWER</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          id="get-referrals-btn"
          className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all hover:opacity-90 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #00d4aa 0%, #00b890 100%)",
            color: "#050505",
          }}
        >
          <i className="fa-solid fa-paper-plane" />
          Get Referrals
        </button>
        <button
          id="copy-link-btn"
          className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all"
          style={{
            background: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#a3a3a3",
          }}
        >
          <i className="fa-regular fa-copy" />
          Copy Link
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 mb-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {(["members", "power-log"] as const).map((tab) => (
          <button
            key={tab}
            id={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className="py-3 text-sm font-semibold capitalize transition-colors"
            style={{
              color: activeTab === tab ? "var(--dm-green)" : "#555",
              borderBottom: activeTab === tab ? "2px solid var(--dm-green)" : "2px solid transparent",
            }}
          >
            {tab === "members" ? "Members" : "POWER Log"}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 64, height: 64,
            background: "rgba(0,212,170,0.08)",
            border: "1px solid rgba(0,212,170,0.15)",
          }}
        >
          <i className="fa-solid fa-box-open" style={{ color: "var(--dm-green)", fontSize: "26px" }} />
        </div>
        <p className="font-bold" style={{ color: "#fff" }}>No referrals yet</p>
        <p className="text-sm text-center" style={{ color: "#6b6b6b" }}>
          Share your link and start building your team!
        </p>
      </div>
    </div>
  );
}
