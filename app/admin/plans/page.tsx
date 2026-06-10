import { prisma } from "@/lib/prisma";

const COLS = "1.5fr 1fr 1fr 1fr 0.7fr 0.8fr 0.5fr 0.5fr";

export default async function AdminPlans() {
  const plans = await prisma.plan.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { contracts: true } } },
  });

  return (
    <div className="admin-content">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Plans</h1>
          <p className="admin-page-desc">{plans.length} plans in database</p>
        </div>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-head" style={{ gridTemplateColumns: COLS }}>
          <span>Name</span>
          <span>Power</span>
          <span>Bonus</span>
          <span>Price</span>
          <span>Duration</span>
          <span>Contracts</span>
          <span>Active</span>
          <span>Free</span>
        </div>

        {plans.map((plan) => (
          <div key={plan.id} className="admin-table-row" style={{ gridTemplateColumns: COLS }}>
            <div>
              <div style={{ fontWeight: 600, color: "var(--admin-text)" }}>{plan.name}</div>
              <div style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>{plan.slug}</div>
            </div>
            <span style={{ color: "var(--admin-text)", fontWeight: 600 }}>
              {plan.power.toLocaleString()}
            </span>
            <span style={{ color: plan.bonus > 0 ? "#10b981" : "var(--admin-text-muted)" }}>
              {plan.bonus > 0 ? `+${plan.bonus.toLocaleString()}` : "—"}
            </span>
            <span style={{ color: "#f59e0b", fontWeight: 700 }}>
              {plan.price === 0 ? (
                <span className="admin-badge admin-badge-info">FREE</span>
              ) : (
                `${plan.price} TON`
              )}
            </span>
            <span style={{ color: "var(--admin-text-muted)" }}>{plan.duration}d</span>
            <span style={{ color: "var(--admin-text-muted)" }}>{plan._count.contracts}</span>
            <span>
              {plan.isActive
                ? <span className="admin-badge admin-badge-success">Yes</span>
                : <span className="admin-badge admin-badge-muted">No</span>}
            </span>
            <span>
              {plan.isFree
                ? <span className="admin-badge admin-badge-info">Yes</span>
                : <span style={{ color: "var(--admin-text-muted)" }}>—</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
