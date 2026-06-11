"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────
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

type GroupedSettings = Record<string, Setting[]>;

const GROUP_META: Record<string, { label: string; icon: string; color: string }> = {
  APP_CONFIG:  { label: "App Config",  icon: "fa-solid fa-sliders",    color: "#6366f1" },
  HOT_WALLET:  { label: "Hot Wallet",  icon: "fa-solid fa-wallet",     color: "#f59e0b" },
  TELEGRAM:    { label: "Telegram Bot",icon: "fa-brands fa-telegram",  color: "#3b82f6" },
};

// ─── Single setting row ───────────────────────────────────────────────────────
function SettingRow({
  setting,
  editValue,
  onChange,
  isDirty,
}: {
  setting:   Setting;
  editValue: string;
  onChange:  (key: string, value: string) => void;
  isDirty:   boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  const isTextarea = setting.type === "TEXT";
  const displayValue = setting.isSecret && !revealed ? "" : editValue;

  return (
    <div
      className="flex flex-col gap-2 py-4"
      style={{ borderBottom: "1px solid var(--admin-border)" }}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Label + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
              {setting.label}
            </span>
            {setting.isSecret && (
              <Badge variant="warning" pill>Secret</Badge>
            )}
            {isDirty && (
              <Badge variant="info" pill>Modified</Badge>
            )}
          </div>
          <div className="text-xs font-mono mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
            {setting.key}
          </div>
          {setting.description && (
            <div className="text-xs mt-1" style={{ color: "var(--admin-text-muted)" }}>
              {setting.description}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2" style={{ minWidth: 280 }}>
          {isTextarea ? (
            <textarea
              value={setting.isSecret && !revealed ? "" : editValue}
              placeholder={setting.isSecret && !revealed ? "••••••••  (click eye to edit)" : ""}
              onChange={(e) => onChange(setting.key, e.target.value)}
              rows={3}
              style={{
                flex: 1,
                background: "var(--admin-surface)",
                border: `1px solid ${isDirty ? "rgba(99,102,241,0.5)" : "var(--admin-border)"}`,
                borderRadius: 6,
                color: "var(--admin-text)",
                fontSize: 12,
                fontFamily: "monospace",
                padding: "8px 10px",
                resize: "vertical",
                outline: "none",
                width: "100%",
              }}
            />
          ) : (
            <Input
              type={setting.isSecret && !revealed ? "password" : "text"}
              value={displayValue}
              placeholder={setting.isSecret && !revealed ? "••••••••  (click eye to edit)" : ""}
              onChange={(e) => onChange(setting.key, e.target.value)}
              style={{
                flex: 1,
                fontFamily: setting.type === "NUMBER" || setting.key.includes("address") || setting.key.includes("token") || setting.key.includes("key") || setting.key.includes("id")
                  ? "monospace" : undefined,
                fontSize: 13,
                borderColor: isDirty ? "rgba(99,102,241,0.5)" : undefined,
              }}
            />
          )}

          {setting.isSecret && (
            <button
              onClick={() => setRevealed((r) => !r)}
              title={revealed ? "Hide" : "Reveal"}
              style={{
                background: "none",
                border: "1px solid var(--admin-border)",
                borderRadius: 6,
                color: "var(--admin-text-muted)",
                width: 32,
                height: 32,
                flexShrink: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
              }}
            >
              <i className={revealed ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Group card ───────────────────────────────────────────────────────────────
function SettingGroup({
  groupKey,
  settings,
  editValues,
  dirtyKeys,
  onChange,
  onSave,
  saving,
}: {
  groupKey:   string;
  settings:   Setting[];
  editValues: Record<string, string>;
  dirtyKeys:  Set<string>;
  onChange:   (key: string, value: string) => void;
  onSave:     (groupKey: string) => void;
  saving:     boolean;
}) {
  const meta = GROUP_META[groupKey] ?? { label: groupKey, icon: "fa-solid fa-gear", color: "#6b7280" };
  const groupDirty = settings.some((s) => dirtyKeys.has(s.key));

  return (
    <Card className="!rounded-[var(--admin-radius)] !border-[var(--admin-border)] !bg-[var(--admin-surface)] !shadow-none">
      {/* Group header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--admin-border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${meta.color}22` }}
          >
            <i className={meta.icon} style={{ color: meta.color, fontSize: 14 }} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: "var(--admin-text)" }}>
              {meta.label}
            </div>
            <div className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
              {settings.length} settings
            </div>
          </div>
        </div>

        <Button
          onClick={() => onSave(groupKey)}
          isLoading={saving}
          disabled={!groupDirty || saving}
          size="sm"
        >
          <i className="fa-solid fa-floppy-disk" />
          Save
        </Button>
      </div>

      {/* Rows */}
      <CardContent className="!px-6 !py-0">
        {settings.map((s) => (
          <SettingRow
            key={s.key}
            setting={s}
            editValue={editValues[s.key] ?? ""}
            onChange={onChange}
            isDirty={dirtyKeys.has(s.key)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminSettings() {
  const [settings, setSettings]     = useState<Setting[]>([]);
  const [loading, setLoading]       = useState(true);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [dirtyKeys, setDirtyKeys]   = useState<Set<string>>(new Set());
  const [savingGroup, setSavingGroup] = useState<string | null>(null);
  const [toast, setToast]           = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const res  = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        // Initialize edit values (masked secrets start empty so user must type to change)
        const vals: Record<string, string> = {};
        for (const s of data.settings as Setting[]) {
          vals[s.key] = s.isSecret ? "" : s.value;
        }
        setEditValues(vals);
        setDirtyKeys(new Set());
      }
    } catch (err) {
      console.error("[AdminSettings] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  function handleChange(key: string, value: string) {
    setEditValues((prev) => ({ ...prev, [key]: value }));
    setDirtyKeys((prev) => new Set(prev).add(key));
  }

  async function handleSave(groupKey: string) {
    const groupSettings = settings.filter((s) => s.group === groupKey);
    const updates = groupSettings
      .filter((s) => dirtyKeys.has(s.key))
      .map((s) => ({ key: s.key, value: editValues[s.key] ?? "" }));

    if (updates.length === 0) return;

    setSavingGroup(groupKey);
    try {
      const res  = await fetch("/api/admin/settings", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ updates }),
      });
      const data = await res.json();

      if (!res.ok) {
        setToast({ msg: data.error ?? "Failed to save", type: "error" });
        return;
      }

      setToast({ msg: `${data.updated} setting(s) saved`, type: "success" });
      // Clear dirty for this group
      setDirtyKeys((prev) => {
        const next = new Set(prev);
        updates.forEach((u) => next.delete(u.key));
        return next;
      });
    } catch {
      setToast({ msg: "Network error — please try again", type: "error" });
    } finally {
      setSavingGroup(null);
    }
  }

  // Group settings
  const grouped = settings.reduce<GroupedSettings>((acc, s) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push(s);
    return acc;
  }, {});

  const groupOrder = ["APP_CONFIG", "HOT_WALLET", "TELEGRAM"];

  return (
    <div className="admin-content">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Settings</h1>
          <p className="admin-page-desc">App configuration, wallet, and integrations</p>
        </div>
        {dirtyKeys.size > 0 && (
          <div className="text-xs" style={{ color: "var(--admin-text-muted)", alignSelf: "center" }}>
            {dirtyKeys.size} unsaved change{dirtyKeys.size > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="mb-6 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
          style={{
            background: toast.type === "success" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
            border: `1px solid ${toast.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
            color: toast.type === "success" ? "#10b981" : "#ef4444",
          }}
        >
          <i className={toast.type === "success" ? "fa-solid fa-check-circle" : "fa-solid fa-circle-exclamation"} />
          {toast.msg}
        </div>
      )}

      {/* Skeleton */}
      {loading ? (
        <div className="flex flex-col gap-6">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="!rounded-[var(--admin-radius)] !border-[var(--admin-border)] !bg-[var(--admin-surface)] !shadow-none">
              <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--admin-border)" }}>
                <div className="h-5 w-32 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
              </div>
              <CardContent className="!px-6 !py-4 flex flex-col gap-4">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="h-10 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groupOrder.map((gk) =>
            grouped[gk] ? (
              <SettingGroup
                key={gk}
                groupKey={gk}
                settings={grouped[gk]}
                editValues={editValues}
                dirtyKeys={dirtyKeys}
                onChange={handleChange}
                onSave={handleSave}
                saving={savingGroup === gk}
              />
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
