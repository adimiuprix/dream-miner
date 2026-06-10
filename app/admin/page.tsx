import { prisma } from "@/lib/prisma";

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
    take: 5,
    select: { firstName: true, username: true, createdAt: true },
  });

  return { totalUsers, totalContracts, activeContracts, completedTx, totalSwaps, totalRevenue: revenue._sum.amount ?? 0, recentUsers };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: "fa-solid fa-users",
      iconBg: "rgba(59,130,246,0.15)",
      iconColor: "#3b82f6",
    },
    {
      label: "Active Contracts",
      value: stats.activeContracts.toLocaleString(),
      icon: "fa-solid fa-file-contract",
      iconBg: "rgba(16,185,129,0.15)",
      iconColor: "#10b981",
    },
    {
      label: "Total Contracts",
      value: stats.totalContracts.toLocaleString(),
      icon: "fa-solid fa-box",
      iconBg: "rgba(139,92,246,0.15)",
      iconColor: "#8b5cf6",
    },
    {
      label: "Purchases",
      value: stats.completedTx.toLocaleString(),
      icon: "fa-solid fa-receipt",
      iconBg: "rgba(245,158,11,0.15)",
      iconColor: "#f59e0b",
    },
    {
      label: "Completed Swaps",
      value: stats.totalSwaps.toLocaleString(),
      icon: "fa-solid fa-arrows-rotate",
      iconBg: "rgba(236,72,153,0.15)",
      iconColor: "#ec4899",
    },
    {
      label: "Revenue",
      value: stats.totalRevenue.toFixed(2) + " TON",
      icon: "fa-solid fa-coins",
      iconBg: "rgba(245,158,11,0.15)",
      iconColor: "#f59e0b",
    },
  ];

  return (
    <div className="admin-content">
      {/* Page header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-desc">Overview of Dream Miner platform</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="admin-stats-grid">
        {cards.map((card) => (
          <div key={card.label} className="admin-stat-card">
            <div className="admin-stat-label">
              {card.label}
              <div
                className="admin-stat-icon"
                style={{ background: card.iconBg }}
              >
                <i className={card.icon} style={{ color: card.iconColor }} />
              </div>
            </div>
            <div className="admin-stat-value">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Recent users */}
      <div className="admin-info-card">
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: "var(--admin-text)" }}>
          Recent Users
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {stats.recentUsers.map((u) => (
            <div
              key={u.createdAt.toISOString()}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <span style={{ fontSize: 13, color: "var(--admin-text)" }}>
                {u.username ? `@${u.username}` : u.firstName}
              </span>
              <span style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                {new Date(u.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
