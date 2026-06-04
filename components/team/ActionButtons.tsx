export default function ActionButtons() {
  return (
    <div className="grid grid-cols-2 gap-3 mb-5">
      <button
        id="get-referrals-btn"
        className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all hover:opacity-90 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #00d4aa 0%, #00b890 100%)",
          color: "#050505",
        }}
      >
        <i className="fa-solid fa-paper-plane" />
        Get Referrals
      </button>
      <button
        id="copy-link-btn"
        className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all"
        style={{
          background: "#1a1a1a",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#a3a3a3",
        }}
      >
        <i className="fa-regular fa-copy" />
        Copy Link
      </button>
    </div>
  );
}
