import { TeamMember } from "@/app/api/team/route";
import TeamList, { TeamListItem } from "./TeamList";

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
  return `${Math.floor(days / 30)}mo ago`;
}

export default function MemberList({ members }: { members: TeamMember[] }) {
  const items: TeamListItem[] = members.map((m, i) => ({
    id:           m.id,
    avatar:       m.avatar,
    avatarColor:  AVATAR_COLORS[i % AVATAR_COLORS.length],
    title:        m.name,
    subtitle:     timeAgo(m.joinedAt),
    badge: m.isPremium
      ? { label: "Premium", color: "#f5a623", bg: "rgba(245,166,35,0.15)" }
      : { label: "Pending", color: "#555",    bg: "rgba(255,255,255,0.05)" },
    valuePrimary:      `${formatPower(m.totalPower)} PWR`,
    valuePrimaryColor: "var(--dm-green)",
  }));

  return <TeamList items={items} />;
}
