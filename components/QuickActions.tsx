export default function QuickActions() {
  return (
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
  );
}
