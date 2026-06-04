"use client";

import Image from "next/image";

import MiningRing from "@/components/MiningRing";

export default function HomePage() {
  return (
    <div
      className="flex flex-col min-h-full w-full"
      style={{ background: "var(--background)" }}
    >
      {/* Top right: lang selector */}
      <div className="flex justify-end px-3 pt-3">
        <button
          id="lang-selector"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
          style={{
            background: "#181818",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#888",
          }}
        >
          <i className="fa-solid fa-globe" style={{ color: "var(--dm-green)", fontSize: "11px" }} />
          EN
          <i className="fa-solid fa-chevron-down" style={{ fontSize: "8px" }} />
        </button>
      </div>

      <div className="flex flex-col items-center pt-6 pb-4">
        <MiningRing />

        {/* Hash counter — subtle glow pulse */}
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
            0.00000000
          </p>
          <p style={{ fontSize: "13px", color: "#666", marginTop: 4 }}>HASHES mined</p>
          <p style={{ fontSize: "11px", color: "#3a3a3a" }}>
            ≈ 0.00000000 TON at current rate
          </p>
        </div>
      </div>

      {/* ── Stats bar ── */}
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
                  <span style={{ color: "var(--dm-green)" }}>0</span>
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
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>0</span>
              <span style={{ fontSize: "10px", color: "#444", marginTop: 3, letterSpacing: "0.04em" }}>
                POWER
              </span>
            </div>

            {/* Next expiry */}
            <div className="flex flex-col items-center justify-center py-3.5">
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#555" }}>—</span>
              <span style={{ fontSize: "10px", color: "#444", marginTop: 3, letterSpacing: "0.04em" }}>
                Next expiry
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── YOUR CONTRACTS label ── */}
      <div className="px-4 mb-2">
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: "#404040",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          YOUR CONTRACTS
        </span>
      </div>

      {/* ── Swap card ── */}
      <div className="px-4 mb-3">
        <button
          id="swap-hashes-btn"
          className="w-full flex items-center gap-3 text-left transition-opacity hover:opacity-90"
          style={{
            background: "linear-gradient(90deg, #0c2b20 0%, #081a14 100%)",
            border: "1px solid rgba(0,212,170,0.18)",
            borderRadius: "14px",
            padding: "14px 16px",
          }}
        >
          {/* Reload icon */}
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{
              width: 36,
              height: 36,
              background: "rgba(0,212,170,0.1)",
              border: "1px solid rgba(0,212,170,0.2)",
            }}
          >
            <Image
              src="/reload.svg"
              alt="swap"
              width={18}
              height={18}
              style={{
                filter:
                  "invert(66%) sepia(98%) saturate(400%) hue-rotate(120deg) brightness(1.1)",
              }}
            />
          </div>

          <div className="flex-1">
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>
              SWAP HASHES → TON
            </p>
            <p style={{ fontSize: "11px", color: "#5a8a75", marginTop: 2 }}>
              Convert all your HASHES to TON
            </p>
          </div>

          <i
            className="fa-solid fa-chevron-right"
            style={{ color: "#3a5a4a", fontSize: "12px" }}
          />
        </button>
      </div>

      {/* ── Buy / Free POWER buttons ── */}
      <div className="px-4 grid grid-cols-2 gap-2.5">
        {/* Buy POWER */}
        <button
          id="buy-power-btn"
          className="flex items-center justify-center gap-2 transition-opacity hover:opacity-85 active:scale-95"
          style={{
            background: "rgba(0,212,170,0.06)",
            border: "1px solid rgba(0,212,170,0.2)",
            borderRadius: "12px",
            padding: "13px 12px",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--dm-green)",
          }}
        >
          <i className="fa-solid fa-bolt" style={{ fontSize: "13px" }} />
          Buy POWER
        </button>

        {/* Free POWER */}
        <button
          id="free-power-btn"
          className="flex items-center justify-center gap-2 transition-opacity hover:opacity-85"
          style={{
            background: "#141414",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "12px",
            padding: "13px 12px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#666",
          }}
        >
          <i className="fa-solid fa-gift" style={{ fontSize: "13px" }} />
          Free POWER
        </button>
      </div>
    </div>
  );
}
