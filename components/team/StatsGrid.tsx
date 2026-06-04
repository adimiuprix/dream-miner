export default function StatsGrid() {
  return (
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
  );
}
