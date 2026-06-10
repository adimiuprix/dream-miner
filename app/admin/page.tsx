import { prisma } from "@/lib/prisma";
import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

async function getStats() {
  const [totalUsers, totalContracts, activeContracts, completedTx, totalSwaps] =
    await Promise.all([
      prisma.user.count(),
      prisma.contract.count(),
      prisma.contract.count({ where: { status: "ACTIVE" } }),
      prisma.transaction.count({ where: { status: "COMPLETED", type: "PURCHASE_POWER" } }),
      prisma.swap.count({ where: { status: "COMPLETED" } }),
    ]);

  const revenue = await prisma.transaction.aggregate({
    where: { status: "COMPLETED", type: "PURCHASE_POWER" },
    _sum: { amount: true },
  });

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { id: true, firstName: true, lastName: true, username: true, createdAt: true },
  });

  return { totalUsers, totalContracts, activeContracts, completedTx, totalSwaps, totalRevenue: revenue._sum.amount ?? 0, recentUsers };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "Total Users",       value: stats.totalUsers.toLocaleString(),      icon: "fa-solid fa-users",          iconBg: "rgba(99,102,241,0.15)",  iconColor: "#6366f1" },
    { label: "Active Contracts",  value: stats.activeContracts.toLocaleString(), icon: "fa-solid fa-file-contract",  iconBg: "rgba(16,185,129,0.15)",  iconColor: "#10b981" },
    { label: "Total Contracts",   value: stats.totalContracts.toLocaleString(),  icon: "fa-solid fa-box",            iconBg: "rgba(139,92,246,0.15)", iconColor: "#8b5cf6" },
    { label: "Purchases",         value: stats.completedTx.toLocaleString(),     icon: "fa-solid fa-receipt",        iconBg: "rgba(245,158,11,0.15)",  iconColor: "#f59e0b" },
    { label: "Completed Swaps",   value: stats.totalSwaps.toLocaleString(),      icon: "fa-solid fa-arrows-rotate",  iconBg: "rgba(236,72,153,0.15)", iconColor: "#ec4899" },
    { label: "Total Revenue",     value: stats.totalRevenue.toFixed(2) + " TON", icon: "fa-solid fa-coins",          iconBg: "rgba(245,158,11,0.15)",  iconColor: "#f59e0b" },
  ];

  return (
    <div className="admin-content">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-desc">Overview of Dream Miner platform</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="admin-stats-grid">
        {cards.map((card) => (
          <Card key={card.label} className="!rounded-[var(--admin-radius)] !border-[var(--admin-border)] !bg-[var(--admin-surface)] !shadow-none !gap-2 !py-5">
            <CardContent className="!px-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium" style={{ color: "var(--admin-text-muted)" }}>{card.label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: card.iconBg }}>
                  <i className={card.icon} style={{ color: card.iconColor, fontSize: 13 }} />
                </div>
              </div>
              <p className="text-2xl font-extrabold" style={{ color: "var(--admin-text)" }}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent users */}
      <Card className="!rounded-[var(--admin-radius)] !border-[var(--admin-border)] !bg-[var(--admin-surface)] !shadow-none">
        <CardHeader title="Recent Users" description="Latest registered users" className="!px-6 !pb-0" />
        <CardContent className="!px-6 !pt-4">
          <div className="flex flex-col">
            {stats.recentUsers.map((u, i) => {
              const name = u.username
                ? `@${u.username}`
                : `${u.firstName} ${u.lastName ?? ""}`.trim();
              const initials = name.replace("@", "").slice(0, 2).toUpperCase();
              return (
                <div key={u.id}>
                  {i > 0 && <Separator className="my-3" />}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar size="md">
                        <AvatarFallback className="text-xs font-bold" style={{ background: "rgba(99,102,241,0.15)", color: "#6366f1" }}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>{name}</span>
                    </div>
                    <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
