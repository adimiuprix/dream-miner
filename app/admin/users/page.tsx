import { prisma } from "@/lib/prisma";

export default async function AdminUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { contracts: true, transactions: true, referrals: true } },
      contracts: { where: { status: "ACTIVE" }, select: { power: true, bonus: true } },
    },
    take: 100,
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>Users</h1>
          <p className="text-sm mt-1" style={{ color: "#555" }}>{users.length} users (latest 100)</p>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Header */}
        <div
          className="grid gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{
            background: "#1a1a1a",
            color: "#555",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
          }}
        >
          <span>User</span>
          <span>Telegram ID</span>
          <span>Active Power</span>
          <span>Contracts</span>
          <span>Referrals</span>
          <span>Joined</span>
        </div>

        {users.map((user, i) => {
          const activePower = user.contracts.reduce((s, c) => s + c.power + c.bonus, 0);
          const name = user.username
            ? `@${user.username}`
            : `${user.firstName} ${user.lastName ?? ""}`.trim();

          return (
            <div
              key={user.id}
              className="grid gap-4 px-4 py-3 text-sm items-center"
              style={{
                background: i % 2 === 0 ? "#161616" : "#141414",
                borderTop: "1px solid rgba(255,255,255,0.04)",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
              }}
            >
              <div className="min-w-0">
                <p className="font-semibold truncate" style={{ color: "#fff" }}>{name}</p>
                <p className="text-xs truncate" style={{ color: "#555" }}>{user.id}</p>
              </div>
              <span style={{ color: "#888" }}>{String(user.telegramId)}</span>
              <span style={{ color: "var(--dm-green)", fontWeight: 700 }}>
                {activePower >= 1_000_000
                  ? (activePower / 1_000_000).toFixed(1) + "M"
                  : activePower >= 1_000
                    ? (activePower / 1_000).toFixed(1) + "K"
                    : activePower.toString()}
              </span>
              <span style={{ color: "#888" }}>{user._count.contracts}</span>
              <span style={{ color: "#888" }}>{user._count.referrals}</span>
              <span style={{ color: "#555", fontSize: "12px" }}>
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
