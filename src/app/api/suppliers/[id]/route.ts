import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"

type Params = { params: Promise<{ id: string }> }

// ============================================================================
// GET /api/suppliers/[id]
// Tedarikçi detayı
// ============================================================================
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const supplier = await prisma.supplier.findFirst({
    where: { id, deletedAt: null },
    include: {
      _count: {
        select: {
          supplierProducts: { where: { deletedAt: null } },
        },
      },
      scraperLogs: {
        orderBy: { startedAt: "desc" },
        take: 5,
        select: {
          status: true,
          productsFound: true,
          startedAt: true,
          finishedAt: true,
          errorMessage: true,
        },
      },
    },
  })

  if (!supplier) {
    return NextResponse.json({ error: "Tedarikçi bulunamadı." }, { status: 404 })
  }

  return NextResponse.json({ data: supplier })
}

// ============================================================================
// PUT /api/suppliers/[id]
// Tedarikçi güncelle (isim, URL, scraperType, scraperConfig, isActive)
// ============================================================================
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const existing = await prisma.supplier.findFirst({
    where: { id, deletedAt: null },
  })

  if (!existing) {
    return NextResponse.json({ error: "Tedarikçi bulunamadı." }, { status: 404 })
  }

  const body = (await req.json()) as {
    name?: string
    websiteUrl?: string
    scraperType?: "PLAYWRIGHT" | "API" | "MANUAL"
    scraperConfig?: Record<string, unknown>
    isActive?: boolean
    syncIntervalMinutes?: number
    notes?: string
  }

  const updateData: Record<string, unknown> = {
    updatedBy: session!.user.id,
  }

  if (typeof body.name === "string" && body.name.trim()) {
    updateData.name = body.name.trim()
  }
  if (typeof body.websiteUrl === "string") {
    updateData.websiteUrl = body.websiteUrl.trim() || null
  }
  if (body.scraperType !== undefined) {
    updateData.scraperType = body.scraperType
  }
  if (body.scraperConfig !== undefined) {
    updateData.scraperConfig = body.scraperConfig as Parameters<
      typeof prisma.supplier.update
    >[0]["data"]["scraperConfig"]
  }
  if (typeof body.isActive === "boolean") {
    updateData.isActive = body.isActive
  }
  if (typeof body.syncIntervalMinutes === "number") {
    updateData.syncIntervalMinutes = body.syncIntervalMinutes
  }
  if (typeof body.notes === "string") {
    const existingMeta =
      existing.metadata && typeof existing.metadata === "object"
        ? (existing.metadata as Record<string, unknown>)
        : {}
    updateData.metadata = { ...existingMeta, notes: body.notes }
  }

  const updated = await prisma.supplier.update({
    where: { id },
    data: updateData as Parameters<typeof prisma.supplier.update>[0]["data"],
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

  return NextResponse.json({ data: updated })
}

// ============================================================================
// DELETE /api/suppliers/[id]
// Soft delete
// ============================================================================
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const existing = await prisma.supplier.findFirst({
    where: { id, deletedAt: null },
  })

  if (!existing) {
    return NextResponse.json({ error: "Tedarikçi bulunamadı." }, { status: 404 })
  }

  await prisma.supplier.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      updatedBy: session!.user.id,
    },
  })

  return NextResponse.json({ success: true })
}
