import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

function fmtPower(p: number) {
  if (p >= 1_000_000) return (p / 1_000_000).toFixed(1) + "M";
  if (p >= 1_000)     return (p / 1_000).toFixed(1) + "K";
  return p.toString();
}

const statusVariant: Record<string, BadgeVariant> = {
  ACTIVE:    "success",
  EXPIRED:   "secondary",
  CANCELLED: "destructive",
};

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
        <div className="flex gap-3">
          <Card className="!rounded-[var(--admin-radius)] !border-[var(--admin-border)] !bg-[var(--admin-surface)] !shadow-none !gap-1 !py-3 text-center">
            <CardContent className="!px-5">
              <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Active</p>
              <p className="text-xl font-extrabold" style={{ color: "#10b981" }}>{active}</p>
            </CardContent>
          </Card>
          <Card className="!rounded-[var(--admin-radius)] !border-[var(--admin-border)] !bg-[var(--admin-surface)] !shadow-none !gap-1 !py-3 text-center">
            <CardContent className="!px-5">
              <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Expired</p>
              <p className="text-xl font-extrabold" style={{ color: "var(--admin-text-muted)" }}>{expired}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="!rounded-[var(--admin-radius)] !border-[var(--admin-border)] !bg-[var(--admin-surface)] !shadow-none !gap-0 !py-0">
        <Table variant="striped">
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Power</TableHead>
              <TableHead>Bonus</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((c) => {
              const name = c.user.username ? `@${c.user.username}` : c.user.firstName;
              const expiresAt = new Date(Number(c.expiresAt));
              const isExpired = expiresAt < new Date();

              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-semibold text-sm" style={{ color: "var(--admin-text)" }}>{name}</div>
                    <div className="text-xs font-mono" style={{ color: "var(--admin-text-muted)" }}>{c.userId.slice(0,12)}…</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-sm" style={{ color: "var(--admin-text)" }}>{c.plan.name}</div>
                    <div className="text-xs" style={{ color: "var(--admin-text-muted)" }}>{c.plan.slug}</div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-sm" style={{ color: "var(--admin-text)" }}>
                      {fmtPower(c.power)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {c.bonus > 0
                      ? <Badge variant="success" pill>+{fmtPower(c.bonus)}</Badge>
                      : <span style={{ color: "var(--admin-text-muted)" }}>—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[c.status] ?? "secondary"} pill>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs" style={{ color: isExpired ? "#ef4444" : "var(--admin-text-muted)" }}>
                      {expiresAt.toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
