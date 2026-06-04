"use client";

import PageHeader from "@/components/ui/PageHeader";
import TopPodium from "@/components/trophy/TopPodium";
import LeaderboardItem from "@/components/trophy/LeaderboardItem";

const leaderboard = [
  { rank: 4, name: "Nhật.", power: "7.4M", avatar: "NH", color: "#3b82f6" },
  { rank: 5, name: ".", power: "7.4M", avatar: "·", color: "#3b82f6" },
  { rank: 6, name: "good", power: "4.2M", avatar: "G", color: "#f97316" },
  { rank: 7, name: "jose rivero", power: "3.7M", avatar: "JR", color: "#8b5cf6" },
  { rank: 8, name: "Chaiwat Uthaipan", power: "3.7M", avatar: "CU", color: "#ef4444" },
  { rank: 9, name: "Ki-Hyun", power: "2.1M", avatar: "KH", color: "#6b7280" },
];

export default function TrophyPage() {
  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-20" style={{ background: "var(--background)" }}>
      <PageHeader 
        title="Rank" 
        description="Top users with the most Power. Climb the leaderboard!" 
        iconClass="fa-solid fa-trophy" 
      />

      <TopPodium />

      {/* Rest of leaderboard */}
      <div className="flex flex-col gap-0" style={{ borderRadius: "1rem", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
        {leaderboard.map((user, i) => (
          <LeaderboardItem 
            key={user.rank} 
            user={user} 
            isEven={i % 2 === 0} 
            isLast={i === leaderboard.length - 1} 
          />
        ))}
      </div>

      <div className="h-4" />
    </div>
  );
}
