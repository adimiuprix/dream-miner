import { prisma } from "@/lib/prisma";

function fmtPower(p: number) {
  if (p >= 1_000_000) return (p / 1_000_000).toFixed(1) + "M";
  if (p >= 1_000)     return (p / 1_000).toFixed(1) + "K";
  return p > 0 ? p.toString() : "—";
}

const COLS = "2fr 1.2fr 1fr 0.8fr 0.8fr 1fr";

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
    <div className="admin-content">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Users</h1>
          <p className="admin-page-desc">{users.length} users — latest 100</p>
        </div>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-head" style={{ gridTemplateColumns: COLS }}>
          <span>User</span>
          <span>Telegram ID</span>
          <span>Active Power</span>
          <span>Contracts</span>
          <span>Referrals</span>
          <span>Joined</span>
        </div>

        {users.map((user) => {
          const activePower = user.contracts.reduce((s, c) => s + c.power + c.bonus, 0);
          const name = user.username
            ? `@${user.username}`
            : `${user.firstName} ${user.lastName ?? ""}`.trim();

          return (
            <div key={user.id} className="admin-table-row" style={{ gridTemplateColumns: COLS }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--admin-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {name}
                </div>
                <div style={{ fontSize: 11, color: "var(--admin-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.id}
                </div>
              </div>
              <span style={{ color: "var(--admin-text-muted)", fontFamily: "monospace", fontSize: 12 }}>
                {String(user.telegramId)}
              </span>
              <span style={{ color: "#10b981", fontWeight: 700 }}>
                {fmtPower(activePower)}
              </span>
              <span style={{ color: "var(--admin-text-muted)" }}>{user._count.contracts}</span>
              <span style={{ color: "var(--admin-text-muted)" }}>{user._count.referrals}</span>
              <span style={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
