import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { updateCampaignSetSchema } from "@/lib/validators/campaign-set"

const uuidSchema = z.string().uuid()

// ---------------------------------------------------------------------------
// GET /api/admin/campaign-sets/[id]
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params
  if (!uuidSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Geçersiz kampanya seti ID." }, { status: 400 })
  }

  try {
    const set = await prisma.campaignSet.findFirst({
      where: { id, deletedAt: null },
      include: {
        products: {
          select: {
            id: true,
            quantity: true,
            sortOrder: true,
            label: true,
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                isActive: true,
                brand: { select: { id: true, name: true } },
                category: { select: { id: true, name: true } },
                supplierProducts: {
                  where: { deletedAt: null, isAvailable: true },
                  select: { purchasePrice: true, stockQuantity: true },
                  orderBy: { purchasePrice: "asc" },
                  take: 1,
                },
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    })

    if (!set) {
      return NextResponse.json({ error: "Kampanya seti bulunamadı." }, { status: 404 })
    }

    return NextResponse.json({ data: set })
  } catch (err) {
    console.error("[GET /api/admin/campaign-sets/[id]]", err)
    return NextResponse.json(
      { error: "Kampanya seti yüklenemedi." },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// PUT /api/admin/campaign-sets/[id]
// ---------------------------------------------------------------------------
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params
  if (!uuidSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Geçersiz kampanya seti ID." }, { status: 400 })
  }

  try {
    const existing = await prisma.campaignSet.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Kampanya seti bulunamadı." }, { status: 404 })
    }

    const body = await req.json()
    const parsed = updateCampaignSetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri.", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const updateData: Prisma.CampaignSetUpdateInput = {
      updatedBy: session!.user.id,
    }
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
    if (data.type !== undefined) updateData.type = data.type
    if (data.discountPct !== undefined)
      updateData.discountPct = data.discountPct != null ? String(data.discountPct) : null
    if (data.price !== undefined)
      updateData.price = data.price != null ? String(data.price) : null
    if (data.currency !== undefined)
      updateData.currency = data.currency ?? "TRY"
    if (data.validFrom !== undefined)
      updateData.validFrom = data.validFrom ? new Date(data.validFrom) : null
    if (data.validUntil !== undefined)
      updateData.validUntil = data.validUntil ? new Date(data.validUntil) : null
    if (data.minPurchaseAmount !== undefined)
      updateData.minPurchaseAmount =
        data.minPurchaseAmount != null ? String(data.minPurchaseAmount) : null
    if (data.maxUsageCount !== undefined) updateData.maxUsageCount = data.maxUsageCount
    if (data.stockQuantity !== undefined) updateData.stockQuantity = data.stockQuantity
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder
    if (data.metadata !== undefined)
      updateData.metadata =
        data.metadata === null
          ? Prisma.JsonNull
          : (data.metadata as Prisma.InputJsonValue)

    const updated = await prisma.campaignSet.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        isActive: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error("[PUT /api/admin/campaign-sets/[id]]", err)
    return NextResponse.json(
      { error: "Kampanya seti güncellenemedi." },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/campaign-sets/[id]  (soft delete)
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params
  if (!uuidSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Geçersiz kampanya seti ID." }, { status: 400 })
  }

  try {
    const existing = await prisma.campaignSet.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Kampanya seti bulunamadı." }, { status: 404 })
    }

    await prisma.campaignSet.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: session!.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE /api/admin/campaign-sets/[id]]", err)
    return NextResponse.json(
      { error: "Kampanya seti silinemedi." },
      { status: 500 }
    )
  }
}
