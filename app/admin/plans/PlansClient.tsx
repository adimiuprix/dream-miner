"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PlanFormDialog from "./PlanFormDialog";
import DeletePlanDialog from "./DeletePlanDialog";

interface Plan {
  id:          string;
  name:        string;
  slug:        string;
  power:       number;
  bonus:       number;
  bonusPercent:number;
  price:       number;
  duration:    number;
  description: string | null;
  finalReturn: string | null;
  badge:       string | null;
  badgeColor:  string | null;
  order:       number;
  isActive:    boolean;
  isFree:      boolean;
  _count:      { contracts: number };
}

export default function PlansClient({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen]     = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editPlan, setEditPlan]     = useState<Plan | null>(null);
  const [deletePlan, setDeletePlan] = useState<Plan | null>(null);

  const refresh = useCallback(() => router.refresh(), [router]);

  function openCreate() {
    setEditPlan(null);
    setFormOpen(true);
  }

  function openEdit(plan: Plan) {
    setEditPlan(plan);
    setFormOpen(true);
  }

  function openDelete(plan: Plan) {
    setDeletePlan(plan);
    setDeleteOpen(true);
  }

  return (
    <>
      <div className="admin-content">
        {/* Header */}
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Plans</h1>
            <p className="admin-page-desc">{plans.length} plans in database</p>
          </div>
          <Button onClick={openCreate}>
            <i className="fa-solid fa-plus" />
            New Plan
          </Button>
        </div>

        {/* Table */}
        <Card className="!rounded-[var(--admin-radius)] !border-[var(--admin-border)] !bg-[var(--admin-surface)] !shadow-none !gap-0 !py-0">
          <Table variant="striped">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Power</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Return</TableHead>
                <TableHead>Contracts</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead>Free</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: "var(--admin-text)" }}>
                        {plan.name}
                        {plan.badge && (
                          <span
                            className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded"
                            style={{ background: `${plan.badgeColor ?? "#6366f1"}22`, color: plan.badgeColor ?? "#6366f1" }}
                          >
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs" style={{ color: "var(--admin-text-muted)" }}>{plan.slug}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-sm" style={{ color: "var(--admin-text)" }}>
                      {plan.power >= 1_000_000 ? (plan.power/1_000_000).toFixed(1)+"M" : plan.power >= 1_000 ? (plan.power/1_000).toFixed(0)+"K" : plan.power}
                    </span>
                  </TableCell>
                  <TableCell>
                    {plan.bonus > 0
                      ? <Badge variant="success" pill>+{plan.bonus >= 1_000_000 ? (plan.bonus/1_000_000).toFixed(1)+"M" : (plan.bonus/1_000).toFixed(0)+"K"}</Badge>
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
                    <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                      {plan.finalReturn ?? "—"}
                    </span>
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
                  <TableCell>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => openEdit(plan)}
                        aria-label="Edit"
                      >
                        <i className="fa-solid fa-pen text-xs" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => openDelete(plan)}
                        aria-label="Delete"
                        className="hover:!border-red-500/50 hover:!text-red-400"
                      >
                        <i className="fa-solid fa-trash text-xs" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Create / Edit dialog */}
      <PlanFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        plan={editPlan}
        onSuccess={refresh}
      />

      {/* Delete dialog */}
      {deletePlan && (
        <DeletePlanDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          planId={deletePlan.id}
          planName={deletePlan.name}
          onSuccess={refresh}
        />
      )}
    </>
  );
}
