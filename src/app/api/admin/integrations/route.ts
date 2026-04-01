import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"

// ============================================================================
// GET /api/admin/integrations
// Tüm entegrasyon durumlarını döner: suppliers + settings
// ============================================================================
export async function GET(_req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const [suppliers, settings] = await Promise.all([
    prisma.supplier.findMany({
      where: { deletedAt: null },
      orderBy: { priority: "desc" },
      include: {
        _count: {
          select: {
            supplierProducts: { where: { deletedAt: null } },
          },
        },
        scraperLogs: {
          orderBy: { startedAt: "desc" },
          take: 1,
          select: {
            status: true,
            productsFound: true,
            startedAt: true,
            finishedAt: true,
          },
        },
      },
    }),
    prisma.setting.findMany({
      where: {
        group: { in: ["BIZIMHESAP", "WHATSAPP", "SCRAPER", "LLM"] },
      },
    }),
  ])

  // Ayarları key:value map'e çevir
  const settingsMap = Object.fromEntries(
    settings.map((s) => [s.key, s.value])
  )

  return NextResponse.json({
    suppliers,
    settings: settingsMap,
  })
}

// ============================================================================
// PUT /api/admin/integrations
// Ayarları güncelle (upsert)
// ============================================================================
export async function PUT(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const body = await req.json() as Record<string, unknown>

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Geçersiz veri." }, { status: 400 })
  }

  const { supplierId, supplierData, settingKey, settingValue, settingGroup } = body as {
    supplierId?: string
    supplierData?: { isActive?: boolean; syncIntervalMinutes?: number }
    settingKey?: string
    settingValue?: unknown
    settingGroup?: string
  }

  // Tedarikçi güncelle
  if (supplierId && supplierData) {
    const updated = await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        ...(typeof supplierData.isActive === "boolean"
          ? { isActive: supplierData.isActive }
          : {}),
        ...(typeof supplierData.syncIntervalMinutes === "number"
          ? { syncIntervalMinutes: supplierData.syncIntervalMinutes }
          : {}),
        updatedBy: session!.user.id,
      },
    })
    return NextResponse.json({ data: updated })
  }

  // Setting güncelle (upsert)
  if (settingKey !== undefined && settingValue !== undefined) {
    const setting = await prisma.setting.upsert({
      where: { key: settingKey },
      update: {
        value: settingValue as Parameters<typeof prisma.setting.upsert>[0]["update"]["value"],
        updatedBy: session!.user.id,
      },
      create: {
        key: settingKey,
        value: settingValue as Parameters<typeof prisma.setting.create>[0]["data"]["value"],
        group: (settingGroup as string) ?? "GENERAL",
        updatedBy: session!.user.id,
      },
    })
    return NextResponse.json({ data: setting })
  }

  return NextResponse.json({ error: "Güncellenecek veri belirtilmedi." }, { status: 400 })
}
