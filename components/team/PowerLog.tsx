import { PowerLogEntry } from "@/app/api/team/route";

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatPower(power: number): string {
  if (power >= 1_000_000) return "+" + (power / 1_000_000).toFixed(1) + "M";
  if (power >= 1_000) return "+" + (power / 1_000).toFixed(1) + "K";
  return "+" + power;
}

export default function PowerLog({ entries }: { entries: PowerLogEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div
      className="flex flex-col gap-0 mt-4"
      style={{ borderRadius: "1rem", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {entries.map((entry, i) => (
        <div
          key={entry.id}
          className="flex items-center gap-3 px-4 py-3"
          style={{
            background: i % 2 === 0 ? "#161616" : "#141414",
            borderBottom: i === entries.length - 1 ? "none" : "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {/* Icon */}
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{
              width: 34, height: 34,
              background: entry.type === "referral_purchase"
                ? "rgba(245,166,35,0.12)"
                : "rgba(0,212,170,0.1)",
              border: entry.type === "referral_purchase"
                ? "1px solid rgba(245,166,35,0.2)"
                : "1px solid rgba(0,212,170,0.2)",
            }}
          >
            <i
              className={entry.type === "referral_purchase" ? "fa-solid fa-gem" : "fa-solid fa-user-plus"}
              style={{
                color: entry.type === "referral_purchase" ? "#f5a623" : "var(--dm-green)",
                fontSize: "13px",
              }}
            />
          </div>

          {/* Description */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "#e5e5e5" }}>
              {entry.type === "referral_purchase" ? "Premium Bonus" : "Referral Joined"}
            </p>
            <p className="text-xs truncate" style={{ color: "#555" }}>
              {entry.memberName} · {formatDate(entry.date)}
            </p>
          </div>

          {/* Power earned */}
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-extrabold" style={{ color: "var(--dm-green)" }}>
              {formatPower(entry.powerEarned)}
            </p>
            <p className="text-xs" style={{ color: "#555" }}>POWER</p>
          </div>
        </div>
      ))}
    </div>
  );
}
