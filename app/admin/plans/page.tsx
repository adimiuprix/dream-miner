import { prisma } from "@/lib/prisma";

export default async function AdminPlans() {
  const plans = await prisma.plan.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { contracts: true } } },
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>Plans</h1>
        <p className="text-sm mt-1" style={{ color: "#555" }}>{plans.length} plans in database</p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        <div
          className="grid gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{
            background: "#1a1a1a",
            color: "#555",
            gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr 0.5fr 0.5fr",
          }}
        >
          <span>Name</span>
          <span>Power</span>
          <span>Bonus</span>
          <span>Price (TON)</span>
          <span>Duration</span>
          <span>Contracts</span>
          <span>Active</span>
          <span>Free</span>
        </div>

        {plans.map((plan, i) => (
          <div
            key={plan.id}
            className="grid gap-4 px-4 py-3 text-sm items-center"
            style={{
              background: i % 2 === 0 ? "#161616" : "#141414",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr 0.5fr 0.5fr",
            }}
          >
            <div>
              <p className="font-semibold" style={{ color: "#fff" }}>{plan.name}</p>
              <p className="text-xs" style={{ color: "#555" }}>{plan.slug}</p>
            </div>
            <span style={{ color: "#e5e5e5" }}>{plan.power.toLocaleString()}</span>
            <span style={{ color: plan.bonus > 0 ? "var(--dm-green)" : "#555" }}>
              {plan.bonus > 0 ? `+${plan.bonus.toLocaleString()}` : "—"}
            </span>
            <span style={{ color: "#f5a623", fontWeight: 700 }}>
              {plan.price === 0 ? "FREE" : plan.price + " TON"}
            </span>
            <span style={{ color: "#888" }}>{plan.duration}d</span>
            <span style={{ color: "#888" }}>{plan._count.contracts}</span>
            <span style={{ color: plan.isActive ? "var(--dm-green)" : "#ef4444" }}>
              {plan.isActive ? "✓" : "✗"}
            </span>
            <span style={{ color: plan.isFree ? "#3b82f6" : "#555" }}>
              {plan.isFree ? "✓" : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
