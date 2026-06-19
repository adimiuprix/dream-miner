"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useMining } from "@/components/MiningProvider";
import { useAds } from "@/components/AdsgramProvider";
import SubPageHeader from "../_components/SubPageHeader";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TaskItem {
  id:                  string;
  title:               string;
  description:         string;
  type:                "SOCIAL" | "REFERRAL" | "DAILY" | "PURCHASE";
  reward:              number;
  link:                string | null;
  isRepeatable:        boolean;
  repeatCooldownHours: number;
  isCompleted:         boolean;
  canComplete:         boolean;
  cooldownEndsAt:      number | null;
  completionCount:     number;
  totalPowerEarned:    number;
}

interface TaskStats {
  totalEarned: number;
  available:   number;
  completed:   number;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  SOCIAL:   { label: "Social",   color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.2)",  icon: "fa-solid fa-share-nodes" },
  REFERRAL: { label: "Referral", color: "#f5a623", bg: "rgba(245,166,35,0.12)",  border: "rgba(245,166,35,0.2)",  icon: "fa-solid fa-user-plus" },
  DAILY:    { label: "Daily",    color: "var(--dm-green)", bg: "rgba(0,212,170,0.12)", border: "rgba(0,212,170,0.2)", icon: "fa-solid fa-calendar-check" },
  PURCHASE: { label: "Purchase", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  border: "rgba(139,92,246,0.2)",  icon: "fa-solid fa-cart-shopping" },
};

function fmtPower(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

function fmtCooldown(endsAt: number): string {
  const ms    = endsAt - Date.now();
  if (ms <= 0) return "Ready";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({
  task,
  onComplete,
  completing,
}: {
  task:       TaskItem;
  onComplete: (id: string) => void;
  completing: string | null;
}) {
  const cfg         = TYPE_CONFIG[task.type];
  const isLoading   = completing === task.id;
  const unavailable = !task.canComplete && !task.isCompleted;

  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
      style={{
        background: "#161616",
        border:     `1px solid ${task.isCompleted ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)"}`,
        opacity:    task.isCompleted ? 0.5 : 1,
      }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 40, height: 40, background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        {task.isCompleted
          ? <i className="fa-solid fa-circle-check" style={{ color: "var(--dm-green)", fontSize: "18px" }} />
          : <i className={cfg.icon} style={{ color: cfg.color, fontSize: "15px" }} />}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: task.isCompleted ? "#888" : "#fff" }}>
          {task.title}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: "#6b6b6b" }}>
          {unavailable && task.cooldownEndsAt
            ? `Available in ${fmtCooldown(task.cooldownEndsAt)}`
            : task.description}
        </p>
      </div>

      {/* Right: reward + action */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-sm font-extrabold" style={{ color: task.isCompleted ? "#555" : "var(--dm-green)" }}>
          +{fmtPower(task.reward)}
        </span>

        {task.isCompleted ? (
          <span className="text-xs font-bold" style={{ color: "#555" }}>Done</span>
        ) : unavailable ? (
          <span className="text-xs font-bold" style={{ color: "#444" }}>Wait</span>
        ) : (
          <button
            onClick={() => onComplete(task.id)}
            disabled={isLoading}
            className="text-xs font-bold px-2.5 py-1 rounded-lg transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: "rgba(0,212,170,0.15)",
              border:     "1px solid rgba(0,212,170,0.3)",
              color:      "var(--dm-green)",
            }}
          >
            {isLoading ? (
              <i className="fa-solid fa-circle-notch fa-spin" />
            ) : task.link ? (
              "Go →"
            ) : (
              "Claim"
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const { user }    = useAuth();
  const { refresh } = useMining();
  const { showAd }  = useAds();

  const [tasks,      setTasks]      = useState<TaskItem[]>([]);
  const [stats,      setStats]      = useState<TaskStats>({ totalEarned: 0, available: 0, completed: 0 });
  const [loading,    setLoading]    = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [toast,      setToast]      = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string>("ALL");

  const fetchTasks = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res  = await fetch(`/api/tasks?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("[TasksPage]", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  async function handleComplete(taskId: string) {
    if (!user?.id) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // For AD type tasks (DAILY with "ad" in title), show ad first with verification
    if (task.type === "DAILY" && task.title.toLowerCase().includes("ad")) {
      setCompleting(taskId);
      try {
        // Step 1: Get signed token
        const prepareRes = await fetch("/api/ad-session/prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            rewardType: "task-ad",
            amount: task.reward,
            metadata: { taskId },
          }),
        });

        const prepareData = await prepareRes.json();

        if (!prepareData.success || !prepareData.token) {
          setToast("❌ Failed to prepare ad");
          setCompleting(null);
          setTimeout(() => setToast(null), 3000);
          return;
        }

        // Step 2: Show ad
        const watched = await showAd();
        
        if (!watched) {
          setToast("❌ Please watch the full ad to claim");
          setCompleting(null);
          setTimeout(() => setToast(null), 3000);
          return;
        }

        // Step 3: Verify token before completing task
        const verifyRes = await fetch("/api/ad-session/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: prepareData.token }),
        });

        const verifyData = await verifyRes.json();

        if (!verifyData.valid) {
          setToast("❌ Verification failed");
          setCompleting(null);
          setTimeout(() => setToast(null), 3000);
          return;
        }

        // Continue to task completion below
      } catch (error) {
        setToast("❌ Ad verification failed");
        setCompleting(null);
        setTimeout(() => setToast(null), 3000);
        return;
      }
    }

    // For tasks with link, open URL first then claim
    if (task.link) {
      window.open(task.link, "_blank");
    }

    setCompleting(taskId);
    try {
      const res  = await fetch(`/api/tasks/${taskId}/complete`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setToast(`❌ ${data.error}`);
      } else {
        setToast(`✅ +${fmtPower(task.reward)} POWER earned!`);
        await fetchTasks(); // refresh task list
        refresh();          // refresh mining stats
      }
    } catch {
      setToast("❌ Something went wrong");
    } finally {
      setCompleting(null);
      setTimeout(() => setToast(null), 3000);
    }
  }

  // Filter tabs
  const TYPES = ["ALL", "SOCIAL", "REFERRAL", "DAILY", "PURCHASE"] as const;
  const filtered = activeType === "ALL"
    ? tasks
    : tasks.filter((t) => t.type === activeType);

  const available = filtered.filter((t) => t.canComplete && !t.isCompleted);
  const cooldown  = filtered.filter((t) => !t.canComplete && !t.isCompleted);
  const completed = filtered.filter((t) => t.isCompleted);

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-20" style={{ background: "var(--background)" }}>
      <SubPageHeader
        title="Tasks"
        description="Complete tasks and earn POWER"
        icon="fa-solid fa-list-check"
      />

      {/* Stats */}
      <div
        className="grid grid-cols-2 rounded-2xl mb-4 overflow-hidden"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3 px-4 py-4" style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{ width: 34, height: 34, background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)" }}>
            <i className="fa-solid fa-bolt" style={{ color: "var(--dm-green)", fontSize: "13px" }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "#6b6b6b" }}>Total Earned</p>
            <p className="text-base font-extrabold" style={{ color: "var(--dm-green)" }}>
              {fmtPower(stats.totalEarned)}{" "}
              <span className="text-xs font-bold" style={{ color: "#555" }}>POWER</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{ width: 34, height: 34, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)" }}>
            <i className="fa-solid fa-gift" style={{ color: "#f5a623", fontSize: "13px" }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "#6b6b6b" }}>Available</p>
            <p className="text-base font-extrabold" style={{ color: "#f5a623" }}>
              {stats.available}{" "}
              <span className="text-xs font-bold" style={{ color: "#555" }}>TASKS</span>
            </p>
          </div>
        </div>
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 capitalize transition-all"
            style={{
              background: activeType === type ? "rgba(0,212,170,0.15)" : "#161616",
              border:     activeType === type ? "1px solid rgba(0,212,170,0.3)" : "1px solid rgba(255,255,255,0.06)",
              color:      activeType === type ? "var(--dm-green)" : "#555",
            }}
          >
            {type === "ALL" ? "All" : TYPE_CONFIG[type as keyof typeof TYPE_CONFIG].label}
          </button>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="rounded-xl px-4 py-3 mb-4 text-sm font-semibold text-center"
          style={{ background: "#161616", border: "1px solid rgba(0,212,170,0.2)", color: "var(--dm-green)" }}
        >
          {toast}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0,1,2,3].map((i) => (
            <div key={i} className="rounded-2xl animate-pulse"
              style={{ height: 72, background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <i className="fa-solid fa-list-check" style={{ color: "#333", fontSize: "28px" }} />
          <p className="text-sm" style={{ color: "#555" }}>No tasks in this category.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Available */}
          {available.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2"
                style={{ color: "#404040", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Available ({available.length})
              </p>
              <div className="flex flex-col gap-2">
                {available.map((task) => (
                  <TaskCard key={task.id} task={task} onComplete={handleComplete} completing={completing} />
                ))}
              </div>
            </div>
          )}

          {/* On cooldown */}
          {cooldown.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2"
                style={{ color: "#404040", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Cooldown
              </p>
              <div className="flex flex-col gap-2">
                {cooldown.map((task) => (
                  <TaskCard key={task.id} task={task} onComplete={handleComplete} completing={completing} />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2"
                style={{ color: "#404040", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Completed ({completed.length})
              </p>
              <div className="flex flex-col gap-2">
                {completed.map((task) => (
                  <TaskCard key={task.id} task={task} onComplete={handleComplete} completing={completing} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
