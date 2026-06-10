import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/plans
 * List all plans ordered by display order.
 */
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { contracts: true } } },
    });
    return NextResponse.json({ success: true, plans });
  } catch (error) {
    console.error("[AdminPlans] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/plans
 * Create a new plan.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name, slug, power, bonus, bonusPercent, price, duration,
      description, finalReturn, badge, badgeColor,
      order, isActive, isFree,
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await prisma.plan.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: `Slug "${slug}" already exists` }, { status: 409 });
    }

    const plan = await prisma.plan.create({
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

    return NextResponse.json({ success: true, plan }, { status: 201 });
  } catch (error) {
    console.error("[AdminPlans] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
