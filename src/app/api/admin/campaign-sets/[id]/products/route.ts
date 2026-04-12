import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import {
  addProductToSetSchema,
  updateSetProductSchema,
} from "@/lib/validators/campaign-set"
import { z } from "zod"

const uuidSchema = z.string().uuid()

// ---------------------------------------------------------------------------
// POST /api/admin/campaign-sets/[id]/products
// Sete ürün ekle
// ---------------------------------------------------------------------------
export async function POST(
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
    const set = await prisma.campaignSet.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    })
    if (!set) {
      return NextResponse.json({ error: "Kampanya seti bulunamadı." }, { status: 404 })
    }

    const body = await req.json()
    const parsed = addProductToSetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri.", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { productId, quantity, sortOrder, label } = parsed.data

    const product = await prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: { id: true, name: true },
    })
    if (!product) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 })
    }

    const existing = await prisma.campaignSetProduct.findUnique({
      where: { campaignSetId_productId: { campaignSetId: id, productId } },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json(
        { error: "Bu ürün zaten sette mevcut." },
        { status: 409 }
      )
    }

    const item = await prisma.campaignSetProduct.create({
      data: {
        campaignSetId: id,
        productId,
        quantity,
        sortOrder,
        label: label ?? null,
      },
      select: {
        id: true,
        quantity: true,
        sortOrder: true,
        label: true,
        product: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    return NextResponse.json({ data: item }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/admin/campaign-sets/[id]/products]", err)
    return NextResponse.json(
      { error: "Ürün sete eklenemedi." },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/campaign-sets/[id]/products
// Body: { productId, quantity?, sortOrder?, label? }
// ---------------------------------------------------------------------------
const patchBodySchema = updateSetProductSchema.extend({
  productId: z.string().uuid("Geçersiz ürün ID"),
})

export async function PATCH(
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
    const body = await req.json()
    const parsed = patchBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri.", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { productId, ...updateData } = parsed.data

    const existing = await prisma.campaignSetProduct.findUnique({
      where: { campaignSetId_productId: { campaignSetId: id, productId } },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json(
        { error: "Ürün sette bulunamadı." },
        { status: 404 }
      )
    }

    const updated = await prisma.campaignSetProduct.update({
      where: { campaignSetId_productId: { campaignSetId: id, productId } },
      data: updateData,
      select: {
        id: true,
        quantity: true,
        sortOrder: true,
        label: true,
        product: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error("[PATCH /api/admin/campaign-sets/[id]/products]", err)
    return NextResponse.json(
      { error: "Ürün bilgileri güncellenemedi." },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/campaign-sets/[id]/products
// Body: { productId }
// ---------------------------------------------------------------------------
const deleteBodySchema = z.object({
  productId: z.string().uuid("Geçersiz ürün ID"),
})

export async function DELETE(
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
    const body = await req.json()
    const parsed = deleteBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri.", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { productId } = parsed.data

    const existing = await prisma.campaignSetProduct.findUnique({
      where: { campaignSetId_productId: { campaignSetId: id, productId } },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json(
        { error: "Ürün sette bulunamadı." },
        { status: 404 }
      )
    }

    await prisma.campaignSetProduct.delete({
      where: { campaignSetId_productId: { campaignSetId: id, productId } },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE /api/admin/campaign-sets/[id]/products]", err)
    return NextResponse.json(
      { error: "Ürün setten çıkarılamadı." },
      { status: 500 }
    )
  }
}
