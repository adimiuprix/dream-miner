import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/admin/plans/[id]
 * Update an existing plan.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name, slug, power, bonus, bonusPercent, price, duration,
      description, finalReturn, badge, badgeColor,
      order, isActive, isFree,
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
    }

    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Check slug uniqueness (allow same slug for same plan)
    const slugConflict = await prisma.plan.findFirst({
      where: { slug: String(slug).trim(), NOT: { id } },
    });
    if (slugConflict) {
      return NextResponse.json({ error: `Slug "${slug}" is already used by another plan` }, { status: 409 });
    }

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        name:         String(name).trim(),
        slug:         String(slug).trim(),
        power:        Number(power)        || 0,
        bonus:        Number(bonus)        || 0,
        bonusPercent: Number(bonusPercent) || 0,
        price:        Number(price)        || 0,
        duration:     Number(duration)     || 30,
        description:  description ? String(description).trim() : null,
        finalReturn:  finalReturn  ? String(finalReturn).trim()  : null,
        badge:        badge        ? String(badge).trim()        : null,
        badgeColor:   badgeColor   ? String(badgeColor).trim()   : null,
        order:        Number(order)        || 0,
        isActive:     Boolean(isActive),
        isFree:       Boolean(isFree),
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("[AdminPlans] PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/plans/[id]
 * Delete a plan. Blocked if active contracts exist.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const activeContracts = await prisma.contract.count({
      where: { planId: id, status: "ACTIVE" },
    });
    if (activeContracts > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${activeContracts} active contract(s) using this plan` },
        { status: 409 }
      );
    }

    await prisma.plan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[AdminPlans] DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
