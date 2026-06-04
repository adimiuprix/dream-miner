export default function BonusCards() {
  return (
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
  );
}
