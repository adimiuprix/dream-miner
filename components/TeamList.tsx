"use client";

const AVATAR_COLORS = [
  "#3b82f6", "#f97316", "#8b5cf6",
  "#ef4444", "#10b981", "#ec4899",
  "#14b8a6", "#f59e0b", "#6366f1",
];

// ─── Item shape ───────────────────────────────────────────────────────────────

export interface TeamListItem {
  id: string;

  // Left slot: either colored avatar initials OR icon
  avatar?: string;              // initials, e.g. "JD"
  avatarColor?: string;         // hex background for avatar
  iconClass?: string;           // fa class, e.g. "fa-solid fa-gem"
  iconColor?: string;           // icon color
  iconBg?: string;              // icon container background
  iconBorder?: string;          // icon container border

  // Center
  title: string;
  subtitle: string;

  // Right slot
  badge?: { label: string; color: string; bg: string } | null;
  valuePrimary: string;         // e.g. "+59K" / "Premium"
  valuePrimaryColor?: string;
  valueSecondary?: string;      // e.g. "POWER" / "PWR"
}

interface TeamListProps {
  items: TeamListItem[];
}

export default function TeamList({ items }: TeamListProps) {
  if (items.length === 0) return null;

  return (
    <div
      className="flex flex-col gap-0 mt-4"
      style={{ borderRadius: "1rem", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {items.map((item, i) => (
        <div
          key={item.id}
          className="flex items-center gap-3 px-4 py-3"
          style={{
            background: i % 2 === 0 ? "#161616" : "#141414",
            borderBottom: i === items.length - 1 ? "none" : "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {/* Left: avatar OR icon */}
          {item.avatar ? (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{ background: item.avatarColor ?? AVATAR_COLORS[i % AVATAR_COLORS.length] }}
            >
              {item.avatar}
            </div>
          ) : (
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: 36, height: 36,
                background: item.iconBg    ?? "rgba(0,212,170,0.1)",
                border:     item.iconBorder ?? "1px solid rgba(0,212,170,0.2)",
              }}
            >
              <i
                className={item.iconClass ?? "fa-solid fa-circle"}
                style={{ color: item.iconColor ?? "var(--dm-green)", fontSize: "13px" }}
              />
            </div>
          )}

          {/* Center */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "#e5e5e5" }}>
              {item.title}
            </p>
            <p className="text-xs truncate" style={{ color: "#555" }}>
              {item.subtitle}
            </p>
          </div>

          {/* Right */}
          <div className="text-right flex-shrink-0">
            {item.badge ? (
              <>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: item.badge.bg, color: item.badge.color }}
                >
                  {item.badge.label}
                </span>
                {item.valueSecondary && (
                  <p className="text-xs mt-1" style={{ color: item.valuePrimaryColor ?? "var(--dm-green)" }}>
                    {item.valuePrimary}
                  </p>
                )}
              </>
            ) : (
              <>
                <p
                  className="text-sm font-extrabold"
                  style={{ color: item.valuePrimaryColor ?? "var(--dm-green)" }}
                >
                  {item.valuePrimary}
                </p>
                {item.valueSecondary && (
                  <p className="text-xs" style={{ color: "#555" }}>
                    {item.valueSecondary}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
