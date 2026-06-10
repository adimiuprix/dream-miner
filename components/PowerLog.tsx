import { PowerLogEntry } from "@/app/api/team/route";
import TeamList, { TeamListItem } from "./TeamList";

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatPower(power: number): string {
  if (power >= 1_000_000) return "+" + (power / 1_000_000).toFixed(1) + "M";
  if (power >= 1_000)     return "+" + (power / 1_000).toFixed(1) + "K";
  return "+" + power;
}

export default function PowerLog({ entries }: { entries: PowerLogEntry[] }) {
  const items: TeamListItem[] = entries.map((e) => {
    const isPurchase = e.type === "referral_purchase";
    return {
      id:          e.id,
      iconClass:   isPurchase ? "fa-solid fa-gem"      : "fa-solid fa-user-plus",
      iconColor:   isPurchase ? "#f5a623"               : "var(--dm-green)",
      iconBg:      isPurchase ? "rgba(245,166,35,0.12)" : "rgba(0,212,170,0.1)",
      iconBorder:  isPurchase ? "1px solid rgba(245,166,35,0.2)" : "1px solid rgba(0,212,170,0.2)",
      title:       isPurchase ? "Purchase Bonus" : "Referral Joined",
      subtitle:    `${e.memberName} · ${formatDate(e.date)}`,
      valuePrimary:      formatPower(e.powerEarned),
      valuePrimaryColor: "var(--dm-green)",
      valueSecondary:    "POWER",
    };
  });

  return <TeamList items={items} />;
}
