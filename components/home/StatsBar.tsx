export default function StatsBar() {
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
  );
}
