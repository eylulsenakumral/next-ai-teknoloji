import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdminSession, requireReadPermission, requireWritePermission } from "@/lib/auth-helpers"

// ============================================================================
// GET /api/admin/settings
// Tüm ayarları döner; isteğe bağlı olarak ?group=X ile filtrelenir.
// ============================================================================
export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireReadPermission(session)
  if (authError) return authError

  const group = req.nextUrl.searchParams.get("group")

  const settings = await prisma.setting.findMany({
    where: group ? { group } : undefined,
    orderBy: [{ group: "asc" }, { key: "asc" }],
  })

  // key → value map döndür (daha ergonomik kullanım için)
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))

  return NextResponse.json({ data: map, raw: settings })
}

// ============================================================================
// PUT /api/admin/settings
// Body: { settings: Record<string, { value: unknown; group: string }> }
// Çoklu upsert destekler — tek istekte birden fazla ayarı kaydeder.
// ============================================================================
export async function PUT(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireWritePermission(session)
  if (authError) return authError

  const body = (await req.json()) as {
    settings: Record<string, { value: unknown; group: string; description?: string }>
  }

  if (!body?.settings || typeof body.settings !== "object") {
    return NextResponse.json({ error: "Geçersiz veri formatı." }, { status: 400 })
  }

  const entries = Object.entries(body.settings)
  if (entries.length === 0) {
    return NextResponse.json({ error: "Kayıt edilecek ayar belirtilmedi." }, { status: 400 })
  }

  // Paralel upsert
  const upserts = entries.map(([key, meta]) =>
    prisma.setting.upsert({
      where: { key },
      update: {
        value: meta.value as Parameters<typeof prisma.setting.upsert>[0]["update"]["value"],
        updatedBy: session!.user.id,
        ...(meta.description !== undefined ? { description: meta.description } : {}),
      },
      create: {
        key,
        value: meta.value as Parameters<typeof prisma.setting.create>[0]["data"]["value"],
        group: meta.group,
        updatedBy: session!.user.id,
        ...(meta.description !== undefined ? { description: meta.description } : {}),
      },
    })
  )

  const results = await Promise.all(upserts)
  return NextResponse.json({ data: results })
}
