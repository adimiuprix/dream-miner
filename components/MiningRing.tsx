"use client";

export default function MiningRing() {
  return (
    <section className="relative flex flex-col items-center justify-center pt-8 pb-4">
      {/* Keyframes scoped to this component */}
      <style>{`
        @keyframes mr-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes mr-spin-reverse {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes mr-core-pulse {
          0%, 100% {
            box-shadow:
              0 0 15px 4px rgba(0,212,170,0.12),
              inset 0 0 30px 6px rgba(0,212,170,0.06);
          }
          50% {
            box-shadow:
              0 0 30px 10px rgba(0,212,170,0.22),
              inset 0 0 50px 10px rgba(0,212,170,0.10);
          }
        }
        @keyframes mr-bolt-breathe {
          0%, 100% { transform: scale(1);    filter: drop-shadow(0 0 6px rgba(0,212,170,0.7)); }
          50%       { transform: scale(1.06); filter: drop-shadow(0 0 14px rgba(0,212,170,1)); }
        }
      `}</style>

      <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>

        {/* ─── Layer 1: faint static outer ring ─── */}
        <svg width="200" height="200" viewBox="0 0 200 200" className="absolute inset-0">
          <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(0,212,170,0.04)" strokeWidth="1" />
          <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(0,212,170,0.06)" strokeWidth="1" />
        </svg>

        {/* ─── Layer 2: thick dark ring track (the "torus" look) ─── */}
        <svg width="200" height="200" viewBox="0 0 200 200" className="absolute inset-0">
          <defs>
            <radialGradient id="ring-depth" cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor="#1a2e28" />
              <stop offset="100%" stopColor="#0a0a0a" />
            </radialGradient>
          </defs>
          {/* Thick ring background — creates the 3D depth */}
          <circle cx="100" cy="100" r="90" fill="none" stroke="url(#ring-depth)" strokeWidth="14" />
          {/* Inner edge highlight */}
          <circle cx="100" cy="100" r="83.5" fill="none" stroke="rgba(0,212,170,0.08)" strokeWidth="0.5" />
          {/* Outer edge highlight */}
          <circle cx="100" cy="100" r="96.5" fill="none" stroke="rgba(0,212,170,0.06)" strokeWidth="0.5" />
        </svg>

        {/* ─── Layer 3: main spinning bright arc ─── */}
        <svg
          width="200" height="200" viewBox="0 0 200 200"
          className="absolute inset-0"
          style={{
            animation: "mr-spin 3s linear infinite",
            transformOrigin: "100px 100px",
          }}
        >
          <defs>
            <linearGradient id="arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(0,212,170,0)" />
              <stop offset="60%" stopColor="rgba(0,212,170,0.6)" />
              <stop offset="100%" stopColor="#00d4aa" />
            </linearGradient>
            <filter id="arc-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Bright arc (~120°) */}
          <circle
            cx="100" cy="100" r="90"
            fill="none"
            stroke="url(#arc-grad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="565.5"
            strokeDashoffset="377"
            filter="url(#arc-glow)"
          />
        </svg>

        {/* ─── Layer 4: counter-spinning subtle arc ─── */}
        <svg
          width="200" height="200" viewBox="0 0 200 200"
          className="absolute inset-0"
          style={{
            animation: "mr-spin-reverse 6s linear infinite",
            transformOrigin: "100px 100px",
          }}
        >
          <circle
            cx="100" cy="100" r="90"
            fill="none"
            stroke="rgba(0,212,170,0.10)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="565.5"
            strokeDashoffset="500"
          />
        </svg>

        {/* ─── Layer 5: orbiting bright dot ─── */}
        <div
          className="absolute"
          style={{
            width: 0, height: 0,
            top: "50%", left: "50%",
            animation: "mr-spin 3s linear infinite",
            transformOrigin: "0 0",
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              marginTop: -3.5,
              marginLeft: 86.5,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: "0 0 6px 3px rgba(0,212,170,0.95), 0 0 16px 5px rgba(0,212,170,0.4)",
            }}
          />
        </div>

        {/* ─── Inner core circle ─── */}
        <div
          className="absolute rounded-full flex flex-col items-center justify-center z-10"
          style={{
            width: 152,
            height: 152,
            background: "radial-gradient(circle at 50% 40%, #122a23 0%, #0b0f0e 50%, #070808 100%)",
            border: "1.5px solid rgba(0,212,170,0.14)",
            animation: "mr-core-pulse 3s ease-in-out infinite",
          }}
        >
          {/* Bolt icon with breathing animation */}
          <div style={{ animation: "mr-bolt-breathe 3s ease-in-out infinite", marginBottom: 6 }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="38"
              height="38"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00d4aa"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
            </svg>
          </div>
          {/* Label */}
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#00d4aa",
              letterSpacing: "0.14em",
              fontFamily: "'Inter', 'SF Pro', system-ui, sans-serif",
            }}
          >
            Anjayyy Mining
          </span>
        </div>
      </div>
    </section>
  );
}