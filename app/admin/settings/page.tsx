"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Setting {
  key:         string;
  value:       string;
  type:        "STRING" | "NUMBER" | "BOOLEAN" | "TEXT";
  group:       "APP_CONFIG" | "HOT_WALLET" | "TELEGRAM";
  label:       string;
  description: string | null;
  isSecret:    boolean;
  updatedAt:   string;
}

const GROUPS: { key: string; label: string; icon: string; color: string; desc: string }[] = [
  {
    key:   "APP_CONFIG",
    label: "App Config",
    icon:  "fa-solid fa-sliders",
    color: "#6366f1",
    desc:  "Core application parameters — mining rates, swap limits, and referral bonuses.",
  },
  {
    key:   "HOT_WALLET",
    label: "Hot Wallet",
    icon:  "fa-solid fa-wallet",
    color: "#f59e0b",
    desc:  "TON hot wallet credentials used to send payouts to users on swap.",
  },
  {
    key:   "TELEGRAM",
    label: "Telegram",
    icon:  "fa-brands fa-telegram",
    color: "#3b82f6",
    desc:  "Telegram bot integration for notifications and Mini App configuration.",
  },
];

// ─── Field row ────────────────────────────────────────────────────────────────
function FieldRow({
  setting, value, onChange, isDirty,
}: {
  setting: Setting; value: string;
  onChange: (key: string, val: string) => void; isDirty: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const isMono =
    setting.key.includes("address") || setting.key.includes("token") ||
    setting.key.includes("key")     || setting.key.includes("mnemonic") ||
    setting.key.includes("chat_id") || setting.type === "NUMBER";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.5fr",
        gap: "12px 32px",
        padding: "18px 0",
        borderBottom: "1px solid var(--admin-border)",
        alignItems: "start",
      }}
    >
      {/* Left: label + key + description */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--admin-text)" }}>
            {setting.label}
          </span>
          {setting.isSecret && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
              background: "rgba(245,158,11,0.12)", color: "#f59e0b",
              border: "1px solid rgba(245,158,11,0.2)", letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}>
              secret
            </span>
          )}
          {isDirty && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
              background: "rgba(99,102,241,0.15)", color: "#818cf8",
              border: "1px solid rgba(99,102,241,0.25)", letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}>
              unsaved
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--admin-text-muted)", marginTop: 3 }}>
          {setting.key}
        </div>
        {setting.description && (
          <div style={{ fontSize: 12, color: "var(--admin-text-muted)", marginTop: 6, lineHeight: 1.55 }}>
            {setting.description}
          </div>
        )}
      </div>

      {/* Right: input */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        {setting.key === "ton_network" ? (
          <select
            value={value}
            onChange={(e) => onChange(setting.key, e.target.value)}
            style={{
              flex: 1, background: "var(--admin-bg)",
              border: `1px solid ${isDirty ? "rgba(99,102,241,0.45)" : "var(--admin-border)"}`,
              borderRadius: 8, color: "var(--admin-text)",
              fontSize: 13, padding: "0 12px", height: 36,
              outline: "none", cursor: "pointer",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              paddingRight: 36,
              transition: "border-color 0.15s",
            }}
          >
            <option value="testnet">testnet</option>
            <option value="mainnet">mainnet</option>
          </select>
        ) : setting.type === "TEXT" ? (
          <textarea
            value={setting.isSecret && !revealed ? "" : value}
            placeholder={setting.isSecret && !revealed ? "Click 👁 to reveal and edit" : "Enter value…"}
            onChange={(e) => onChange(setting.key, e.target.value)}
            rows={4}
            style={{
              flex: 1, background: "var(--admin-bg)",
              border: `1px solid ${isDirty ? "rgba(99,102,241,0.45)" : "var(--admin-border)"}`,
              borderRadius: 8, color: "var(--admin-text)",
              fontSize: 12, fontFamily: "monospace",
              padding: "9px 12px", resize: "vertical", outline: "none",
              lineHeight: 1.6, transition: "border-color 0.15s",
            }}
          />
        ) : (
          <Input
            type={setting.isSecret && !revealed ? "password" : "text"}
            value={setting.isSecret && !revealed ? "" : value}
            placeholder={setting.isSecret && !revealed ? "Click 👁 to reveal and edit" : ""}
            onChange={(e) => onChange(setting.key, e.target.value)}
            style={{
              flex: 1,
              fontFamily: isMono ? "monospace" : undefined,
              fontSize: 13,
              borderColor: isDirty ? "rgba(99,102,241,0.45)" : undefined,
              background: "var(--admin-bg)",
            }}
          />
        )}
        {setting.isSecret && (
          <button
            onClick={() => setRevealed((r) => !r)}
            title={revealed ? "Hide value" : "Reveal value"}
            style={{
              flexShrink: 0, width: 36, height: 36, borderRadius: 8,
              background: "var(--admin-bg)", border: "1px solid var(--admin-border)",
              color: revealed ? "var(--admin-text)" : "var(--admin-text-muted)",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 13, transition: "all 0.15s",
            }}
          >
            <i className={revealed ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminSettings() {
  const [settings, setSettings]       = useState<Setting[]>([]);
  const [loading, setLoading]         = useState(true);
  const [editValues, setEditValues]   = useState<Record<string, string>>({});
  const [dirtyKeys, setDirtyKeys]     = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab]     = useState("APP_CONFIG");
  const [savingGroup, setSavingGroup] = useState<string | null>(null);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res  = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        const vals: Record<string, string> = {};
        for (const s of data.settings as Setting[])
          vals[s.key] = s.isSecret ? "" : s.value;
        setEditValues(vals);
        setDirtyKeys(new Set());
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  function handleChange(key: string, val: string) {
    setEditValues((p) => ({ ...p, [key]: val }));
    setDirtyKeys((p) => new Set(p).add(key));
  }

  async function handleSave(groupKey: string) {
    const updates = settings
      .filter((s) => s.group === groupKey && dirtyKeys.has(s.key))
      .map((s) => ({ key: s.key, value: editValues[s.key] ?? "" }));
    if (!updates.length) return;
    setSavingGroup(groupKey);
    try {
      const res  = await fetch("/api/admin/settings", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok) { setToast({ msg: data.error ?? "Failed to save", ok: false }); return; }
      setToast({ msg: `${data.updated} setting${data.updated > 1 ? "s" : ""} saved successfully`, ok: true });
      setDirtyKeys((p) => { const n = new Set(p); updates.forEach((u) => n.delete(u.key)); return n; });
    } catch { setToast({ msg: "Network error — please try again", ok: false }); }
    finally { setSavingGroup(null); }
  }

  const grouped = settings.reduce<Record<string, Setting[]>>((acc, s) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push(s);
    return acc;
  }, {});

  const activeGroup   = GROUPS.find((g) => g.key === activeTab)!;
  const activeFields  = grouped[activeTab] ?? [];
  const tabDirty      = activeFields.filter((s) => dirtyKeys.has(s.key)).length;
  const totalDirty    = dirtyKeys.size;

  return (
    <div className="admin-content">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Settings</h1>
          <p className="admin-page-desc">Manage application configuration, integrations, and secrets.</p>
        </div>
        {totalDirty > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 8,
            background: "rgba(99,102,241,0.1)", color: "#818cf8",
            border: "1px solid rgba(99,102,241,0.2)",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
            {totalDirty} unsaved change{totalDirty > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          marginBottom: 24, padding: "12px 16px", borderRadius: 10,
          display: "flex", alignItems: "center", gap: 10,
          fontSize: 13, fontWeight: 500,
          background: toast.ok ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${toast.ok ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
          color: toast.ok ? "#10b981" : "#ef4444",
        }}>
          <i className={`fa-solid ${toast.ok ? "fa-circle-check" : "fa-circle-exclamation"}`} />
          {toast.msg}
        </div>
      )}

      {loading ? (
        /* Skeleton */
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ width: 200, flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {[0,1,2].map((i) => (
              <div key={i} style={{ height: 44, borderRadius: 8, background: "rgba(255,255,255,0.05)" }}
                className="animate-pulse" />
            ))}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
            {[0,1,2,3,4].map((i) => (
              <div key={i} style={{ padding: "18px 0", borderBottom: "1px solid var(--admin-border)",
                display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 32 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ height: 14, width: 120, borderRadius: 4, background: "rgba(255,255,255,0.07)" }} className="animate-pulse" />
                  <div style={{ height: 10, width: 160, borderRadius: 4, background: "rgba(255,255,255,0.04)" }} className="animate-pulse" />
                </div>
                <div style={{ height: 36, borderRadius: 8, background: "rgba(255,255,255,0.05)" }} className="animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>

          {/* ── Left nav ──────────────────────────────────────────────────── */}
          <nav style={{ width: 196, flexShrink: 0, position: "sticky", top: 24 }}>
            {GROUPS.map((g) => {
              const isActive  = activeTab === g.key;
              const hasDirty  = (grouped[g.key] ?? []).some((s) => dirtyKeys.has(s.key));
              return (
                <button
                  key={g.key}
                  onClick={() => setActiveTab(g.key)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center",
                    gap: 10, padding: "10px 14px", marginBottom: 2,
                    borderRadius: 8, border: "none", cursor: "pointer",
                    background: isActive ? `${g.color}14` : "transparent",
                    color: isActive ? g.color : "var(--admin-text-muted)",
                    fontSize: 13, fontWeight: isActive ? 600 : 500,
                    textAlign: "left", transition: "all 0.15s",
                  }}
                >
                  <i className={g.icon} style={{ fontSize: 14, width: 16, textAlign: "center" }} />
                  <span style={{ flex: 1 }}>{g.label}</span>
                  {hasDirty && (
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: "#6366f1", flexShrink: 0,
                    }} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* ── Right content ─────────────────────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Section header */}
            <div style={{
              display: "flex", alignItems: "flex-start",
              justifyContent: "space-between", gap: 16,
              paddingBottom: 18, marginBottom: 0,
              borderBottom: `2px solid ${activeGroup.color}`,
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${activeGroup.color}18`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <i className={activeGroup.icon} style={{ color: activeGroup.color, fontSize: 14 }} />
                  </div>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--admin-text)" }}>
                    {activeGroup.label}
                  </h2>
                </div>
                <p style={{ fontSize: 12, color: "var(--admin-text-muted)", marginTop: 6 }}>
                  {activeGroup.desc}
                </p>
              </div>
              <Button
                onClick={() => handleSave(activeTab)}
                isLoading={savingGroup === activeTab}
                disabled={tabDirty === 0 || savingGroup === activeTab}
                size="sm"
                style={{ flexShrink: 0 }}
              >
                <i className="fa-solid fa-floppy-disk" />
                {tabDirty > 0 ? `Save ${tabDirty} change${tabDirty > 1 ? "s" : ""}` : "Save"}
              </Button>
            </div>

            {/* Fields */}
            <div>
              {activeFields.map((s) => (
                <FieldRow
                  key={s.key}
                  setting={s}
                  value={editValues[s.key] ?? ""}
                  onChange={handleChange}
                  isDirty={dirtyKeys.has(s.key)}
                />
              ))}
              {/* Remove border on last row */}
              <style>{`div > div:last-child > [style*="border-bottom"] { border-bottom: none !important; }`}</style>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
