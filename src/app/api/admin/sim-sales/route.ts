import { NextRequest, NextResponse } from "next/server"
import { addYears } from "date-fns"
import { prisma } from "@/lib/db"
import { createSimSaleSchema } from "@/lib/validators/sim-sale"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")))
  const search = searchParams.get("search") ?? ""

  const where = {
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { buyerName: { contains: search, mode: "insensitive" as const } },
            { contactPhone: { contains: search, mode: "insensitive" as const } },
            { simPhoneNumber: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const [sales, total] = await Promise.all([
    prisma.simCardSale.findMany({
      where,
      orderBy: { endDate: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: { select: { id: true, companyName: true, dealerCode: true } },
      },
    }),
    prisma.simCardSale.count({ where }),
  ])

  return NextResponse.json({
    data: sales,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  })
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const body = await req.json()
  const parsed = createSimSaleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz veri.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const {
    buyerName,
    contactPhone,
    simPhoneNumber,
    tcNumber,
    idPhotoUrl,
    package: pkg,
    purchaseDate,
    customerId,
  } = parsed.data

  const purchase = new Date(purchaseDate)
  const endDate = addYears(purchase, 1)

  const sale = await prisma.simCardSale.create({
    data: {
      buyerName,
      contactPhone,
      simPhoneNumber: simPhoneNumber || null,
      tcNumber: tcNumber || null,
      idPhotoUrl: idPhotoUrl || null,
      package: pkg,
      purchaseDate: purchase,
      endDate,
      customerId: customerId ?? null,
    },
  })

  return NextResponse.json({ data: sale }, { status: 201 })
}
