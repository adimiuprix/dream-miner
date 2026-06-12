"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

interface Contract {
  id: string;
  power: number;
  bonus: number;
  status: string;
  expiresAt: number;   // ms
  lastSyncAt: number;  // ms
  accumulatedHashes: number;
  plan: {
    id: string;
    name: string;
    slug: string;
    duration: number; // days
    isFree: boolean;
  };
}

/** Format milliseconds remaining → "23h 59m" / "5d 2h" / "59m 30s" */
function formatTimeLeft(msLeft: number): string {
  if (msLeft <= 0) return "Expired";
  const totalSec = Math.floor(msLeft / 1_000);
  const days  = Math.floor(totalSec / 86_400);
  const hours = Math.floor((totalSec % 86_400) / 3_600);
  const mins  = Math.floor((totalSec % 3_600) / 60);
  const secs  = totalSec % 60;
  if (days > 0)  return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0)  return `${mins}m ${secs}s`;
  return `${secs}s`;
}

/** Progress: how far through the contract duration (0–100)
 *  Dihitung dari lastSyncAt (waktu contract dibuat/diaktivasi) ke expiresAt.
 *  Tidak bergantung pada plan.duration sehingga akurat untuk semua durasi. */
function calcProgress(expiresAt: number, lastSyncAt: number): number {
  const durationMs = expiresAt - lastSyncAt;
  if (durationMs <= 0) return 100;
  const elapsed = Date.now() - lastSyncAt;
  const pct     = (elapsed / durationMs) * 100;
  return Math.min(100, Math.max(0, pct));
}

function ContractCard({ contract }: { contract: Contract }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const msLeft = contract.expiresAt - Date.now();

    // Already expired — no need to tick
    if (msLeft <= 0) return;

    // Under 1 hour: tick every second for live countdown
    // Over 1 hour: tick every minute is enough
    const interval = msLeft < 60 * 60 * 1_000 ? 1_000 : 60_000;

    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [contract.expiresAt]);

  const totalPower  = contract.power + contract.bonus;
  const hPerDay     = ((totalPower / 100_000) * 86_400);
  const msLeft      = contract.expiresAt - now;
  const progress    = calcProgress(contract.expiresAt, contract.lastSyncAt);
  const isExpired   = msLeft <= 0;

  // Progress bar color
  const barColor = isExpired
    ? "#374151"
    : progress > 80
    ? "#f5a623"
    : "var(--dm-green)";

  return (
    <div
      className="rounded-2xl px-4 py-3.5"
      style={{
        background: "#111a16",
        border: `1px solid ${isExpired ? "rgba(255,255,255,0.06)" : "rgba(0,212,170,0.15)"}`,
      }}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{
            width: 40, height: 40,
            background: isExpired ? "rgba(255,255,255,0.04)" : "rgba(0,212,170,0.12)",
            border: `1px solid ${isExpired ? "rgba(255,255,255,0.08)" : "rgba(0,212,170,0.25)"}`,
          }}
        >
          <i
            className="fa-solid fa-bolt"
            style={{
              color: isExpired ? "#444" : "var(--dm-green)",
              fontSize: "16px",
            }}
          />
        </div>

        {/* Center: name + expiry */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: isExpired ? "#555" : "#fff" }}>
            {totalPower.toLocaleString()} POWER
          </p>
          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: isExpired ? "#444" : "#5a8a75" }}>
            <i className="fa-regular fa-clock" style={{ fontSize: "10px" }} />
            {isExpired ? "Expired" : `Expires in ${formatTimeLeft(msLeft)}`}
          </p>
        </div>

        {/* Right: H/day */}
        <div className="text-right flex-shrink-0">
          <p className="text-base font-extrabold" style={{ color: isExpired ? "#444" : "var(--dm-green)" }}>
            {isExpired ? "—" : hPerDay >= 1000
              ? (hPerDay / 1000).toFixed(1) + "K"
              : hPerDay.toFixed(0)}
          </p>
          <p className="text-xs" style={{ color: "#444" }}>H/day</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 4, background: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: barColor }}
          />
        </div>
        <p className="text-right text-xs mt-1" style={{ color: "#404040" }}>
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}

// How many cards are fully visible before scroll kicks in
const VISIBLE_CARDS = 2;
// Approximate height of one ContractCard (px) — update if card height changes
const CARD_HEIGHT_PX = 96;
// Gap between cards (px) — matches gap-2 = 8px
const CARD_GAP_PX = 8;

/** Single summary card for all referral bonus contracts */
function BonusSummaryCard({ bonusContracts }: { bonusContracts: Contract[] }) {
  const activeBonus = bonusContracts.filter((c) => c.status === "ACTIVE");
  const totalPower  = activeBonus.reduce((sum, c) => sum + c.power + c.bonus, 0);

  // Nearest expiry among active bonus contracts
  const nearestExpiry =
    activeBonus.length > 0
      ? Math.min(...activeBonus.map((c) => c.expiresAt))
      : null;

  const msLeft   = nearestExpiry ? nearestExpiry - Date.now() : 0;
  const hPerDay  = totalPower / 100_000 * 86_400;

  if (activeBonus.length === 0) return null;

  return (
    <div
      className="rounded-2xl px-4 py-3.5"
      style={{
        background: "#1a1200",
        border: "1px solid rgba(245,166,35,0.2)",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{
            width: 40, height: 40,
            background: "rgba(245,166,35,0.12)",
            border: "1px solid rgba(245,166,35,0.25)",
          }}
        >
          <i className="fa-solid fa-gift" style={{ color: "#f5a623", fontSize: "16px" }} />
        </div>

        {/* Center */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold" style={{ color: "#fff" }}>
              Referral Bonus
            </p>
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(245,166,35,0.15)", color: "#f5a623" }}
            >
              {activeBonus.length} active
            </span>
          </div>
          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "#8a6a20" }}>
            <i className="fa-regular fa-clock" style={{ fontSize: "10px" }} />
            {msLeft > 0 ? `Next expiry in ${formatTimeLeft(msLeft)}` : "Expiring soon"}
          </p>
        </div>

        {/* Right: H/day */}
        <div className="text-right flex-shrink-0">
          <p className="text-base font-extrabold" style={{ color: "#f5a623" }}>
            {hPerDay >= 1000
              ? (hPerDay / 1000).toFixed(1) + "K"
              : hPerDay.toFixed(0)}
          </p>
          <p className="text-xs" style={{ color: "#444" }}>H/day</p>
        </div>
      </div>

      {/* Total power row */}
      <div
        className="mt-3 flex items-center justify-between rounded-xl px-3 py-2"
        style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.1)" }}
      >
        <p className="text-xs" style={{ color: "#8a6a20" }}>
          Total bonus power
        </p>
        <p className="text-xs font-bold" style={{ color: "#f5a623" }}>
          {totalPower.toLocaleString()} POWER
        </p>
      </div>
    </div>
  );
}

export default function ContractSection() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading]     = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  // true by default — panel starts at top with content below
  const [canScrollMore, setCanScrollMore] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    fetch(`/api/contracts?userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          // Show ACTIVE first, then EXPIRED — exclude CANCELLED
          const sorted = (data.contracts as Contract[])
            .filter((c) => c.status !== "CANCELLED")
            .sort((a, b) => {
              if (a.status === b.status) return b.expiresAt - a.expiresAt;
              return a.status === "ACTIVE" ? -1 : 1;
            });
          setContracts(sorted);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Separate bonus contracts from regular plan contracts
  const bonusContracts   = contracts.filter((c) => c.plan.slug === "bonus");
  const regularContracts = contracts.filter((c) => c.plan.slug !== "bonus");
  const hasActiveBonus   = bonusContracts.some((c) => c.status === "ACTIVE");

  // Cards to render in the scrollable list = regular contracts only
  const displayContracts = regularContracts;

  // Max height = VISIBLE_CARDS full cards + peek of next card
  const maxHeight =
    VISIBLE_CARDS * CARD_HEIGHT_PX +
    VISIBLE_CARDS * CARD_GAP_PX +
    CARD_HEIGHT_PX * 0.35; // ~35% peek of the next card

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setIsScrolled(el.scrollTop > 8);
    setCanScrollMore(el.scrollTop + el.clientHeight < el.scrollHeight - 8);
  };

  // Check if fade-bottom should show on initial render
  const showScrollPanel = !loading && displayContracts.length > VISIBLE_CARDS;
  const activeRegularCount = regularContracts.filter((c) => c.status === "ACTIVE").length;

  return (
    <div className="px-4 mb-3">
      {/* Section label + contract count */}
      <div className="flex items-center justify-between mb-2">
        <p
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: "#404040",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          YOUR CONTRACTS
        </p>
        {!loading && contracts.length > 0 && (
          <p style={{ fontSize: "10px", color: "#404040" }}>
            {activeRegularCount} active
          </p>
        )}
      </div>

      {loading ? (
        /* Skeleton */
        <div className="flex flex-col gap-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-2xl px-4 py-3.5 animate-pulse"
              style={{ background: "#111a16", border: "1px solid rgba(255,255,255,0.06)", height: 88 }}
            />
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <div
          className="rounded-2xl px-4 py-6 flex flex-col items-center gap-2"
          style={{ background: "#111a16", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <i className="fa-solid fa-box-open" style={{ color: "#333", fontSize: "24px" }} />
          <p className="text-xs" style={{ color: "#444" }}>No contracts yet. Buy a plan to start mining.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Bonus summary — single card for all referral bonuses */}
          {hasActiveBonus && <BonusSummaryCard bonusContracts={bonusContracts} />}

          {/* Regular plan contracts */}
          {showScrollPanel ? (
            /* ── Scrollable panel (3+ contracts) ─────────────────────── */
            <div className="relative">
              {/* Top fade — appears after scrolling down */}
              {isScrolled && (
                <div
                  className="absolute top-0 left-0 right-0 z-10 pointer-events-none rounded-t-2xl"
                  style={{
                    height: 32,
                    background: "linear-gradient(to bottom, #0a0f0d, transparent)",
                  }}
                />
              )}

              {/* Scrollable list */}
              <div
                onScroll={handleScroll}
                style={{
                  maxHeight,
                  overflowY: "auto",
                  overscrollBehavior: "contain",
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(0,212,170,0.2) transparent",
                }}
                className="flex flex-col gap-2 pr-0.5"
              >
                {displayContracts.map((c) => (
                  <ContractCard key={c.id} contract={c} />
                ))}
              </div>

              {/* Bottom fade */}
              <div
                className="absolute bottom-0 left-0 right-0 pointer-events-none rounded-b-2xl transition-opacity duration-200"
                style={{
                  height: 48,
                  background: "linear-gradient(to top, #0a0f0d 10%, transparent)",
                  opacity: canScrollMore === false && isScrolled ? 0 : 1,
                }}
              >
                <div className="flex justify-center pt-3">
                  <i
                    className="fa-solid fa-chevron-down"
                    style={{ color: "rgba(0,212,170,0.4)", fontSize: "10px" }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ── Normal list (1–2 contracts) ─────────────────────────── */
            <div className="flex flex-col gap-2">
              {displayContracts.map((c) => (
                <ContractCard key={c.id} contract={c} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
