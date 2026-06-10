import { prisma } from "@/lib/prisma";

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

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>Swaps</h1>
          <p className="text-sm mt-1" style={{ color: "#555" }}>Latest 100 swap records</p>
        </div>
        <div
          className="rounded-xl px-4 py-2 text-right"
          style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-xs" style={{ color: "#555" }}>Total TON paid out</p>
          <p className="text-lg font-extrabold" style={{ color: "#f5a623" }}>
            {totalTon.toFixed(4)} TON
          </p>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        <div
          className="grid gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{
            background: "#1a1a1a",
            color: "#555",
            gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr",
          }}
        >
          <span>User</span>
          <span>Hashes</span>
          <span>TON Received</span>
          <span>Rate</span>
          <span>Status</span>
          <span>Date</span>
        </div>

        {swaps.map((swap, i) => {
          const name = swap.user.username ? `@${swap.user.username}` : swap.user.firstName;
          const statusColor = swap.status === "COMPLETED"
            ? "var(--dm-green)"
            : swap.status === "FAILED"
              ? "#ef4444"
              : "#555";

          return (
            <div
              key={swap.id}
              className="grid gap-4 px-4 py-3 text-sm items-center"
              style={{
                background: i % 2 === 0 ? "#161616" : "#141414",
                borderTop: "1px solid rgba(255,255,255,0.04)",
                gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr",
              }}
            >
              <div className="min-w-0">
                <p className="font-semibold truncate" style={{ color: "#fff" }}>{name}</p>
                <p className="text-xs truncate" style={{ color: "#555" }}>{swap.userId}</p>
              </div>
              <span style={{ color: "#3b82f6", fontWeight: 700 }}>
                {swap.hashesSwapped >= 1_000
                  ? (swap.hashesSwapped / 1_000).toFixed(1) + "K"
                  : swap.hashesSwapped.toFixed(2)}
              </span>
              <span style={{ color: "#f5a623", fontWeight: 700 }}>
                {swap.tonReceived.toFixed(6)} TON
              </span>
              <span style={{ color: "#555", fontSize: "11px" }}>
                {swap.exchangeRate.toFixed(8)}
              </span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full inline-block"
                style={{ color: statusColor, background: `${statusColor}22` }}
              >
                {swap.status}
              </span>
              <span style={{ color: "#555", fontSize: "12px" }}>
                {new Date(swap.createdAt).toLocaleDateString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
