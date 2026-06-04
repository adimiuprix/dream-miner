"use client";

const leaderboard = [
  { rank: 4, name: "Nhật.", power: "7.4M", avatar: "NH", color: "#3b82f6" },
  { rank: 5, name: ".", power: "7.4M", avatar: "·", color: "#3b82f6" },
  { rank: 6, name: "good", power: "4.2M", avatar: "G", color: "#f97316" },
  { rank: 7, name: "jose rivero", power: "3.7M", avatar: "JR", color: "#8b5cf6" },
  { rank: 8, name: "Chaiwat Uthaipan", power: "3.7M", avatar: "CU", color: "#ef4444" },
  { rank: 9, name: "Ki-Hyun", power: "2.1M", avatar: "KH", color: "#6b7280" },
];

export default function TrophyPage() {
  return (
    <div className="flex flex-col min-h-full px-4 pt-4" style={{ background: "var(--background)" }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>Rank</h1>
          <p className="text-sm mt-0.5 max-w-[180px] leading-snug" style={{ color: "#6b6b6b" }}>
            Top users with the most Power. Climb the leaderboard!
          </p>
        </div>
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            width: 44, height: 44,
            background: "rgba(0,212,170,0.08)",
            border: "1px solid rgba(0,212,170,0.2)",
          }}
        >
          <i className="fa-solid fa-trophy" style={{ color: "var(--dm-green)", fontSize: "20px" }} />
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="flex items-end gap-3 mb-6">
        {/* 2nd place */}
        <div
          className="flex-1 flex flex-col items-center rounded-2xl py-4 px-2 relative"
          style={{
            background: "#161616",
            border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: "8px",
          }}
        >
          <div className="absolute -top-3 flex items-center justify-center rounded-full w-7 h-7 text-xs font-black"
            style={{ background: "#9ca3af", color: "#111" }}>2</div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg mb-2"
            style={{ background: "#8b5cf6" }}>Z</div>
          <p className="text-xs font-semibold text-center" style={{ color: "#fff" }}>Zassmi</p>
          <p className="text-sm font-extrabold mt-1" style={{ color: "var(--dm-green)" }}>8.6M</p>
          <p className="text-xs" style={{ color: "#555" }}>POWER</p>
          <div className="w-full h-1 rounded-full mt-3" style={{ background: "#9ca3af33" }} />
        </div>

        {/* 1st place */}
        <div
          className="flex-1 flex flex-col items-center rounded-2xl py-5 px-2 relative"
          style={{
            background: "linear-gradient(160deg, #2a1f0d 0%, #1a1200 100%)",
            border: "1px solid rgba(245,166,35,0.3)",
            boxShadow: "0 0 20px rgba(245,166,35,0.12)",
          }}
        >
          <div className="absolute -top-3 flex items-center justify-center rounded-full w-7 h-7 text-xs font-black"
            style={{ background: "#f5a623", color: "#111" }}>1</div>
          {/* Wheat icons */}
          <div className="flex justify-between w-full px-2 mb-1">
            <i className="fa-solid fa-wheat-awn" style={{ color: "rgba(245,166,35,0.4)", fontSize: "16px" }} />
            <i className="fa-solid fa-wheat-awn fa-flip-horizontal" style={{ color: "rgba(245,166,35,0.4)", fontSize: "16px" }} />
          </div>
          <div className="w-14 h-14 rounded-full flex items-center justify-center font-black text-lg mb-2 overflow-hidden"
            style={{ border: "2px solid rgba(245,166,35,0.5)" }}>
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #e85d04, #f5a623)" }}>
              <i className="fa-solid fa-fire" style={{ color: "#fff", fontSize: "24px" }} />
            </div>
          </div>
          <p className="text-xs font-bold text-center uppercase tracking-wide" style={{ color: "#fff" }}>
            Gustav Mining Race
          </p>
          <p className="text-base font-extrabold mt-1" style={{ color: "#f5a623" }}>21.9M</p>
          <p className="text-xs" style={{ color: "#a3683a" }}>POWER</p>
          <div className="w-full h-1 rounded-full mt-3" style={{ background: "rgba(245,166,35,0.4)" }} />
        </div>

        {/* 3rd place */}
        <div
          className="flex-1 flex flex-col items-center rounded-2xl py-4 px-2 relative"
          style={{
            background: "#161616",
            border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: "8px",
          }}
        >
          <div className="absolute -top-3 flex items-center justify-center rounded-full w-7 h-7 text-xs font-black"
            style={{ background: "#cd7f32", color: "#111" }}>3</div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm mb-2"
            style={{ background: "#374151", border: "1px solid #4b5563" }}>
            <i className="fa-solid fa-user" style={{ color: "#9ca3af" }} />
          </div>
          <p className="text-xs font-semibold text-center" style={{ color: "#fff" }}>Евгения</p>
          <p className="text-sm font-extrabold mt-1" style={{ color: "var(--dm-green)" }}>8.0M</p>
          <p className="text-xs" style={{ color: "#555" }}>POWER</p>
          <div className="w-full h-1 rounded-full mt-3" style={{ background: "#cd7f3233" }} />
        </div>
      </div>

      {/* Rest of leaderboard */}
      <div className="flex flex-col gap-0" style={{ borderRadius: "1rem", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
        {leaderboard.map((user, i) => (
          <div
            key={user.rank}
            id={`rank-${user.rank}`}
            className="flex items-center gap-3 px-4 py-3"
            style={{
              background: i % 2 === 0 ? "#161616" : "#141414",
              borderBottom: i < leaderboard.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            }}
          >
            <span className="text-sm font-bold w-5 text-center" style={{ color: "#555" }}>
              {user.rank}
            </span>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{ background: user.color }}
            >
              {user.avatar}
            </div>
            <span className="flex-1 text-sm font-semibold" style={{ color: "#e5e5e5" }}>
              {user.name}
            </span>
            <div className="text-right">
              <p className="text-sm font-extrabold" style={{ color: "var(--dm-green)" }}>
                {user.power}
              </p>
              <p className="text-xs" style={{ color: "#555" }}>POWER</p>
            </div>
          </div>
        ))}
      </div>

      <div className="h-4" />
    </div>
  );
}
