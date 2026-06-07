"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import BonusCards from "@/components/team/BonusCards";
import StatsGrid from "@/components/team/StatsGrid";
import ActionButtons from "@/components/team/ActionButtons";
import TeamTabs from "@/components/team/TeamTabs";
import MemberList from "@/components/team/MemberList";
import PowerLog from "@/components/team/PowerLog";
import { useAuth } from "@/components/AuthProvider";
import type { TeamData } from "@/app/api/team/route";

export default function TeamPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"members" | "power-log">("members");
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchTeam = async () => {
      try {
        const res = await fetch(`/api/team?userId=${user.id}`);
        const data = await res.json();
        if (data.success) {
          setTeamData(data.data);
        }
      } catch (err) {
        console.error("[TeamPage] fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeam();
  }, [user?.id]);

  const showEmptyMembers =
    !isLoading && activeTab === "members" && (teamData?.members.length ?? 0) === 0;
  const showEmptyLog =
    !isLoading && activeTab === "power-log" && (teamData?.powerLog.length ?? 0) === 0;

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-20" style={{ background: "var(--background)" }}>
      <PageHeader
        title="Team"
        description="Grow your network, earn more."
        iconClass="fa-solid fa-users"
      />

      <BonusCards />

      {isLoading ? (
        // Skeleton for StatsGrid
        <div
          className="grid grid-cols-2 gap-0 rounded-2xl mb-4 overflow-hidden animate-pulse"
          style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-4"
              style={{
                borderRight: i % 2 === 0 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : undefined,
              }}
            >
              <div className="rounded-full flex-shrink-0" style={{ width: 34, height: 34, background: "#2a2a2a" }} />
              <div className="flex flex-col gap-1">
                <div className="rounded" style={{ width: 32, height: 20, background: "#2a2a2a" }} />
                <div className="rounded" style={{ width: 48, height: 12, background: "#2a2a2a" }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <StatsGrid stats={teamData?.stats ?? null} />
      )}

      <ActionButtons referralCode={teamData?.referralCode ?? ""} />

      <TeamTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Members tab */}
      {activeTab === "members" && (
        showEmptyMembers ? (
          <EmptyState
            title="No referrals yet"
            description="Share your link and start building your team!"
            iconClass="fa-solid fa-box-open"
          />
        ) : isLoading ? (
          <SkeletonRows />
        ) : (
          <MemberList members={teamData?.members ?? []} />
        )
      )}

      {/* Power log tab */}
      {activeTab === "power-log" && (
        showEmptyLog ? (
          <EmptyState
            title="No power earned yet"
            description="Invite friends to start earning bonus POWER!"
            iconClass="fa-solid fa-bolt"
          />
        ) : isLoading ? (
          <SkeletonRows />
        ) : (
          <PowerLog entries={teamData?.powerLog ?? []} />
        )
      )}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div
      className="flex flex-col gap-0 mt-4 animate-pulse"
      style={{ borderRadius: "1rem", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3"
          style={{ background: i % 2 === 0 ? "#161616" : "#141414" }}
        >
          <div className="rounded-full flex-shrink-0" style={{ width: 36, height: 36, background: "#2a2a2a" }} />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="rounded" style={{ width: "50%", height: 13, background: "#2a2a2a" }} />
            <div className="rounded" style={{ width: "30%", height: 11, background: "#2a2a2a" }} />
          </div>
          <div className="rounded" style={{ width: 56, height: 22, background: "#2a2a2a" }} />
        </div>
      ))}
    </div>
  );
}
