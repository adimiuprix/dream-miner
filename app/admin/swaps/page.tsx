"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

interface Swap {
  id: string;
  userId: string;
  hashesSwapped: number;
  tonReceived: number;
  exchangeRate: number;
  status: string;
  createdAt: string;
  user: { firstName: string; username: string | null };
}

const statusVariant: Record<string, BadgeVariant> = {
  COMPLETED: "success",
  PENDING:   "warning",
  FAILED:    "destructive",
  CANCELLED: "secondary",
};

function fmtHashes(h: number) {
  if (h >= 1_000_000) return (h / 1_000_000).toFixed(1) + "M";
  if (h >= 1_000)     return (h / 1_000).toFixed(1) + "K";
  return h.toFixed(2);
}

export default function AdminSwaps() {
  const [swaps, setSwaps]   = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/swaps")
      .then((r) => r.json())
      .then((data) => { if (data.success) setSwaps(data.swaps); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalTon    = swaps.filter((s) => s.status === "COMPLETED").reduce((s, sw) => s + sw.tonReceived, 0);
  const totalHashes = swaps.filter((s) => s.status === "COMPLETED").reduce((s, sw) => s + sw.hashesSwapped, 0);

  return (
    <div className="admin-content">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Swaps</h1>
          <p className="admin-page-desc">Latest 100 swap records</p>
        </div>
        <div className="flex gap-3">
          <Card className="!rounded-[var(--admin-radius)] !border-[var(--admin-border)] !bg-[var(--admin-surface)] !shadow-none !gap-1 !py-3 text-right">
            <CardContent className="!px-5">
              <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>TON Paid Out</p>
              <p className="text-xl font-extrabold" style={{ color: "#f59e0b" }}>
                {loading ? "…" : totalTon.toFixed(4)}
              </p>
            </CardContent>
          </Card>
          <Card className="!rounded-[var(--admin-radius)] !border-[var(--admin-border)] !bg-[var(--admin-surface)] !shadow-none !gap-1 !py-3 text-right">
            <CardContent className="!px-5">
              <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Hashes Swapped</p>
              <p className="text-xl font-extrabold" style={{ color: "#3b82f6" }}>
                {loading ? "…" : fmtHashes(totalHashes)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="!rounded-[var(--admin-radius)] !border-[var(--admin-border)] !bg-[var(--admin-surface)] !shadow-none !gap-0 !py-0">
        <Table variant="striped">
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Hashes</TableHead>
              <TableHead>TON Received</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Status</TableHead>
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
              swaps.map((swap) => {
                const name = swap.user.username ? `@${swap.user.username}` : swap.user.firstName;
                return (
                  <TableRow key={swap.id}>
                    <TableCell>
                      <div className="font-semibold text-sm" style={{ color: "var(--admin-text)" }}>{name}</div>
                      <div className="text-xs font-mono" style={{ color: "var(--admin-text-muted)" }}>{swap.userId.slice(0,12)}…</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-sm" style={{ color: "#3b82f6" }}>
                        {fmtHashes(swap.hashesSwapped)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-sm" style={{ color: "#f59e0b" }}>
                        {swap.tonReceived.toFixed(6)} TON
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono" style={{ color: "var(--admin-text-muted)" }}>
                        {swap.exchangeRate.toFixed(8)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[swap.status] ?? "secondary"} pill>
                        {swap.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                        {new Date(swap.createdAt).toLocaleDateString()}
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
