import { prisma } from "@/lib/prisma";

async function getStats() {
  const [totalUsers, totalContracts, activeContracts, totalTransactions, completedTx, totalSwaps] =
    await Promise.all([
      prisma.user.count(),
      prisma.contract.count(),
      prisma.contract.count({ where: { status: "ACTIVE" } }),
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: "COMPLETED", type: "PURCHASE_POWER" } }),
      prisma.swap.count({ where: { status: "COMPLETED" } }),
    ]);

  const revenue = await prisma.transaction.aggregate({
    where: { status: "COMPLETED", type: "PURCHASE_POWER" },
    _sum: { amount: true },
  });

  return {
    totalUsers,
    totalContracts,
    activeContracts,
    totalTransactions,
    completedTx,
    totalSwaps,
    totalRevenue: revenue._sum.amount ?? 0,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "Total Users",        value: stats.totalUsers.toLocaleString(),          icon: "fa-solid fa-users",          color: "#3b82f6" },
    { label: "Active Contracts",   value: stats.activeContracts.toLocaleString(),     icon: "fa-solid fa-file-contract",  color: "var(--dm-green)" },
    { label: "Total Contracts",    value: stats.totalContracts.toLocaleString(),      icon: "fa-solid fa-box",            color: "#8b5cf6" },
    { label: "Completed Purchases",value: stats.completedTx.toLocaleString(),         icon: "fa-solid fa-receipt",        color: "#f5a623" },
    { label: "Total Swaps",        value: stats.totalSwaps.toLocaleString(),          icon: "fa-solid fa-arrows-rotate",  color: "#ec4899" },
    { label: "Total Revenue (TON)",value: stats.totalRevenue.toFixed(4) + " TON",     icon: "fa-solid fa-coins",          color: "#f5a623" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "#555" }}>Overview of Dream Miner</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl p-5"
            style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm" style={{ color: "#555" }}>{card.label}</p>
              <i className={card.icon} style={{ color: card.color, fontSize: "16px" }} />
            </div>
            <p className="text-2xl font-extrabold" style={{ color: "#fff" }}>{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
