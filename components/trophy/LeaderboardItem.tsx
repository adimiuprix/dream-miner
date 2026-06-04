export interface LeaderboardUser {
  rank: number;
  name: string;
  power: string;
  avatar: string;
  color: string;
}

export default function LeaderboardItem({ user, isEven, isLast }: { user: LeaderboardUser, isEven: boolean, isLast: boolean }) {
  return (
    <div
      id={`rank-${user.rank}`}
      className="flex items-center gap-3 px-4 py-3"
      style={{
        background: isEven ? "#161616" : "#141414",
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <span className="text-sm font-bold w-5 text-center" style={{ color: "#555" }}>
        {user.rank}
      </span>
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
        style={{ background: user.color }}
      >
        {user.avatar}
      </div>
      <span className="flex-1 text-sm font-semibold" style={{ color: "#e5e5e5" }}>
        {user.name}
      </span>
      <div className="text-right">
        <p className="text-sm font-extrabold" style={{ color: "var(--dm-green)" }}>
          {user.power}
        </p>
        <p className="text-xs" style={{ color: "#555" }}>POWER</p>
      </div>
    </div>
  );
}
