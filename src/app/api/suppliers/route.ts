import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"

// ============================================================================
// GET /api/suppliers
// Tüm tedarikçileri döner (admin auth gerekli)
// ============================================================================
export async function GET(_req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const suppliers = await prisma.supplier.findMany({
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
  })

  return NextResponse.json({ data: suppliers })
}

// ============================================================================
// POST /api/suppliers
// Yeni tedarikçi ekle
// ============================================================================
export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const body = (await req.json()) as {
    name?: string
    websiteUrl?: string
    scraperType?: "PLAYWRIGHT" | "API" | "MANUAL"
    scraperConfig?: Record<string, unknown>
    notes?: string
    syncIntervalMinutes?: number
  }

  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ error: "Tedarikçi adı zorunludur." }, { status: 400 })
  }

  if (!body.websiteUrl || !body.websiteUrl.trim()) {
    return NextResponse.json({ error: "Website URL zorunludur." }, { status: 400 })
  }

  // code alanı için URL'den otomatik üret, benzersiz yap
  const baseCode = (body.websiteUrl ?? body.name)
    .replace(/https?:\/\//, "")
    .replace(/\W+/g, "-")
    .toLowerCase()
    .slice(0, 40)

  // Benzersizlik kontrolü
  const existing = await prisma.supplier.findFirst({
    where: { code: { startsWith: baseCode }, deletedAt: null },
    orderBy: { createdAt: "desc" },
  })
  const code = existing ? `${baseCode}-${Date.now()}` : baseCode

  const supplier = await prisma.supplier.create({
    data: {
      code,
      name: body.name.trim(),
      websiteUrl: body.websiteUrl?.trim() || null,
      scraperType: body.scraperType ?? "PLAYWRIGHT",
      scraperConfig: body.scraperConfig
        ? (body.scraperConfig as Parameters<typeof prisma.supplier.create>[0]["data"]["scraperConfig"])
        : undefined,
      syncIntervalMinutes: body.syncIntervalMinutes ?? 360,
      metadata: body.notes ? { notes: body.notes } : undefined,
      createdBy: session!.user.id,
      updatedBy: session!.user.id,
    },
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
  })

  return NextResponse.json({ data: supplier }, { status: 201 })
}
