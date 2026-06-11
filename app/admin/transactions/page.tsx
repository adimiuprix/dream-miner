"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

interface Transaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  status: string;
  txHash: string | null;
  createdAt: string;
  user: { firstName: string; username: string | null };
}

const statusVariant: Record<string, BadgeVariant> = {
  COMPLETED: "success",
  PENDING:   "warning",
  FAILED:    "destructive",
  CANCELLED: "secondary",
};

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/transactions")
      .then((r) => r.json())
      .then((data) => { if (data.success) setTransactions(data.transactions); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
        <Card className="!rounded-[var(--admin-radius)] !border-[var(--admin-border)] !bg-[var(--admin-surface)] !shadow-none !gap-1 !py-3">
          <CardContent className="!px-5">
            <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Total Revenue</p>
            <p className="text-xl font-extrabold" style={{ color: "#f59e0b" }}>
              {loading ? "…" : totalRevenue.toFixed(4) + " TON"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="!rounded-[var(--admin-radius)] !border-[var(--admin-border)] !bg-[var(--admin-surface)] !shadow-none !gap-0 !py-0">
        <Table variant="striped">
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>TX Hash</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [0,1,2,3,4].map((i) => (
                <TableRow key={i}>
                  {[0,1,2,3,4,5].map((j) => (
                    <TableCell key={j}>
                      <div className="h-4 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.06)", width: j === 0 ? 140 : 80 }} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              transactions.map((tx) => {
                const name = tx.user.username ? `@${tx.user.username}` : tx.user.firstName;
                return (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="font-semibold text-sm" style={{ color: "var(--admin-text)" }}>{name}</div>
                      <div className="text-xs font-mono" style={{ color: "var(--admin-text-muted)" }}>{tx.userId.slice(0,12)}…</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                        {tx.type.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-sm" style={{ color: "#f59e0b" }}>{tx.amount} TON</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[tx.status] ?? "secondary"} pill>
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono" style={{ color: "var(--admin-text-muted)" }} title={tx.txHash ?? ""}>
                        {tx.txHash ? tx.txHash.slice(0, 20) + "…" : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
