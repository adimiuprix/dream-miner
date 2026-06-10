"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldHelper } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";

export interface PlanFormData {
  name: string; slug: string; power: number; bonus: number; bonusPercent: number;
  price: number; duration: number; description: string; finalReturn: string;
  badge: string; badgeColor: string; order: number; isActive: boolean; isFree: boolean;
}
const POWER_TO_HASH_RATE = 100_000;  // 100K power = 1 hash/sec
const HASH_TO_TON        = 0.0000144; // 1 hash = 0.0000144 TON

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
}

interface PlanFormDialogProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  plan?:        Plan | null;  // null = create mode
  onSuccess:    () => void;
}

const EMPTY: PlanFormData = {
  name: "", slug: "", power: 0, bonus: 0, bonusPercent: 0,
  price: 0, duration: 30, description: "", finalReturn: "",
  badge: "", badgeColor: "#00d4aa", order: 0,
  isActive: true, isFree: false,
};

// ─── Real-time stats calculation ──────────────────────────────────────────────
function calcStats(power: number, bonus: number, price: number, duration: number) {
  const totalPower   = power + bonus;
  const hashPerSec   = totalPower / POWER_TO_HASH_RATE;
  const hashPerDay   = hashPerSec * 86_400;
  const hashTotal    = hashPerDay * duration;
  const tonReturn    = hashTotal * HASH_TO_TON;
  const roi          = price > 0 ? ((tonReturn - price) / price) * 100 : 0;
  return { totalPower, hashPerSec, hashPerDay, hashTotal, tonReturn, roi };
}

function fmt(n: number, decimals = 2) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(decimals) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(decimals) + "K";
  return n.toFixed(decimals);
}

// ─── Form ─────────────────────────────────────────────────────────────────────
export default function PlanFormDialog({ open, onOpenChange, plan, onSuccess }: PlanFormDialogProps) {
  const isEdit = !!plan;
  const [form, setForm]   = useState<PlanFormData>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setError(null);
      setForm(plan ? {
        name:        plan.name,
        slug:        plan.slug,
        power:       plan.power,
        bonus:       plan.bonus,
        bonusPercent:plan.bonusPercent,
        price:       plan.price,
        duration:    plan.duration,
        description: plan.description ?? "",
        finalReturn: plan.finalReturn ?? "",
        badge:       plan.badge ?? "",
        badgeColor:  plan.badgeColor ?? "#00d4aa",
        order:       plan.order,
        isActive:    plan.isActive,
        isFree:      plan.isFree,
      } : EMPTY);
    }
  }, [open, plan]);

  // Auto-generate slug from name
  function handleNameChange(val: string) {
    const slug = val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setForm((f) => ({ ...f, name: val, slug: isEdit ? f.slug : `plan-${slug}` }));
  }

  // Auto-calc bonusPercent when power or bonus changes
  function handlePowerChange(val: number) {
    const bp = val > 0 && form.bonus > 0 ? Math.round((form.bonus / val) * 100) : 0;
    setForm((f) => ({ ...f, power: val, bonusPercent: bp }));
  }

  function handleBonusChange(val: number) {
    const bp = form.power > 0 && val > 0 ? Math.round((val / form.power) * 100) : 0;
    setForm((f) => ({ ...f, bonus: val, bonusPercent: bp }));
  }

  const stats = calcStats(form.power, form.bonus, form.price, form.duration);

  async function handleSubmit() {
    if (!form.name || !form.slug) {
      setError("Name and slug are required");
      return;
    }
    setError(null);
    setIsPending(true);
    try {
      const url    = isEdit ? `/api/admin/plans/${plan!.id}` : "/api/admin/plans";
      const method = isEdit ? "PATCH" : "POST";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      onSuccess();
      onOpenChange(false);
    } catch {
      setError("Network error — please try again");
    } finally {
      setIsPending(false);
    }
  }

  const n = (val: string) => parseFloat(val) || 0;

  return (
    <Dialog open={open} onOpenChange={(d) => onOpenChange(d.open)}>
      <DialogContent size="xl" showCloseButton bottomStickOnMobile={false}>
        <DialogHeader
          title={isEdit ? `Edit Plan — ${plan!.name}` : "New Plan"}
          description={isEdit ? "Update plan details. Changes apply immediately." : "Fill in the details to create a new plan."}
        />

        <DialogBody>
          <div style={{ display: "flex", gap: 20, flexDirection: "column" }}>

            {/* ── Real-time stats bar ─────────────────────────────────────── */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 10,
              background: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 10,
              padding: "12px 16px",
            }}>
              {[
                { label: "Total Power",  value: fmt(stats.totalPower, 0),       unit: "PWR"   },
                { label: "Hash/day",     value: fmt(stats.hashPerDay, 1),        unit: "H/day" },
                { label: "Est. Return",  value: stats.tonReturn.toFixed(4),      unit: "TON"   },
                { label: "ROI",          value: stats.roi.toFixed(1) + "%",      unit: stats.roi >= 0 ? "profit" : "loss", color: stats.roi >= 0 ? "#10b981" : "#ef4444" },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: s.color ?? "#6366f1" }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "#4b5563" }}>{s.unit}</div>
                </div>
              ))}
            </div>

            {/* ── Row 1: Name + Slug ──────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field>
                <FieldLabel>Name *</FieldLabel>
                <Input
                  placeholder="118K"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Slug *</FieldLabel>
                <Input
                  placeholder="plan-118k"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                />
                <FieldHelper>URL-friendly identifier, must be unique</FieldHelper>
              </Field>
            </div>

            {/* ── Row 2: Power + Bonus + BonusPercent ─────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <Field>
                <FieldLabel>Base Power</FieldLabel>
                <Input
                  type="number" min={0}
                  value={form.power}
                  onChange={(e) => handlePowerChange(n(e.target.value))}
                />
                <FieldHelper>e.g. 118000</FieldHelper>
              </Field>
              <Field>
                <FieldLabel>Bonus Power</FieldLabel>
                <Input
                  type="number" min={0}
                  value={form.bonus}
                  onChange={(e) => handleBonusChange(n(e.target.value))}
                />
                <FieldHelper>Extra power on top</FieldHelper>
              </Field>
              <Field>
                <FieldLabel>Bonus %</FieldLabel>
                <Input
                  type="number" min={0} max={100}
                  value={form.bonusPercent}
                  onChange={(e) => setForm((f) => ({ ...f, bonusPercent: n(e.target.value) }))}
                />
                <FieldHelper>Auto-calculated from above</FieldHelper>
              </Field>
            </div>

            {/* ── Row 3: Price + Duration + Order ─────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <Field>
                <FieldLabel>Price (TON)</FieldLabel>
                <Input
                  type="number" min={0} step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: n(e.target.value) }))}
                />
              </Field>
              <Field>
                <FieldLabel>Duration (days)</FieldLabel>
                <Input
                  type="number" min={1}
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: n(e.target.value) }))}
                />
              </Field>
              <Field>
                <FieldLabel>Display Order</FieldLabel>
                <Input
                  type="number" min={0}
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: n(e.target.value) }))}
                />
              </Field>
            </div>

            {/* ── Row 4: Description + finalReturn ────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field>
                <FieldLabel>Description</FieldLabel>
                <Input
                  placeholder="Perfect for getting started"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </Field>
              <Field>
                <FieldLabel>Final Return (display text)</FieldLabel>
                <Input
                  placeholder="1.100 TON"
                  value={form.finalReturn}
                  onChange={(e) => setForm((f) => ({ ...f, finalReturn: e.target.value }))}
                />
                <FieldHelper>Auto-calculated: {stats.tonReturn.toFixed(4)} TON</FieldHelper>
              </Field>
            </div>

            {/* ── Row 5: Badge + Badge Color ──────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 14 }}>
              <Field>
                <FieldLabel>Badge Text</FieldLabel>
                <Input
                  placeholder="+60K POWER"
                  value={form.badge}
                  onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                />
              </Field>
              <Field>
                <FieldLabel>Badge Color</FieldLabel>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    value={form.badgeColor}
                    onChange={(e) => setForm((f) => ({ ...f, badgeColor: e.target.value }))}
                    style={{ width: 36, height: 32, border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, cursor: "pointer", background: "transparent", padding: 2 }}
                  />
                  <Input
                    value={form.badgeColor}
                    onChange={(e) => setForm((f) => ({ ...f, badgeColor: e.target.value }))}
                    style={{ fontFamily: "monospace" }}
                  />
                </div>
              </Field>
            </div>

            {/* ── Row 6: Toggles ──────────────────────────────────────────── */}
            <div style={{ display: "flex", gap: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(d) => setForm((f) => ({ ...f, isActive: d.checked }))}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Visible in Shop</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>Show this plan to users</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Switch
                  checked={form.isFree}
                  onCheckedChange={(d) => setForm((f) => ({ ...f, isFree: d.checked }))}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Free Plan</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>No payment required</div>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                color: "#ef4444",
              }}>
                {error}
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} isLoading={isPending}>
            {isEdit ? "Save Changes" : "Create Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
