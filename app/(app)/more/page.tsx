"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import { useAuth } from "@/components/AuthProvider";

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
    isTonConnect: false,
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
    isTonConnect: true,
  },
  {
    id: "menu-history",
    icon: "fa-solid fa-clock-rotate-left",
    label: "History",
    sub: "View transaction history",
    iconBg: "rgba(139,92,246,0.12)",
    iconColor: "#8b5cf6",
    iconBorder: "rgba(139,92,246,0.2)",
    badge: null,
    isTonConnect: false,
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
    isTonConnect: false,
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
    isTonConnect: false,
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
    isTonConnect: false,
  },
];

export default function MorePage() {
  const [tasksOpen, setTasksOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const { user } = useAuth();
  const connectedAddress = useTonAddress(false);
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
          <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>Back</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6b6b6b" }}>Settings & features</p>
        </div>
        <button
          id="lang-selector-more"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{
            background: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#a3a3a3",
          }}
        >
          <i className="fa-solid fa-globe" style={{ color: "var(--dm-green)", fontSize: "12px" }} />
          EN
          <i className="fa-solid fa-chevron-down" style={{ fontSize: "9px" }} />
        </button>
      </div>

      {/* Tasks inline panel */}
      {tasksOpen && (
        <div
          className="rounded-2xl mb-4 overflow-hidden"
          style={{ background: "#161616", border: "1px solid rgba(0,212,170,0.15)" }}
        >
          {/* Stats row */}
          <div className="grid grid-cols-2 divide-x" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="flex items-center justify-center rounded-full"
                style={{ width: 34, height: 34, background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)" }}>
                <i className="fa-solid fa-bolt" style={{ color: "var(--dm-green)", fontSize: "13px" }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "#6b6b6b" }}>Total Earned</p>
                <p className="text-base font-extrabold" style={{ color: "var(--dm-green)" }}>
                  0.00 <span className="text-xs font-bold" style={{ color: "#555" }}>POWER</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-4" style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-center rounded-full"
                style={{ width: 34, height: 34, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)" }}>
                <i className="fa-solid fa-gift" style={{ color: "#f5a623", fontSize: "13px" }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "#6b6b6b" }}>Available</p>
                <p className="text-base font-extrabold" style={{ color: "#f5a623" }}>
                  0.00 <span className="text-xs font-bold" style={{ color: "#555" }}>POWER</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <i className="fa-solid fa-circle-notch fa-spin" style={{ color: "var(--dm-green)", fontSize: "22px" }} />
            <p className="text-sm" style={{ color: "#555" }}>Loading tasks...</p>
          </div>
        </div>
      )}

      {/* Wallet panel */}
      {walletOpen && (
        <div
          className="rounded-2xl mb-4 overflow-hidden p-4"
          style={{ background: "#161616", border: "1px solid rgba(59,130,246,0.2)" }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-wallet" style={{ color: "#3b82f6", fontSize: "18px" }} />
              <h3 className="text-base font-bold" style={{ color: "#fff" }}>TON Wallet</h3>
            </div>
            <p className="text-xs text-center" style={{ color: "#6b6b6b" }}>
              Connect your TON wallet to make purchases and receive swap payouts.
            </p>

            <TonConnectButton />

            {/* Status tersimpan di DB */}
            {user?.walletAddress ? (
              <div
                className="w-full rounded-xl px-4 py-3 flex items-center gap-3"
                style={{ background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.2)" }}
              >
                <i className="fa-solid fa-circle-check" style={{ color: "var(--dm-green)", fontSize: "14px" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: "var(--dm-green)" }}>Saved to account</p>
                  <p
                    className="text-xs mt-0.5 truncate font-mono"
                    style={{ color: "#5a8a75" }}
                    title={user.walletAddress}
                  >
                    {user.walletAddress}
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="w-full rounded-xl px-4 py-3 flex items-center gap-3"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <i className="fa-solid fa-circle-xmark" style={{ color: "#ef4444", fontSize: "14px" }} />
                <p className="text-xs" style={{ color: "#ef4444" }}>
                  No wallet saved — connect a wallet above to enable swaps.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Menu list */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {menuItems.map((item, i) => (
          <button
            key={item.id}
            id={item.id}
            onClick={() => {
              if (item.label === "Tasks") setTasksOpen((v) => !v);
              if (item.isTonConnect) setWalletOpen((v) => !v);
            }}
            className="flex items-center gap-4 w-full px-4 py-4 text-left transition-all duration-200"
            style={{
              borderBottom: i < menuItems.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              background: 
                (item.label === "Tasks" && tasksOpen) || (item.isTonConnect && walletOpen)
                  ? "rgba(0,212,170,0.05)" 
                  : "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                (item.label === "Tasks" && tasksOpen) || (item.isTonConnect && walletOpen)
                  ? "rgba(0,212,170,0.05)" 
                  : "transparent";
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

            {/* Badge / chevron */}
            <div className="flex items-center gap-2">
              {item.badge && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(245,166,35,0.15)", color: "#f5a623", border: "1px solid rgba(245,166,35,0.3)" }}
                >
                  {item.badge}
                </span>
              )}
              <i
                className={`fa-solid fa-chevron-${
                  ((item.label === "Tasks" && tasksOpen) || (item.isTonConnect && walletOpen)) ? "up" : "right"
                }`}
                style={{ color: "#444", fontSize: "12px" }}
              />
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
