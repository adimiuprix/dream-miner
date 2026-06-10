import { prisma } from "@/lib/prisma";

export default async function AdminTransactions() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { firstName: true, username: true } },
    },
  });

  const statusColor: Record<string, string> = {
    COMPLETED: "var(--dm-green)",
    PENDING:   "#f5a623",
    FAILED:    "#ef4444",
    CANCELLED: "#555",
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>Transactions</h1>
        <p className="text-sm mt-1" style={{ color: "#555" }}>Latest 100 transactions</p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        <div
          className="grid gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{
            background: "#1a1a1a",
            color: "#555",
            gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1.5fr 1fr",
          }}
        >
          <span>User</span>
          <span>Type</span>
          <span>Amount</span>
          <span>Status</span>
          <span>TX Hash</span>
          <span>Date</span>
        </div>

        {transactions.map((tx, i) => {
          const name = tx.user.username ? `@${tx.user.username}` : tx.user.firstName;
          return (
            <div
              key={tx.id}
              className="grid gap-4 px-4 py-3 text-sm items-center"
              style={{
                background: i % 2 === 0 ? "#161616" : "#141414",
                borderTop: "1px solid rgba(255,255,255,0.04)",
                gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1.5fr 1fr",
              }}
            >
              <div className="min-w-0">
                <p className="font-semibold truncate" style={{ color: "#fff" }}>{name}</p>
                <p className="text-xs truncate" style={{ color: "#555" }}>{tx.userId}</p>
              </div>
              <span style={{ color: "#888", fontSize: "11px" }}>{tx.type}</span>
              <span style={{ color: "#f5a623", fontWeight: 700 }}>{tx.amount} TON</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full inline-block"
                style={{
                  color: statusColor[tx.status] ?? "#888",
                  background: `${statusColor[tx.status]}22` ?? "transparent",
                }}
              >
                {tx.status}
              </span>
              <span
                className="text-xs font-mono truncate"
                style={{ color: "#555" }}
                title={tx.txHash ?? ""}
              >
                {tx.txHash ? tx.txHash.slice(0, 20) + "..." : "—"}
              </span>
              <span style={{ color: "#555", fontSize: "12px" }}>
                {new Date(tx.createdAt).toLocaleDateString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
