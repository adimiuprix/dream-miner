export default function HashCounter() {
  return (
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
  );
}
