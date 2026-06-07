import { TeamMember } from "@/app/api/team/route";

const AVATAR_COLORS = [
  "#3b82f6", "#f97316", "#8b5cf6",
  "#ef4444", "#10b981", "#ec4899",
  "#14b8a6", "#f59e0b", "#6366f1",
];

function formatPower(power: number): string {
  if (power >= 1_000_000) return (power / 1_000_000).toFixed(1) + "M";
  if (power >= 1_000) return (power / 1_000).toFixed(1) + "K";
  return power > 0 ? power.toString() : "—";
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function MemberList({ members }: { members: TeamMember[] }) {
  if (members.length === 0) return null;

  return (
    <div
      className="flex flex-col gap-0 mt-4"
      style={{ borderRadius: "1rem", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {members.map((member, i) => (
        <div
          key={member.id}
          className="flex items-center gap-3 px-4 py-3"
          style={{
            background: i % 2 === 0 ? "#161616" : "#141414",
            borderBottom: i === members.length - 1 ? "none" : "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
            style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
          >
            {member.avatar}
          </div>

          {/* Name + date */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "#e5e5e5" }}>
              {member.name}
            </p>
            <p className="text-xs" style={{ color: "#555" }}>
              {timeAgo(member.joinedAt)}
            </p>
          </div>

          {/* Badge + power */}
          <div className="text-right flex-shrink-0">
            {member.isPremium ? (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(245,166,35,0.15)", color: "#f5a623" }}
              >
                Premium
              </span>
            ) : (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.05)", color: "#555" }}
              >
                Pending
              </span>
            )}
            <p className="text-xs mt-1" style={{ color: "var(--dm-green)" }}>
              {formatPower(member.totalPower)} PWR
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
