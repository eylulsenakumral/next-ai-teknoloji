import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { updateMarginSchema } from "@/lib/validators/pricing"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { invalidatePriceCache } from "@/lib/cache"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const margin = await prisma.profitMargin.findFirst({
    where: { id, deletedAt: null },
  })

  if (!margin) {
    return NextResponse.json({ error: "Marj ayarı bulunamadı." }, { status: 404 })
  }

  return NextResponse.json({ data: margin })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const existing = await prisma.profitMargin.findFirst({ where: { id, deletedAt: null } })
  if (!existing) {
    return NextResponse.json({ error: "Marj ayarı bulunamadı." }, { status: 404 })
  }

  const body = await req.json()
  const parsed = updateMarginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz veri.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data
  const resolvedMarginPct = data.marginPct ?? parseFloat(existing.marginPct.toString())
  const resolvedMin = data.minMarginPct !== undefined ? data.minMarginPct : existing.minMarginPct ? parseFloat(existing.minMarginPct.toString()) : null
  const resolvedMax = data.maxMarginPct !== undefined ? data.maxMarginPct : existing.maxMarginPct ? parseFloat(existing.maxMarginPct.toString()) : null

  if (resolvedMin !== null && resolvedMarginPct < resolvedMin) {
    return NextResponse.json(
      { error: "Marj, minimum marjdan küçük olamaz." },
      { status: 400 }
    )
  }
  if (resolvedMax !== null && resolvedMarginPct > resolvedMax) {
    return NextResponse.json(
      { error: "Marj, maksimum marjdan büyük olamaz." },
      { status: 400 }
    )
  }

  const margin = await prisma.profitMargin.update({
    where: { id },
    data: {
      ...(data.scope !== undefined ? { scope: data.scope } : {}),
      ...(data.scopeId !== undefined ? { scopeId: data.scopeId ?? null } : {}),
      ...(data.marginPct !== undefined ? { marginPct: data.marginPct } : {}),
      ...(data.minMarginPct !== undefined ? { minMarginPct: data.minMarginPct ?? null } : {}),
      ...(data.maxMarginPct !== undefined ? { maxMarginPct: data.maxMarginPct ?? null } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.validFrom !== undefined ? { validFrom: data.validFrom ? new Date(data.validFrom) : null } : {}),
      ...(data.validUntil !== undefined ? { validUntil: data.validUntil ? new Date(data.validUntil) : null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes ?? null } : {}),
      updatedBy: session!.user.id,
    },
  })

  await invalidatePriceCache()

  return NextResponse.json({ data: margin })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const existing = await prisma.profitMargin.findFirst({ where: { id, deletedAt: null } })
  if (!existing) {
    return NextResponse.json({ error: "Marj ayarı bulunamadı." }, { status: 404 })
  }

  await prisma.profitMargin.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: session!.user.id },
  })

  await invalidatePriceCache()

  return NextResponse.json({ success: true })
}
