import { prisma } from "@/lib/prisma";

export default async function AdminContracts() {
  const contracts = await prisma.contract.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user:  { select: { firstName: true, username: true } },
      plan:  { select: { name: true, slug: true } },
    },
  });

  const statusColor: Record<string, string> = {
    ACTIVE:    "var(--dm-green)",
    EXPIRED:   "#555",
    CANCELLED: "#ef4444",
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>Contracts</h1>
        <p className="text-sm mt-1" style={{ color: "#555" }}>Latest 100 contracts</p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        <div
          className="grid gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{
            background: "#1a1a1a",
            color: "#555",
            gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr 1fr",
          }}
        >
          <span>User</span>
          <span>Plan</span>
          <span>Power</span>
          <span>Bonus</span>
          <span>Status</span>
          <span>Expires</span>
          <span>Created</span>
        </div>

        {contracts.map((c, i) => {
          const name = c.user.username ? `@${c.user.username}` : c.user.firstName;
          const expiresAt = new Date(Number(c.expiresAt));
          const isExpired = expiresAt < new Date();

          return (
            <div
              key={c.id}
              className="grid gap-4 px-4 py-3 text-sm items-center"
              style={{
                background: i % 2 === 0 ? "#161616" : "#141414",
                borderTop: "1px solid rgba(255,255,255,0.04)",
                gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr 1fr",
              }}
            >
              <div className="min-w-0">
                <p className="font-semibold truncate" style={{ color: "#fff" }}>{name}</p>
                <p className="text-xs truncate" style={{ color: "#555" }}>{c.userId}</p>
              </div>
              <div>
                <p className="font-semibold" style={{ color: "#e5e5e5" }}>{c.plan.name}</p>
                <p className="text-xs" style={{ color: "#555" }}>{c.plan.slug}</p>
              </div>
              <span style={{ color: "#e5e5e5" }}>
                {c.power >= 1_000_000
                  ? (c.power / 1_000_000).toFixed(1) + "M"
                  : c.power >= 1_000
                    ? (c.power / 1_000).toFixed(1) + "K"
                    : c.power.toString()}
              </span>
              <span style={{ color: c.bonus > 0 ? "var(--dm-green)" : "#555" }}>
                {c.bonus > 0 ? `+${(c.bonus / 1_000).toFixed(0)}K` : "—"}
              </span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full inline-block"
                style={{
                  color: statusColor[c.status] ?? "#888",
                  background: `${statusColor[c.status]}22`,
                }}
              >
                {c.status}
              </span>
              <span style={{ color: isExpired ? "#ef4444" : "#888", fontSize: "12px" }}>
                {expiresAt.toLocaleDateString()}
              </span>
              <span style={{ color: "#555", fontSize: "12px" }}>
                {new Date(c.createdAt).toLocaleDateString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
