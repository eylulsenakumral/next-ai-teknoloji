import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"

// GET /api/admin/quotes — Teklif listesi
export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")))
  const status = searchParams.get("status") ?? undefined
  const search = searchParams.get("search") ?? undefined

  const where: Prisma.QuoteWhereInput = {
    deletedAt: null,
    ...(status && { status: status as Prisma.EnumQuoteStatusFilter }),
    ...(search && {
      OR: [
        { quoteNumber: { contains: search, mode: "insensitive" } },
        { customer: { companyName: { contains: search, mode: "insensitive" } } },
      ],
    }),
  }

  try {
    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          customer: { select: { id: true, companyName: true, dealerCode: true } },
          items: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.quote.count({ where }),
    ])

    return NextResponse.json({
      data: quotes,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error("[GET /api/admin/quotes]", err)
    return NextResponse.json({ error: "Teklifler yüklenemedi." }, { status: 500 })
  }
}

// POST /api/admin/quotes — Yeni teklif oluştur
export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 })
  }

  const {
    customerId,
    items,
    validUntil,
    notes,
    internalNotes,
  } = body as {
    customerId?: string
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
    validUntil?: string
    notes?: string
    internalNotes?: string
  }

  if (!customerId || !items?.length) {
    return NextResponse.json(
      { error: "Müşteri ve en az bir ürün gereklidir." },
      { status: 400 }
    )
  }

  // Generate quote number: TK-YYYYMMDD-XXXX
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "")
  const lastQuote = await prisma.quote.findFirst({
    where: { quoteNumber: { startsWith: `TK-${dateStr}` } },
    orderBy: { quoteNumber: "desc" },
    select: { quoteNumber: true },
  })
  const seq = lastQuote ? Number(lastQuote.quoteNumber.split("-")[2]) + 1 : 1
  const quoteNumber = `TK-${dateStr}-${String(seq).padStart(4, "0")}`

  // Calculate totals
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const discountTotal = items.reduce((sum, i) => sum + (i.discountAmount ?? 0) * i.quantity, 0)
  const netSubtotal = subtotal - discountTotal
  const vatTotal = items.reduce(
    (sum, i) => sum + (i.unitPrice * i.quantity - (i.discountAmount ?? 0) * i.quantity) * (i.vatRate / 100),
    0
  )
  const grandTotal = netSubtotal + vatTotal

  try {
    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        customerId,
        subtotal: new Prisma.Decimal(subtotal).toFixed(2),
        discountTotal: new Prisma.Decimal(discountTotal).toFixed(2),
        vatTotal: new Prisma.Decimal(vatTotal).toFixed(2),
        grandTotal: new Prisma.Decimal(grandTotal).toFixed(2),
        validUntil: validUntil ? new Date(validUntil) : null,
        notes,
        internalNotes,
        items: {
          create: items.map((item) => ({
            productId: item.productId ?? null,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice).toFixed(4),
            discountAmount: new Prisma.Decimal(item.discountAmount ?? 0).toFixed(4),
            vatRate: new Prisma.Decimal(item.vatRate).toFixed(2),
            lineTotal: new Prisma.Decimal(item.lineTotal).toFixed(2),
            notes: item.notes ?? null,
          })),
        },
      },
      include: {
        customer: { select: { id: true, companyName: true, dealerCode: true } },
        items: true,
      },
    })

    return NextResponse.json({ data: quote }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/admin/quotes]", err)
    return NextResponse.json({ error: "Teklif oluşturulamadı." }, { status: 500 })
  }
}
