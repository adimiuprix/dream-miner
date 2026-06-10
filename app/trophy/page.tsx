"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import TopPodium from "@/components/TopPodium";
import LeaderboardItem from "@/components/LeaderboardItem";
import type { LeaderboardEntry } from "@/app/api/leaderboard/route";

// Palette untuk avatar di rank 4+
const AVATAR_COLORS = [
  "#3b82f6",
  "#f97316",
  "#8b5cf6",
  "#ef4444",
  "#10b981",
  "#ec4899",
];

export default function TrophyPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        const data = await res.json();
        if (data.success) {
          setLeaderboard(data.leaderboard);
        }
      } catch (err) {
        console.error("[TrophyPage] fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3); // rank 4–9

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-20" style={{ background: "var(--background)" }}>
      <PageHeader
        title="Rank"
        description="Top users with the most Power. Climb the leaderboard!"
        iconClass="fa-solid fa-trophy"
      />

      {isLoading ? (
        <div className="flex flex-col gap-3 mb-6">
          {/* Skeleton podium */}
          <div className="flex items-end gap-3">
            {[1, 0, 2].map((i) => (
              <div
                key={i}
                className="flex-1 rounded-2xl animate-pulse"
                style={{
                  height: i === 0 ? 160 : 140,
                  background: "#1a1a1a",
                  marginBottom: i !== 0 ? 8 : 0,
                }}
              />
            ))}
          </div>
          {/* Skeleton rows */}
          <div className="flex flex-col gap-0" style={{ borderRadius: "1rem", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 animate-pulse"
                style={{ background: i % 2 === 0 ? "#161616" : "#141414" }}
              >
                <div className="w-5 h-4 rounded" style={{ background: "#2a2a2a" }} />
                <div className="w-9 h-9 rounded-full" style={{ background: "#2a2a2a" }} />
                <div className="flex-1 h-4 rounded" style={{ background: "#2a2a2a" }} />
                <div className="w-14 h-4 rounded" style={{ background: "#2a2a2a" }} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <TopPodium top3={top3} />

          {rest.length > 0 ? (
            <div
              className="flex flex-col gap-0 mt-4"
              style={{ borderRadius: "1rem", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {rest.map((user, i) => (
                <LeaderboardItem
                  key={user.userId}
                  user={{
                    rank: user.rank,
                    name: user.name,
                    power: user.power >= 1_000_000
                      ? (user.power / 1_000_000).toFixed(1) + "M"
                      : user.power >= 1_000
                        ? (user.power / 1_000).toFixed(1) + "K"
                        : String(user.power),
                    avatar: user.avatar,
                    color: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  }}
                  isEven={i % 2 === 0}
                  isLast={i === rest.length - 1}
                />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <i className="fa-solid fa-ranking-star" style={{ color: "#333", fontSize: "28px" }} />
              <p className="text-sm" style={{ color: "#555" }}>No rankings yet. Start mining!</p>
            </div>
          ) : null}
        </>
      )}

      <div className="h-4" />
    </div>
  );
}
