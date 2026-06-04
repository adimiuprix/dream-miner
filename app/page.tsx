"use client";

import Image from "next/image";

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

      {/* ── Mining Circle ── */}
      <style>{`
        @keyframes dm-spin {
          from { transform: rotate(-90deg); }
          to   { transform: rotate(270deg); }
        }
        @keyframes dm-spin-rev {
          from { transform: rotate(90deg); }
          to   { transform: rotate(-270deg); }
        }
        @keyframes dm-glow-pulse {
          0%, 100% {
            box-shadow: 0 0 14px 3px rgba(0,212,170,0.18), inset 0 0 20px rgba(0,212,170,0.06);
          }
          50% {
            box-shadow: 0 0 36px 12px rgba(0,212,170,0.30), inset 0 0 40px rgba(0,212,170,0.13);
          }
        }
        @keyframes dm-bolt-beat {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 6px rgba(0,212,170,0.8)); }
          50%       { transform: scale(1.13); filter: drop-shadow(0 0 16px rgba(0,212,170,1)); }
        }
        @keyframes dm-counter-glow {
          0%, 100% { text-shadow: none; }
          50%       { text-shadow: 0 0 14px rgba(0,212,170,0.35); }
        }
        @keyframes dm-orbit {
          from { transform: rotate(0deg)   translateX(90px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(90px) rotate(-360deg); }
        }
      `}</style>

      <div className="flex flex-col items-center pt-6 pb-4">
        {/* Circle container — 200×200 to give room for layers */}
        <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>

          {/* ── Layer 1: static faint outer track ring ── */}
          <svg width="200" height="200" viewBox="0 0 200 200" className="absolute inset-0">
            <circle cx="100" cy="100" r="94" fill="none" stroke="rgba(0,212,170,0.05)" strokeWidth="1.5" />
          </svg>

          {/* ── Layer 2: slow counter-rotating dashed decorative ring ── */}
          <svg
            width="200" height="200" viewBox="0 0 200 200"
            className="absolute inset-0"
            style={{ animation: "dm-spin-rev 20s linear infinite", transformOrigin: "100px 100px" }}
          >
            <circle
              cx="100" cy="100" r="94"
              fill="none"
              stroke="rgba(0,212,170,0.10)"
              strokeWidth="1"
              strokeDasharray="6 18"
              strokeLinecap="round"
            />
          </svg>

          {/* ── Layer 3: main fast-spinning bright arc ── */}
          <svg
            width="200" height="200" viewBox="0 0 200 200"
            className="absolute inset-0"
            style={{ animation: "dm-spin 2.8s linear infinite", transformOrigin: "100px 100px" }}
          >
            {/* dim full track */}
            <circle cx="100" cy="100" r="82" fill="none" stroke="rgba(0,212,170,0.07)" strokeWidth="3" />
            {/* bright ~80° arc */}
            <circle
              cx="100" cy="100" r="82"
              fill="none"
              stroke="var(--dm-green)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="515"
              strokeDashoffset="415"
              style={{ filter: "drop-shadow(0 0 7px rgba(0,212,170,0.95))" }}
            />
          </svg>

          {/* ── Layer 4: slower counter-spinning dimmer arc ── */}
          <svg
            width="200" height="200" viewBox="0 0 200 200"
            className="absolute inset-0"
            style={{ animation: "dm-spin-rev 5s linear infinite", transformOrigin: "100px 100px" }}
          >
            <circle
              cx="100" cy="100" r="82"
              fill="none"
              stroke="rgba(0,212,170,0.20)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="515"
              strokeDashoffset="463"
              style={{ filter: "drop-shadow(0 0 3px rgba(0,212,170,0.4))" }}
            />
          </svg>

          {/* ── Layer 5: orbiting glowing dot (synced with main arc speed) ── */}
          <div
            className="absolute"
            style={{
              width: 0, height: 0,
              top: "50%", left: "50%",
              animation: "dm-orbit 2.8s linear infinite",
              transformOrigin: "0 0",
            }}
          >
            <div
              style={{
                width: 9,
                height: 9,
                marginTop: -4.5,
                borderRadius: "50%",
                background: "#fff",
                boxShadow:
                  "0 0 6px 3px rgba(0,212,170,0.95), 0 0 18px 6px rgba(0,212,170,0.45)",
              }}
            />
          </div>

          {/* ── Inner dark circle — pulsing glow ── */}
          <div
            className="relative flex flex-col items-center justify-center rounded-full z-10"
            style={{
              width: 148,
              height: 148,
              background: "radial-gradient(circle at 40% 35%, #0f2820 0%, #080808 65%)",
              border: "1px solid rgba(0,212,170,0.18)",
              animation: "dm-glow-pulse 2.5s ease-in-out infinite",
            }}
          >
            {/* Animated bolt icon */}
            <div style={{ animation: "dm-bolt-beat 2.5s ease-in-out infinite", marginBottom: 4 }}>
              <Image
                src="/top-logo.svg"
                alt="Bolt"
                width={40}
                height={40}
                style={{
                  display: "block",
                  filter:
                    "invert(72%) sepia(90%) saturate(380%) hue-rotate(118deg) brightness(1.15)",
                }}
              />
            </div>
            {/* 24Hashes text */}
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--dm-green)",
                letterSpacing: "0.15em",
                fontFamily: "monospace",
              }}
            >
              2 4 H a s h e s
            </span>
          </div>
        </div>

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
