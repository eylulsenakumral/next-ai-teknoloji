import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createMarginSchema } from "@/lib/validators/pricing"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { invalidatePriceCache } from "@/lib/cache"

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const scope = searchParams.get("scope")
  const isActiveParam = searchParams.get("isActive")
  const scopeId = searchParams.get("scopeId")

  const margins = await prisma.profitMargin.findMany({
    where: {
      deletedAt: null,
      ...(scope ? { scope: scope as "GLOBAL" | "CATEGORY" | "BRAND" | "PRODUCT" | "CUSTOMER" } : {}),
      ...(isActiveParam !== null ? { isActive: isActiveParam === "true" } : {}),
      ...(scopeId ? { scopeId } : {}),
    },
    orderBy: [{ scope: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  })

  return NextResponse.json({ data: margins })
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const body = await req.json()
  const parsed = createMarginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz veri.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const {
    scope,
    scopeId,
    marginPct,
    minMarginPct,
    maxMarginPct,
    priority,
    isActive,
    validFrom,
    validUntil,
    notes,
  } = parsed.data

  // GLOBAL scope must not have a scopeId
  if (scope === "GLOBAL" && scopeId) {
    return NextResponse.json(
      { error: "GLOBAL kapsam için scopeId belirtilemez." },
      { status: 400 }
    )
  }

  // Non-GLOBAL scope requires scopeId
  if (scope !== "GLOBAL" && !scopeId) {
    return NextResponse.json(
      { error: "Bu kapsam için bir hedef ID gereklidir." },
      { status: 400 }
    )
  }

  // Validate min <= marginPct <= max if both present
  if (minMarginPct !== undefined && minMarginPct !== null && marginPct < minMarginPct) {
    return NextResponse.json(
      { error: "Marj, minimum marjdan küçük olamaz." },
      { status: 400 }
    )
  }
  if (maxMarginPct !== undefined && maxMarginPct !== null && marginPct > maxMarginPct) {
    return NextResponse.json(
      { error: "Marj, maksimum marjdan büyük olamaz." },
      { status: 400 }
    )
  }

  const margin = await prisma.profitMargin.create({
    data: {
      scope,
      scopeId: scopeId ?? null,
      marginPct,
      minMarginPct: minMarginPct ?? null,
      maxMarginPct: maxMarginPct ?? null,
      priority: priority ?? 0,
      isActive: isActive ?? true,
      validFrom: validFrom ? new Date(validFrom) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
      notes: notes ?? null,
      createdBy: session!.user.id,
    },
  })

  // Margin changes invalidate all cached prices because any product could be affected
  await invalidatePriceCache()

  return NextResponse.json({ data: margin }, { status: 201 })
}
