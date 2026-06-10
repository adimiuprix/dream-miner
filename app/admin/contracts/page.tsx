import { prisma } from "@/lib/prisma";

const COLS = "1.5fr 1fr 1fr 1fr 1fr 1fr 1fr";

function fmtPower(p: number) {
  if (p >= 1_000_000) return (p / 1_000_000).toFixed(1) + "M";
  if (p >= 1_000)     return (p / 1_000).toFixed(1) + "K";
  return p.toString();
}

export default async function AdminContracts() {
  const contracts = await prisma.contract.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { firstName: true, username: true } },
      plan: { select: { name: true, slug: true } },
    },
  });

  const active  = contracts.filter((c) => c.status === "ACTIVE").length;
  const expired = contracts.filter((c) => c.status === "EXPIRED").length;

  return (
    <div className="admin-content">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Contracts</h1>
          <p className="admin-page-desc">Latest 100 contracts</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="admin-info-card" style={{ padding: "10px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>Active</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#10b981" }}>{active}</div>
          </div>
          <div className="admin-info-card" style={{ padding: "10px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>Expired</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--admin-text-muted)" }}>{expired}</div>
          </div>
        </div>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-head" style={{ gridTemplateColumns: COLS }}>
          <span>User</span>
          <span>Plan</span>
          <span>Power</span>
          <span>Bonus</span>
          <span>Status</span>
          <span>Expires</span>
          <span>Created</span>
        </div>

        {contracts.map((c) => {
          const name = c.user.username ? `@${c.user.username}` : c.user.firstName;
          const expiresAt = new Date(Number(c.expiresAt));
          const isExpired = expiresAt < new Date();

          return (
            <div key={c.id} className="admin-table-row" style={{ gridTemplateColumns: COLS }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--admin-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {name}
                </div>
                <div style={{ fontSize: 11, color: "var(--admin-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.userId}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "var(--admin-text)", fontSize: 13 }}>{c.plan.name}</div>
                <div style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>{c.plan.slug}</div>
              </div>
              <span style={{ color: "var(--admin-text)", fontWeight: 600 }}>{fmtPower(c.power)}</span>
              <span style={{ color: c.bonus > 0 ? "#10b981" : "var(--admin-text-muted)" }}>
                {c.bonus > 0 ? `+${fmtPower(c.bonus)}` : "—"}
              </span>
              <span>
                {c.status === "ACTIVE"
                  ? <span className="admin-badge admin-badge-success">Active</span>
                  : c.status === "CANCELLED"
                    ? <span className="admin-badge admin-badge-danger">Cancelled</span>
                    : <span className="admin-badge admin-badge-muted">Expired</span>}
              </span>
              <span style={{ color: isExpired ? "#ef4444" : "var(--admin-text-muted)", fontSize: 12 }}>
                {expiresAt.toLocaleDateString()}
              </span>
              <span style={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
                {new Date(c.createdAt).toLocaleDateString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
