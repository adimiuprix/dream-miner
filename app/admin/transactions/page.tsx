import { prisma } from "@/lib/prisma";

const COLS = "1.5fr 1fr 1fr 1fr 1.8fr 1fr";

const statusBadge: Record<string, string> = {
  COMPLETED: "admin-badge-success",
  PENDING:   "admin-badge-warning",
  FAILED:    "admin-badge-danger",
  CANCELLED: "admin-badge-muted",
};

export default async function AdminTransactions() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { firstName: true, username: true } },
    },
  });

  const totalRevenue = transactions
    .filter((t) => t.status === "COMPLETED" && t.type === "PURCHASE_POWER")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="admin-content">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Transactions</h1>
          <p className="admin-page-desc">Latest 100 transactions</p>
        </div>
        <div className="admin-info-card" style={{ textAlign: "right", padding: "12px 18px" }}>
          <div style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>Total Revenue</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#f59e0b" }}>
            {totalRevenue.toFixed(4)} TON
          </div>
        </div>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-head" style={{ gridTemplateColumns: COLS }}>
          <span>User</span>
          <span>Type</span>
          <span>Amount</span>
          <span>Status</span>
          <span>TX Hash</span>
          <span>Date</span>
        </div>

        {transactions.map((tx) => {
          const name = tx.user.username ? `@${tx.user.username}` : tx.user.firstName;
          return (
            <div key={tx.id} className="admin-table-row" style={{ gridTemplateColumns: COLS }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--admin-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {name}
                </div>
                <div style={{ fontSize: 11, color: "var(--admin-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {tx.userId}
                </div>
              </div>
              <span style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
                {tx.type.replace("_", " ")}
              </span>
              <span style={{ color: "#f59e0b", fontWeight: 700 }}>{tx.amount} TON</span>
              <span className={`admin-badge ${statusBadge[tx.status] ?? "admin-badge-muted"}`}>
                {tx.status}
              </span>
              <span
                style={{ fontSize: 11, fontFamily: "monospace", color: "var(--admin-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                title={tx.txHash ?? ""}
              >
                {tx.txHash ? tx.txHash.slice(0, 24) + "…" : "—"}
              </span>
              <span style={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
                {new Date(tx.createdAt).toLocaleDateString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
