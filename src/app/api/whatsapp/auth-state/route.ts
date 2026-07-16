// ============================================================================
// POST/GET /api/whatsapp/auth-state — Manage Baileys auth state table
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers";

// Ensure the auth state table exists (run once)
async function ensureTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "whatsapp_auth_state" (
        "key" TEXT PRIMARY KEY,
        "value" TEXT,
        "updated_at" TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  } catch {
    // Table may already exist or migration conflict
  }
}

// POST — Set auth state key
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  const denied = requireAdminSession(session);
  if (denied) return denied;

  await ensureTable();

  const body = await req.json();
  const { key, value } = body as { key: string; value: string };

  if (!key || value === undefined) {
    return NextResponse.json({ error: "key ve value gerekli" }, { status: 400 });
  }

  await prisma.$executeRawUnsafe(`
    INSERT INTO "whatsapp_auth_state" ("key", "value", "updated_at")
    VALUES ($1, $2, NOW())
    ON CONFLICT ("key") DO UPDATE SET "value" = $2, "updated_at" = NOW()
  `, key, value);

  return NextResponse.json({ success: true });
}

// GET — Get auth state value
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  const denied = requireAdminSession(session);
  if (denied) return denied;

  await ensureTable();

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "key parametresi gerekli" }, { status: 400 });
  }

  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ value: string | null }>>(
      `SELECT "value" FROM "whatsapp_auth_state" WHERE "key" = $1`,
      key,
    );

    return NextResponse.json({
      key,
      value: rows[0]?.value ?? null,
      exists: rows.length > 0 && rows[0].value !== null,
    });
  } catch {
    return NextResponse.json({ key, value: null, exists: false });
  }
}
