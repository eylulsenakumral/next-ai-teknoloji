import { NextRequest, NextResponse } from "next/server"
import { addYears } from "date-fns"
import { prisma } from "@/lib/db"
import { updateSimSaleSchema } from "@/lib/validators/sim-sale"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const sale = await prisma.simCardSale.findFirst({
    where: { id, deletedAt: null },
    include: {
      customer: { select: { id: true, companyName: true, dealerCode: true } },
    },
  })

  if (!sale) {
    return NextResponse.json({ error: "SIM kaydı bulunamadı." }, { status: 404 })
  }

  return NextResponse.json({ data: sale })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const existing = await prisma.simCardSale.findFirst({
    where: { id, deletedAt: null },
  })
  if (!existing) {
    return NextResponse.json({ error: "SIM kaydı bulunamadı." }, { status: 404 })
  }

  const body = await req.json()
  const parsed = updateSimSaleSchema.safeParse(body)
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

  // purchaseDate değişirse endDate'i (satın alma + 1 yıl) yeniden hesapla
  let nextEndDate: Date | undefined
  if (purchaseDate !== undefined) {
    nextEndDate = addYears(new Date(purchaseDate), 1)
  }

  const sale = await prisma.simCardSale.update({
    where: { id },
    data: {
      ...(buyerName !== undefined ? { buyerName } : {}),
      ...(contactPhone !== undefined ? { contactPhone } : {}),
      ...(simPhoneNumber !== undefined ? { simPhoneNumber: simPhoneNumber || null } : {}),
      ...(tcNumber !== undefined ? { tcNumber: tcNumber || null } : {}),
      ...(idPhotoUrl !== undefined ? { idPhotoUrl: idPhotoUrl || null } : {}),
      ...(pkg !== undefined ? { package: pkg } : {}),
      ...(purchaseDate !== undefined ? { purchaseDate: new Date(purchaseDate) } : {}),
      ...(nextEndDate ? { endDate: nextEndDate } : {}),
      ...(customerId !== undefined ? { customerId: customerId ?? null } : {}),
    },
  })

  return NextResponse.json({ data: sale })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const existing = await prisma.simCardSale.findFirst({
    where: { id, deletedAt: null },
  })
  if (!existing) {
    return NextResponse.json({ error: "SIM kaydı bulunamadı." }, { status: 404 })
  }

  await prisma.simCardSale.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
