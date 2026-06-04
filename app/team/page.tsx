"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import BonusCards from "@/components/team/BonusCards";
import StatsGrid from "@/components/team/StatsGrid";
import ActionButtons from "@/components/team/ActionButtons";
import TeamTabs from "@/components/team/TeamTabs";

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<"members" | "power-log">("members");

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-20" style={{ background: "var(--background)" }}>
      <PageHeader 
        title="Team" 
        description="Grow your network, earn more." 
        iconClass="fa-solid fa-users" 
      />

      <BonusCards />
      <StatsGrid />
      <ActionButtons />
      <TeamTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Empty state */}
      <EmptyState 
        title="No referrals yet" 
        description="Share your link and start building your team!" 
        iconClass="fa-solid fa-box-open" 
      />
    </div>
  );
}
