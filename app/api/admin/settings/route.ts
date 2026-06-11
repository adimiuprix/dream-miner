import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAllSettings, setSetting, type SettingKey } from "@/lib/settings";

/**
 * GET /api/admin/settings
 * Return all settings grouped for admin UI.
 * Secret values are masked.
 */
export async function GET() {
  try {
    const rows = await getAllSettings();

    const settings = rows.map((s: {
      key: string; value: string; type: string; group: string;
      label: string; description: string | null; isSecret: boolean; updatedAt: Date;
    }) => ({
      key:         s.key,
      value:       s.isSecret && s.value ? "••••••••" : s.value,
      type:        s.type,
      group:       s.group,
      label:       s.label,
      description: s.description,
      isSecret:    s.isSecret,
      updatedAt:   s.updatedAt,
    }));

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("[AdminSettings] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/settings
 * Update one or more settings.
 * Body: { updates: { key: string; value: string }[] }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = body as { updates: { key: string; value: string }[] };

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "updates array is required" }, { status: 400 });
    }

    // Validate all keys exist in DB before writing
    const keys = updates.map((u) => u.key);
    const existing = await prisma.appSetting.findMany({ where: { key: { in: keys } } });
    const existingKeys = new Set(existing.map((s: { key: string }) => s.key));

    const invalid = keys.filter((k) => !existingKeys.has(k));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Unknown setting key(s): ${invalid.join(", ")}` },
        { status: 400 }
      );
    }

    // Apply updates one by one (setSetting handles cache invalidation)
    await Promise.all(
      updates.map((u) => setSetting(u.key as SettingKey, u.value))
    );

    return NextResponse.json({ success: true, updated: updates.length });
  } catch (error) {
    console.error("[AdminSettings] PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
