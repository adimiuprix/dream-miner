import { TeamStats } from "@/app/api/team/route";

function formatPower(power: number): string {
  if (power >= 1_000_000) return (power / 1_000_000).toFixed(2) + "M";
  if (power >= 1_000) return (power / 1_000).toFixed(1) + "K";
  return power.toString();
}

export default function StatsGrid({ stats }: { stats: TeamStats | null }) {
  const referred = stats?.totalReferred ?? 0;
  const valid = stats?.validMembers ?? 0;
  const pending = stats?.pendingMembers ?? 0;
  const power = stats?.totalPowerEarned ?? 0;

  return (
    <div
      className="grid grid-cols-2 gap-0 rounded-2xl mb-4 overflow-hidden"
      style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Referred */}
      <div
        className="flex items-center gap-3 px-4 py-4"
        style={{
          borderRight: "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 34, height: 34,
            background: "rgba(0,212,170,0.1)",
            border: "1px solid rgba(0,212,170,0.2)",
          }}
        >
          <i className="fa-solid fa-user-plus" style={{ color: "var(--dm-green)", fontSize: "13px" }} />
        </div>
        <div>
          <p className="text-lg font-extrabold" style={{ color: "#fff" }}>{referred}</p>
          <p className="text-xs" style={{ color: "#6b6b6b" }}>Referred</p>
        </div>
      </div>

      {/* Valid */}
      <div
        className="flex items-center gap-3 px-4 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 34, height: 34,
            background: "rgba(0,212,170,0.1)",
            border: "1px solid rgba(0,212,170,0.2)",
          }}
        >
          <i className="fa-solid fa-shield-check" style={{ color: "var(--dm-green)", fontSize: "13px" }} />
        </div>
        <div>
          <p className="text-lg font-extrabold" style={{ color: "#fff" }}>{valid}</p>
          <p className="text-xs" style={{ color: "#6b6b6b" }}>Valid</p>
        </div>
      </div>

      {/* Pending */}
      <div
        className="flex items-center gap-3 px-4 py-4"
        style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 34, height: 34,
            background: "rgba(245,166,35,0.1)",
            border: "1px solid rgba(245,166,35,0.2)",
          }}
        >
          <i className="fa-regular fa-clock" style={{ color: "#f5a623", fontSize: "13px" }} />
        </div>
        <div>
          <p className="text-lg font-extrabold" style={{ color: "#f5a623" }}>{pending}</p>
          <p className="text-xs" style={{ color: "#6b6b6b" }}>Pending</p>
        </div>
      </div>

      {/* Power */}
      <div className="flex items-center gap-3 px-4 py-4">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 34, height: 34,
            background: "rgba(0,212,170,0.1)",
            border: "1px solid rgba(0,212,170,0.2)",
          }}
        >
          <i className="fa-solid fa-bolt" style={{ color: "var(--dm-green)", fontSize: "13px" }} />
        </div>
        <div>
          <p className="text-lg font-extrabold" style={{ color: "var(--dm-green)" }}>
            {formatPower(power)}
          </p>
          <p className="text-xs" style={{ color: "#6b6b6b" }}>POWER</p>
        </div>
      </div>
    </div>
  );
}
