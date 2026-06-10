import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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

      <Card className="!rounded-[var(--admin-radius)] !border-[var(--admin-border)] !bg-[var(--admin-surface)] !shadow-none !gap-0 !py-0">
        <Table variant="striped">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Power</TableHead>
              <TableHead>Bonus</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Contracts</TableHead>
              <TableHead>Visible</TableHead>
              <TableHead>Free</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>
                  <div className="font-semibold text-sm" style={{ color: "var(--admin-text)" }}>{plan.name}</div>
                  <div className="text-xs" style={{ color: "var(--admin-text-muted)" }}>{plan.slug}</div>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-sm" style={{ color: "var(--admin-text)" }}>
                    {plan.power.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  {plan.bonus > 0
                    ? <Badge variant="success" pill>+{plan.bonus.toLocaleString()}</Badge>
                    : <span style={{ color: "var(--admin-text-muted)" }}>—</span>}
                </TableCell>
                <TableCell>
                  {plan.price === 0
                    ? <Badge variant="info" pill>FREE</Badge>
                    : <span className="font-bold text-sm" style={{ color: "#f59e0b" }}>{plan.price} TON</span>}
                </TableCell>
                <TableCell>
                  <span style={{ color: "var(--admin-text-muted)" }}>{plan.duration}d</span>
                </TableCell>
                <TableCell>
                  <span style={{ color: "var(--admin-text-muted)" }}>{plan._count.contracts}</span>
                </TableCell>
                <TableCell>
                  {plan.isActive
                    ? <Badge variant="success" pill>Yes</Badge>
                    : <Badge variant="secondary" pill>Hidden</Badge>}
                </TableCell>
                <TableCell>
                  {plan.isFree
                    ? <Badge variant="info" pill>Yes</Badge>
                    : <span style={{ color: "var(--admin-text-muted)" }}>—</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
