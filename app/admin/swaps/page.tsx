import { prisma } from "@/lib/prisma";

const COLS = "1.5fr 1fr 1fr 1fr 1fr 1fr";

export default async function AdminSwaps() {
  const swaps = await prisma.swap.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { firstName: true, username: true } },
    },
  });

  const totalTon = swaps
    .filter((s) => s.status === "COMPLETED")
    .reduce((sum, s) => sum + s.tonReceived, 0);

  const totalHashes = swaps
    .filter((s) => s.status === "COMPLETED")
    .reduce((sum, s) => sum + s.hashesSwapped, 0);

  return (
    <div className="admin-content">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Swaps</h1>
          <p className="admin-page-desc">Latest 100 swap records</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="admin-info-card" style={{ padding: "10px 18px", textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>TON Paid Out</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f59e0b" }}>
              {totalTon.toFixed(4)} TON
            </div>
          </div>
          <div className="admin-info-card" style={{ padding: "10px 18px", textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>Hashes Swapped</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#3b82f6" }}>
              {totalHashes >= 1_000_000
                ? (totalHashes / 1_000_000).toFixed(1) + "M"
                : totalHashes >= 1_000
                  ? (totalHashes / 1_000).toFixed(1) + "K"
                  : totalHashes.toFixed(0)}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-head" style={{ gridTemplateColumns: COLS }}>
          <span>User</span>
          <span>Hashes</span>
          <span>TON Received</span>
          <span>Rate</span>
          <span>Status</span>
          <span>Date</span>
        </div>

        {swaps.map((swap) => {
          const name = swap.user.username ? `@${swap.user.username}` : swap.user.firstName;
          return (
            <div key={swap.id} className="admin-table-row" style={{ gridTemplateColumns: COLS }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--admin-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {name}
                </div>
                <div style={{ fontSize: 11, color: "var(--admin-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {swap.userId}
                </div>
              </div>
              <span style={{ color: "#3b82f6", fontWeight: 700 }}>
                {swap.hashesSwapped >= 1_000
                  ? (swap.hashesSwapped / 1_000).toFixed(1) + "K"
                  : swap.hashesSwapped.toFixed(2)}
              </span>
              <span style={{ color: "#f59e0b", fontWeight: 700 }}>
                {swap.tonReceived.toFixed(6)}
              </span>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--admin-text-muted)" }}>
                {swap.exchangeRate.toFixed(8)}
              </span>
              <span>
                {swap.status === "COMPLETED"
                  ? <span className="admin-badge admin-badge-success">Completed</span>
                  : swap.status === "FAILED"
                    ? <span className="admin-badge admin-badge-danger">Failed</span>
                    : <span className="admin-badge admin-badge-muted">{swap.status}</span>}
              </span>
              <span style={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
                {new Date(swap.createdAt).toLocaleDateString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
