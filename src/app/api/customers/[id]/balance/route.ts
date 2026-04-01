import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { balanceAdjustmentSchema } from "@/lib/validators/customer"

// GET /api/customers/[id]/balance — Admin: Cari hareketler
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")))
  const type = searchParams.get("type") ?? ""

  const validTypes = ["INVOICE", "PAYMENT", "REFUND", "ADJUSTMENT", "OPENING_BALANCE"]

  const customer = await prisma.customer.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, balance: true, creditLimit: true },
  })

  if (!customer) {
    return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 })
  }

  const where = {
    customerId: id,
    ...(type && validTypes.includes(type)
      ? { type: type as "INVOICE" | "PAYMENT" | "REFUND" | "ADJUSTMENT" | "OPENING_BALANCE" }
      : {}),
  }

  const [transactions, total] = await Promise.all([
    prisma.accountTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.accountTransaction.count({ where }),
  ])

  return NextResponse.json({
    data: transactions,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      currentBalance: customer.balance,
      creditLimit: customer.creditLimit,
    },
  })
}

// POST /api/customers/[id]/balance — Admin: Manuel bakiye düzenleme
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const body = await req.json()
  const parsed = balanceAdjustmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz veri.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { amount, description, type } = parsed.data

  const customer = await prisma.customer.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, balance: true },
  })

  if (!customer) {
    return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 })
  }

  const currentBalance = Number(customer.balance)
  const newBalance = currentBalance + amount

  const [transaction] = await prisma.$transaction([
    prisma.accountTransaction.create({
      data: {
        customerId: id,
        type: type as "INVOICE" | "PAYMENT" | "REFUND" | "ADJUSTMENT" | "OPENING_BALANCE",
        amount,
        balanceAfter: newBalance,
        description,
        referenceType: "MANUAL",
        createdBy: session!.user.id,
      },
    }),
    prisma.customer.update({
      where: { id },
      data: { balance: newBalance },
    }),
  ])

  return NextResponse.json(
    {
      data: transaction,
      newBalance,
      message: "Bakiye güncellendi.",
    },
    { status: 201 }
  )
}
