"use client";

import { useRouter } from "next/navigation";

const menuItems = [
  {
    id: "menu-tasks",
    icon: "fa-solid fa-list-check",
    label: "Tasks",
    sub: "Complete tasks and earn Power",
    iconBg: "rgba(0,212,170,0.12)",
    iconColor: "var(--dm-green)",
    iconBorder: "rgba(0,212,170,0.2)",
    badge: null,
    href: "/more/tasks",
  },
  {
    id: "menu-wallet",
    icon: "fa-solid fa-wallet",
    label: "Wallet",
    sub: "Connect your TON wallet",
    iconBg: "rgba(59,130,246,0.12)",
    iconColor: "#3b82f6",
    iconBorder: "rgba(59,130,246,0.2)",
    badge: null,
    href: "/more/wallet",
  },
  {
    id: "menu-history",
    icon: "fa-solid fa-clock-rotate-left",
    label: "History",
    sub: "View transaction & swap history",
    iconBg: "rgba(139,92,246,0.12)",
    iconColor: "#8b5cf6",
    iconBorder: "rgba(139,92,246,0.2)",
    badge: null,
    href: "/more/history",
  },
  {
    id: "menu-invite",
    icon: "fa-solid fa-user-plus",
    label: "Invite Friends",
    sub: "Earn bonuses for each referral",
    iconBg: "rgba(245,166,35,0.12)",
    iconColor: "#f5a623",
    iconBorder: "rgba(245,166,35,0.2)",
    badge: "HOT",
    href: "/more/invite",
  },
  {
    id: "menu-support",
    icon: "fa-solid fa-headset",
    label: "Support",
    sub: "Get help from our team",
    iconBg: "rgba(255,255,255,0.06)",
    iconColor: "#a3a3a3",
    iconBorder: "rgba(255,255,255,0.1)",
    badge: null,
    href: "/more/support",
  },
  {
    id: "menu-settings",
    icon: "fa-solid fa-gear",
    label: "Settings",
    sub: "Language, notifications & more",
    iconBg: "rgba(255,255,255,0.06)",
    iconColor: "#a3a3a3",
    iconBorder: "rgba(255,255,255,0.1)",
    badge: null,
    href: "/more/settings",
  },
];

export default function MorePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-20" style={{ background: "var(--background)" }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center rounded-xl mb-2 transition-opacity hover:opacity-75 active:scale-95"
            style={{
              width: 44, height: 44,
              background: "rgba(0,212,170,0.08)",
              border: "1px solid rgba(0,212,170,0.2)",
            }}
            aria-label="Go back"
          >
            <i className="fa-solid fa-chevron-left" style={{ color: "var(--dm-green)", fontSize: "18px" }} />
          </button>
          <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>More</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6b6b6b" }}>Settings & features</p>
        </div>
      </div>

      {/* Menu list */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {menuItems.map((item, i) => (
          <button
            key={item.id}
            id={item.id}
            onClick={() => router.push(item.href)}
            className="flex items-center gap-4 w-full px-4 py-4 text-left transition-all duration-150 hover:bg-white/[0.02] active:bg-white/[0.04]"
            style={{
              borderBottom: i < menuItems.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            }}
          >
            {/* Icon */}
            <div
              className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{
                width: 40, height: 40,
                background: item.iconBg,
                border: `1px solid ${item.iconBorder}`,
              }}
            >
              <i className={item.icon} style={{ color: item.iconColor, fontSize: "16px" }} />
            </div>

            {/* Text */}
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "#fff" }}>{item.label}</p>
              <p className="text-xs mt-0.5" style={{ color: "#6b6b6b" }}>{item.sub}</p>
            </div>

            {/* Badge + chevron */}
            <div className="flex items-center gap-2">
              {item.badge && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(245,166,35,0.15)", color: "#f5a623", border: "1px solid rgba(245,166,35,0.3)" }}
                >
                  {item.badge}
                </span>
              )}
              <i className="fa-solid fa-chevron-right" style={{ color: "#444", fontSize: "12px" }} />
            </div>
          </button>
        ))}
      </div>

      {/* Version */}
      <p className="text-center text-xs mt-6 mb-2" style={{ color: "#333" }}>
        Dream Miner v1.0.0
      </p>
    </div>
  );
}
