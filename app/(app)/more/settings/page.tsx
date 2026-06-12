"use client";

import { useAuth } from "@/components/AuthProvider";
import SubPageHeader from "../_components/SubPageHeader";

const LANGUAGES = [
  { code: "en", label: "English",    flag: "🇬🇧" },
  { code: "id", label: "Indonesia",  flag: "🇮🇩" },
  { code: "ru", label: "Русский",    flag: "🇷🇺" },
  { code: "zh", label: "中文",       flag: "🇨🇳" },
];

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-20" style={{ background: "var(--background)" }}>
      <SubPageHeader
        title="Settings"
        description="Language & preferences"
        icon="fa-solid fa-gear"
        iconColor="#a3a3a3"
        iconBg="rgba(255,255,255,0.06)"
        iconBorder="rgba(255,255,255,0.1)"
      />

      {/* Account info */}
      <p className="text-xs font-semibold mb-2" style={{ color: "#404040", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Account
      </p>
      <div
        className="rounded-2xl px-4 py-4 mb-5 flex items-center gap-3"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{ width: 42, height: 42, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}>
          <i className="fa-solid fa-user" style={{ color: "#6366f1", fontSize: "16px" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "#fff" }}>
            {user?.username ? `@${user.username}` : `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()}
          </p>
          <p className="text-xs font-mono truncate" style={{ color: "#555" }}>
            ID: {user?.telegramId ?? "—"}
          </p>
        </div>
      </div>

      {/* Language */}
      <p className="text-xs font-semibold mb-2" style={{ color: "#404040", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Language
      </p>
      <div
        className="rounded-2xl mb-5 overflow-hidden"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {LANGUAGES.map((lang, i) => {
          const isActive = lang.code === "en"; // TODO: read from user preference
          return (
            <button
              key={lang.code}
              className="flex items-center gap-3 w-full px-4 py-3.5 transition-opacity hover:opacity-80"
              style={{
                borderBottom: i < LANGUAGES.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                background: isActive ? "rgba(0,212,170,0.04)" : "transparent",
              }}
            >
              <span style={{ fontSize: 22 }}>{lang.flag}</span>
              <span className="flex-1 text-sm font-semibold text-left" style={{ color: isActive ? "#fff" : "#888" }}>
                {lang.label}
              </span>
              {isActive && (
                <i className="fa-solid fa-circle-check" style={{ color: "var(--dm-green)", fontSize: "14px" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* App info */}
      <p className="text-xs font-semibold mb-2" style={{ color: "#404040", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        About
      </p>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {[
          { label: "Version",   value: "1.0.0" },
          { label: "Network",   value: "Mainnet" },
        ].map((item, i, arr) => (
          <div key={item.label} className="flex items-center justify-between px-4 py-3.5"
            style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
            <span className="text-sm" style={{ color: "#888" }}>{item.label}</span>
            <span className="text-sm font-semibold" style={{ color: "#555" }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
