"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface User {
  id: string;
  firstName: string;
  lastName: string | null;
  username: string | null;
  telegramId: string;
  walletAddress: string | null;
  createdAt: string;
  _count: { contracts: number; transactions: number; referrals: number };
  contracts: { power: number; bonus: number }[];
}

const COLORS = ["#6366f1","#3b82f6","#10b981","#f59e0b","#ec4899","#8b5cf6","#ef4444","#14b8a6"];

function fmtPower(p: number) {
  if (p >= 1_000_000) return (p / 1_000_000).toFixed(1) + "M";
  if (p >= 1_000)     return (p / 1_000).toFixed(1) + "K";
  return p > 0 ? p.toString() : "—";
}

export default function AdminUsers() {
  const [users, setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => { if (data.success) setUsers(data.users); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-content">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Users</h1>
          <p className="admin-page-desc">{loading ? "Loading…" : `${users.length} users — latest 100`}</p>
        </div>
      </div>

      <Card className="!rounded-[var(--admin-radius)] !border-[var(--admin-border)] !bg-[var(--admin-surface)] !shadow-none !gap-0 !py-0">
        <Table variant="striped">
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Telegram ID</TableHead>
              <TableHead>Active Power</TableHead>
              <TableHead>Contracts</TableHead>
              <TableHead>Referrals</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [0,1,2,3,4].map((i) => (
                <TableRow key={i}>
                  {[0,1,2,3,4,5,6].map((j) => (
                    <TableCell key={j}>
                      <div className="h-4 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.06)", width: j === 0 ? 140 : 60 }} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              users.map((user, i) => {
                const activePower = user.contracts.reduce((s, c) => s + c.power + c.bonus, 0);
                const name = user.username
                  ? `@${user.username}`
                  : `${user.firstName} ${user.lastName ?? ""}`.trim();
                const initials = name.replace("@","").slice(0,2).toUpperCase();

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm">
                          <AvatarFallback
                            className="text-xs font-bold"
                            style={{ background: `${COLORS[i % COLORS.length]}22`, color: COLORS[i % COLORS.length] }}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-sm" style={{ color: "var(--admin-text)" }}>{name}</div>
                          <div className="text-xs font-mono" style={{ color: "var(--admin-text-muted)" }}>{user.id.slice(0,12)}…</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs" style={{ color: "var(--admin-text-muted)" }}>
                        {user.telegramId}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="success" pill>{fmtPower(activePower)}</Badge>
                    </TableCell>
                    <TableCell>
                      <span style={{ color: "var(--admin-text-muted)" }}>{user._count.contracts}</span>
                    </TableCell>
                    <TableCell>
                      <span style={{ color: "var(--admin-text-muted)" }}>{user._count.referrals}</span>
                    </TableCell>
                    <TableCell>
                      {user.walletAddress
                        ? <Badge variant="info" pill>Connected</Badge>
                        : <Badge variant="secondary" pill>None</Badge>}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                        {new Date(user.createdAt).toLocaleDateString()}
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
