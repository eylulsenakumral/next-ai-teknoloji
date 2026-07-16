import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { updateCustomerSchema } from "@/lib/validators/customer"
import bcrypt from "bcryptjs"

// GET /api/customers/[id] — Admin: Müşteri detay
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const customer = await prisma.customer.findFirst({
    where: { id, deletedAt: null },
    include: {
      priceList: { select: { id: true, name: true } },
      orders: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          grandTotal: true,
          createdAt: true,
          _count: { select: { orderItems: true } },
        },
      },
      accountTransactions: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          type: true,
          amount: true,
          balanceAfter: true,
          description: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          orders: { where: { deletedAt: null } },
          accountTransactions: true,
        },
      },
    },
  })

  if (!customer) {
    return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 })
  }

  // KRİTİK-29: passwordHash asla cliente sızmasın (include tüm scalar döndürürdü).
  const { passwordHash, ...safeCustomer } = customer
  return NextResponse.json({ data: safeCustomer })
}

// PUT /api/customers/[id] — Admin: Müşteri güncelle
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const existing = await prisma.customer.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  })

  if (!existing) {
    return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 })
  }

  const body = await req.json()

  // newPassword ve dealerCode ayrı işlenecek
  const { newPassword, dealerCode: newDealerCode, ...rest } = body as Record<string, unknown>

  // null değerleri undefined'a çevir (Zod .optional() undefined kabul eder)
  for (const key of Object.keys(rest)) {
    if (rest[key] === null) rest[key] = undefined
  }

  const parsed = updateCustomerSchema.safeParse(rest)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz veri.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data

  // APPROVED durumuna geçişte approvedAt/approvedBy ata
  const extraData: Record<string, unknown> = {}
  if (data.status === "APPROVED") {
    extraData.approvedAt = new Date()
    extraData.approvedBy = session!.user.id
  }

  // Bayi kodu değişikliği
  if (newDealerCode && typeof newDealerCode === "string" && newDealerCode.trim()) {
    const trimmed = newDealerCode.trim().toUpperCase()
    // Aynı kodu başka müşteri kullanıyor mu?
    const duplicate = await prisma.customer.findFirst({
      where: { dealerCode: trimmed, id: { not: id }, deletedAt: null },
    })
    if (duplicate) {
      return NextResponse.json(
        { error: `"${trimmed}" bayi kodu başka bir müşteri tarafından kullanılıyor.` },
        { status: 400 }
      )
    }
    extraData.dealerCode = trimmed
  }

  // Şifre değişikliği
  if (newPassword && typeof newPassword === "string" && newPassword.trim().length > 0) {
    if (newPassword.trim().length < 4) {
      return NextResponse.json(
        { error: "Şifre en az 4 karakter olmalıdır." },
        { status: 400 }
      )
    }
    extraData.passwordHash = await bcrypt.hash(newPassword.trim(), 12)
  }

  // priceListId'yi relation field olarak ayir
  const { priceListId, ...restData } = data as Record<string, unknown> & { priceListId?: string | null }
  const updateData: Record<string, unknown> = {
    ...restData,
    ...extraData,
    updatedBy: session!.user.id,
  }
  if (priceListId !== undefined) {
    updateData.priceList = priceListId
      ? { connect: { id: priceListId } }
      : { disconnect: true }
  }

  const customer = await prisma.customer.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      dealerCode: true,
      companyName: true,
      status: true,
      balance: true,
      creditLimit: true,
      discountRate: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ data: customer, message: "Müşteri güncellendi." })
}
