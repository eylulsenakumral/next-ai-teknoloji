import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"

// POST /api/admin/quotes/[id]/convert — Teklifi siparişe dönüştür
export async function POST(
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
      include: { items: true, customer: true },
    })

    if (!quote) {
      return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 })
    }

    if (quote.status !== "ACCEPTED") {
      return NextResponse.json(
        { error: "Sadece kabul edilen teklifler siparişe dönüştürülebilir." },
        { status: 400 }
      )
    }

    if (quote.convertedOrderId) {
      return NextResponse.json(
        { error: "Bu teklif zaten siparişe dönüştürülmüş." },
        { status: 400 }
      )
    }

    // Generate order number: SP-YYYYMMDD-XXXX
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "")
    const lastOrder = await prisma.order.findFirst({
      where: { orderNumber: { startsWith: `SP-${dateStr}` } },
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    })
    const seq = lastOrder ? Number(lastOrder.orderNumber.split("-")[2]) + 1 : 1
    const orderNumber = `SP-${dateStr}-${String(seq).padStart(4, "0")}`

    // Create order from quote
    const order = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: quote.customerId,
          status: "CONFIRMED",
          subtotal: quote.subtotal,
          discountTotal: quote.discountTotal,
          vatTotal: quote.vatTotal,
          shippingTotal: new Prisma.Decimal(0),
          grandTotal: quote.grandTotal,
          currency: quote.currency,
          notes: quote.notes,
          adminNotes: `Teklif ${quote.quoteNumber} üzerinden oluşturuldu.`,
          paymentMethod: "BANK_TRANSFER",
          orderItems: {
            create: quote.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountAmount: item.discountAmount,
              vatRate: item.vatRate,
              lineSubtotal: new Prisma.Decimal(Number(item.unitPrice) * item.quantity - Number(item.discountAmount) * item.quantity).toFixed(2),
              lineVat: new Prisma.Decimal(
                (Number(item.unitPrice) * item.quantity - Number(item.discountAmount) * item.quantity) *
                (Number(item.vatRate) / 100)
              ).toFixed(2),
              lineTotal: item.lineTotal,
              notes: item.notes,
            })),
          },
        },
      })

      // Update quote status
      await tx.quote.update({
        where: { id },
        data: {
          status: "CONVERTED",
          convertedOrderId: order.id,
        },
      })

      return order
    })

    return NextResponse.json({
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        success: true,
      },
    })
  } catch (err) {
    console.error("[POST /api/admin/quotes/[id]/convert]", err)
    return NextResponse.json({ error: "Siparişe dönüştürülemedi." }, { status: 500 })
  }
}
