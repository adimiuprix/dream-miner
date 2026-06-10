"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import SubPageHeader from "../_components/SubPageHeader";

interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;       // power reward
  type: "social" | "referral" | "daily";
  isCompleted: boolean;
  link?: string;
}

// Placeholder tasks — replace with /api/tasks when backend is ready
const PLACEHOLDER_TASKS: Task[] = [
  {
    id: "task-join-channel",
    title: "Join our Telegram channel",
    description: "Subscribe to @DreamMinerOfficial",
    reward: 5_000,
    type: "social",
    isCompleted: false,
    link: "https://t.me/DreamMinerOfficial",
  },
  {
    id: "task-follow-twitter",
    title: "Follow us on X (Twitter)",
    description: "Follow @DreamMinerTON",
    reward: 3_000,
    type: "social",
    isCompleted: false,
    link: "https://x.com/DreamMinerTON",
  },
  {
    id: "task-invite-1",
    title: "Invite your first friend",
    description: "Get a friend to join via your referral link",
    reward: 10_000,
    type: "referral",
    isCompleted: false,
  },
  {
    id: "task-daily-login",
    title: "Daily check-in",
    description: "Open the app every day",
    reward: 1_000,
    type: "daily",
    isCompleted: false,
  },
];

const TYPE_CONFIG = {
  social:   { label: "Social",   color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.2)",  icon: "fa-solid fa-share-nodes" },
  referral: { label: "Referral", color: "#f5a623", bg: "rgba(245,166,35,0.12)",  border: "rgba(245,166,35,0.2)",  icon: "fa-solid fa-user-plus" },
  daily:    { label: "Daily",    color: "var(--dm-green)", bg: "rgba(0,212,170,0.12)", border: "rgba(0,212,170,0.2)", icon: "fa-solid fa-calendar-check" },
};

function fmtPower(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks]   = useState<Task[]>(PLACEHOLDER_TASKS);
  const [totalEarned]       = useState(0);

  const available = tasks.filter((t) => !t.isCompleted);
  const completed = tasks.filter((t) => t.isCompleted);

  function handleTaskClick(task: Task) {
    if (task.isCompleted) return;
    if (task.link) {
      window.open(task.link, "_blank");
    }
    // TODO: verify completion via /api/tasks/[id]/complete
  }

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
              {fmtPower(totalEarned)} <span className="text-xs font-bold" style={{ color: "#555" }}>POWER</span>
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
              {available.length} <span className="text-xs font-bold" style={{ color: "#555" }}>TASKS</span>
            </p>
          </div>
        </div>
      </div>

      {/* Available tasks */}
      {available.length > 0 && (
        <>
          <p className="text-xs font-semibold mb-2" style={{ color: "#404040", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Available
          </p>
          <div className="flex flex-col gap-2 mb-4">
            {available.map((task) => {
              const cfg = TYPE_CONFIG[task.type];
              return (
                <button
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="flex items-center gap-3 w-full rounded-2xl px-4 py-3.5 text-left transition-opacity hover:opacity-90 active:scale-[0.99]"
                  style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{ width: 40, height: 40, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <i className={cfg.icon} style={{ color: cfg.color, fontSize: "15px" }} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold truncate" style={{ color: "#fff" }}>{task.title}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "#6b6b6b" }}>{task.description}</p>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 gap-1">
                    <span className="text-sm font-extrabold" style={{ color: "var(--dm-green)" }}>
                      +{fmtPower(task.reward)}
                    </span>
                    <span className="text-xs" style={{ color: "#555" }}>POWER</span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Completed tasks */}
      {completed.length > 0 && (
        <>
          <p className="text-xs font-semibold mb-2" style={{ color: "#404040", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Completed
          </p>
          <div className="flex flex-col gap-2">
            {completed.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-2xl px-4 py-3.5 opacity-50"
                style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                  style={{ width: 40, height: 40, background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.1)" }}>
                  <i className="fa-solid fa-circle-check" style={{ color: "var(--dm-green)", fontSize: "18px" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#888" }}>{task.title}</p>
                </div>
                <span className="text-xs font-bold" style={{ color: "#555" }}>Done</span>
              </div>
            ))}
          </div>
        </>
      )}

      {available.length === 0 && completed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <i className="fa-solid fa-list-check" style={{ color: "#333", fontSize: "28px" }} />
          <p className="text-sm" style={{ color: "#555" }}>No tasks available right now.</p>
        </div>
      )}
    </div>
  );
}
