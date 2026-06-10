"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import SubPageHeader from "../_components/SubPageHeader";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  metadata?: string;
}

interface Swap {
  id: string;
  hashesSwapped: number;
  tonReceived: number;
  status: string;
  createdAt: string;
}

type HistoryItem =
  | { kind: "transaction"; data: Transaction }
  | { kind: "swap"; data: Swap };

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: "var(--dm-green)",
  PENDING:   "#f5a623",
  FAILED:    "#ef4444",
  CANCELLED: "#555",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtHashes(h: number) {
  if (h >= 1_000_000) return (h / 1_000_000).toFixed(1) + "M";
  if (h >= 1_000)     return (h / 1_000).toFixed(1) + "K";
  return h.toFixed(2);
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [items, setItems]   = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<"all" | "purchases" | "swaps">("all");

  useEffect(() => {
    if (!user?.id) return;

    async function fetchHistory() {
      try {
        const res  = await fetch(`/api/history?userId=${user!.id}`);
        const data = await res.json();

        if (!data.success) return;

        const transactions: HistoryItem[] = (data.transactions ?? []).map((t: Transaction) => ({
          kind: "transaction" as const,
          data: t,
        }));
        const swapItems: HistoryItem[] = (data.swaps ?? []).map((s: Swap) => ({
          kind: "swap" as const,
          data: s,
        }));

        const merged = [...transactions, ...swapItems].sort(
          (a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime()
        );
        setItems(merged);
      } catch (err) {
        console.error("[HistoryPage]", err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [user?.id]);

  const filtered = items.filter((item) => {
    if (tab === "purchases") return item.kind === "transaction";
    if (tab === "swaps")     return item.kind === "swap";
    return true;
  });

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-20" style={{ background: "var(--background)" }}>
      <SubPageHeader
        title="History"
        description="Your transactions & swaps"
        icon="fa-solid fa-clock-rotate-left"
        iconColor="#8b5cf6"
        iconBg="rgba(139,92,246,0.12)"
        iconBorder="rgba(139,92,246,0.2)"
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "purchases", "swaps"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all"
            style={{
              background: tab === t ? "rgba(139,92,246,0.15)" : "#161616",
              border:     tab === t ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(255,255,255,0.06)",
              color:      tab === t ? "#8b5cf6" : "#555",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0,1,2,3].map((i) => (
            <div key={i} className="rounded-2xl animate-pulse"
              style={{ height: 68, background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <i className="fa-solid fa-clock-rotate-left" style={{ color: "#333", fontSize: "28px" }} />
          <p className="text-sm" style={{ color: "#555" }}>No history yet.</p>
        </div>
      ) : (
        <div
          className="flex flex-col rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {filtered.map((item, i) => {
            const isLast = i === filtered.length - 1;

            if (item.kind === "transaction") {
              const tx = item.data;
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5"
                  style={{ background: i % 2 === 0 ? "#161616" : "#141414", borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{ width: 38, height: 38, background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.2)" }}>
                    <i className="fa-solid fa-bolt" style={{ color: "#f5a623", fontSize: "14px" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#fff" }}>Buy Power</p>
                    <p className="text-xs" style={{ color: "#555" }}>{fmtDate(tx.createdAt)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: "#f5a623" }}>{tx.amount} TON</p>
                    <p className="text-xs font-semibold" style={{ color: STATUS_COLOR[tx.status] ?? "#555" }}>{tx.status}</p>
                  </div>
                </div>
              );
            }

            const sw = item.data;
            return (
              <div key={sw.id} className="flex items-center gap-3 px-4 py-3.5"
                style={{ background: i % 2 === 0 ? "#161616" : "#141414", borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)" }}
              >
                <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                  style={{ width: 38, height: 38, background: "rgba(0,212,170,0.12)", border: "1px solid rgba(0,212,170,0.2)" }}>
                  <i className="fa-solid fa-arrows-rotate" style={{ color: "var(--dm-green)", fontSize: "14px" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#fff" }}>
                    Swap — {fmtHashes(sw.hashesSwapped)} H
                  </p>
                  <p className="text-xs" style={{ color: "#555" }}>{fmtDate(sw.createdAt)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: "var(--dm-green)" }}>+{sw.tonReceived.toFixed(4)} TON</p>
                  <p className="text-xs font-semibold" style={{ color: STATUS_COLOR[sw.status] ?? "#555" }}>{sw.status}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
