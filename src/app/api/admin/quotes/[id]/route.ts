import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { prisma } from "@/lib/db"
import type { QuoteStatus } from "@prisma/client"

function optionalProductId(productId?: string) {
  return productId?.trim() || null
}

// GET /api/admin/quotes/[id] — Teklif detay
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  try {
    const quote = await prisma.quote.findUnique({
      where: { id, deletedAt: null },
      include: {
        customer: true,
        items: true,
        convertedOrder: { select: { id: true, orderNumber: true } },
      },
    })

    if (!quote) {
      return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 })
    }

    return NextResponse.json({ data: quote })
  } catch (err) {
    console.error("[GET /api/admin/quotes/[id]]", err)
    return NextResponse.json({ error: "Teklif yüklenemedi." }, { status: 500 })
  }
}

// PATCH /api/admin/quotes/[id] — Teklif güncelle (durum, notlar, ürünler)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 })
  }

  const data = body as {
    status?: QuoteStatus
    notes?: string
    internalNotes?: string
    validUntil?: string
    items?: Array<{
      productId?: string
      productName: string
      quantity: number
      unitPrice: number
      discountAmount?: number
      vatRate: number
      lineTotal: number
      notes?: string
    }>
  }

  try {
    const existing = await prisma.quote.findUnique({ where: { id, deletedAt: null } })
    if (!existing) {
      return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 })
    }

    // If items are provided, recalculate totals
    let updateData: Record<string, unknown> = {}
    if (data.status) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes
    if (data.validUntil !== undefined) updateData.validUntil = data.validUntil ? new Date(data.validUntil) : null

    if (data.items?.length) {
      const subtotal = data.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
      const discountTotal = data.items.reduce((s, i) => s + (i.discountAmount ?? 0) * i.quantity, 0)
      const netSubtotal = subtotal - discountTotal
      const vatTotal = data.items.reduce(
        (s, i) => s + (i.unitPrice * i.quantity - (i.discountAmount ?? 0) * i.quantity) * (i.vatRate / 100),
        0
      )
      const grandTotal = netSubtotal + vatTotal

      updateData = {
        ...updateData,
        subtotal,
        discountTotal,
        vatTotal,
        grandTotal,
        items: {
          deleteMany: {},
          create: data.items.map((item) => ({
            productId: optionalProductId(item.productId),
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discountAmount ?? 0,
            vatRate: item.vatRate,
            lineTotal: item.lineTotal,
            notes: item.notes ?? null,
          })),
        },
      }
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, companyName: true, dealerCode: true } },
        items: true,
      },
    })

    return NextResponse.json({ data: quote })
  } catch (err) {
    console.error("[PATCH /api/admin/quotes/[id]]", err)
    return NextResponse.json({ error: "Teklif güncellenemedi." }, { status: 500 })
  }
}

// DELETE /api/admin/quotes/[id] — Soft delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  try {
    const existing = await prisma.quote.findUnique({ where: { id, deletedAt: null } })
    if (!existing) {
      return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 })
    }

    await prisma.quote.update({ where: { id }, data: { deletedAt: new Date() } })
    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    console.error("[DELETE /api/admin/quotes/[id]]", err)
    return NextResponse.json({ error: "Teklif silinemedi." }, { status: 500 })
  }
}
