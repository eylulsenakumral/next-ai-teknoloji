import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function getDealerSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "dealer") {
    return null
  }
  return session
}

// GET /api/account/transactions — Bayi: Kendi cari hareketleri
export async function GET(req: NextRequest) {
  const session = await getDealerSession()
  if (!session) {
    return NextResponse.json(
      { error: "Oturum açmanız gerekiyor." },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")))
  const type = searchParams.get("type") ?? ""
  const dateFrom = searchParams.get("dateFrom")
  const dateTo = searchParams.get("dateTo")

  const validTypes = ["INVOICE", "PAYMENT", "REFUND", "ADJUSTMENT", "OPENING_BALANCE"]

  const where = {
    customerId: session.user.id,
    ...(type && validTypes.includes(type)
      ? { type: type as "INVOICE" | "PAYMENT" | "REFUND" | "ADJUSTMENT" | "OPENING_BALANCE" }
      : {}),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo + "T23:59:59.999Z") } : {}),
          },
        }
      : {}),
  }

  const customer = await prisma.customer.findFirst({
    where: { id: session.user.id, deletedAt: null },
    select: { balance: true, creditLimit: true },
  })

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
      currentBalance: customer?.balance ?? 0,
      creditLimit: customer?.creditLimit ?? 0,
    },
  })
}
