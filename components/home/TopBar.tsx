export default function TopBar() {
  return (
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
  );
}
