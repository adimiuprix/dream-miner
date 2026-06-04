export default function ShopFooter() {
  return (
    <div className="flex items-center justify-between mt-6 pb-4">
      <div className="flex items-center gap-2 text-xs" style={{ color: "#555" }}>
        <i className="fa-solid fa-lock" style={{ fontSize: "11px" }} />
        Secure payments on TON blockchain.
      </div>
      <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--dm-green)" }}>
        <div className="flex items-center justify-center rounded-full" style={{ width: 16, height: 16, background: "#0088cc" }}>
          <i className="fa-solid fa-diamond" style={{ fontSize: "7px", color: "#fff" }} />
        </div>
        Secured by TON
      </div>
    </div>
  );
}
