import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { calculateBulkPrices } from "@/services/pricing.service"
import { invalidatePriceCache } from "@/lib/cache"
import { z } from "zod"

// ---------------------------------------------------------------------------
// GET /api/admin/campaigns
// Outlet veya Featured olan ürünleri listele
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "50")))
  const skip = (page - 1) * limit

  try {
    const where = {
      deletedAt: null,
      OR: [{ isOutlet: true }, { isFeatured: true }],
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          isFeatured: true,
          isOutlet: true,
          images: true,
          brand: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          supplierProducts: {
            where: { deletedAt: null, isAvailable: true },
            select: { purchasePrice: true, stockQuantity: true },
            orderBy: { purchasePrice: "asc" },
            take: 1,
          },
          manualPrice: true,
          manualPriceCurrency: true,
          campaignDiscountPct: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.product.count({ where }),
    ])

    // Hesaplanan satış fiyatlarını ekle (pricing service)
    const priceMap = await calculateBulkPrices(products.map((p) => p.id))

    const enriched = products.map((p) => {
      const pricing = priceMap.get(p.id)
      return {
        ...p,
        calculatedSalePrice: pricing?.salePriceExVat ?? null,
        calculatedCurrency: pricing ? "USD" : null,
      }
    })

    return NextResponse.json({
      data: enriched,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error("[GET /api/admin/campaigns]", err)
    return NextResponse.json({ error: "Kampanyalı ürünler yüklenemedi." }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/campaigns
// Ürünü kampanyaya ekle
// Body: { productId: string, type: "outlet" | "featured" }
// ---------------------------------------------------------------------------
const addSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(["outlet", "featured"]),
})

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  try {
    const body = await req.json()
    const parsed = addSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri.", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { productId, type } = parsed.data

    const existing = await prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: { id: true, name: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 })
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(type === "outlet" ? { isOutlet: true } : { isFeatured: true }),
      },
      select: { id: true, name: true, isOutlet: true, isFeatured: true },
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error("[POST /api/admin/campaigns]", err)
    return NextResponse.json({ error: "Ürün kampanyaya eklenemedi." }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/campaigns
// Ürünü kampanyadan çıkar
// Body: { productId: string, type?: "outlet" | "featured" | "all" }
// type belirtilmezse veya "all" ise her ikisi de false yapılır
// ---------------------------------------------------------------------------
const removeSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(["outlet", "featured", "all"]).optional().default("all"),
})

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  try {
    const body = await req.json()
    const parsed = removeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri.", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { productId, type } = parsed.data

    const existing = await prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 })
    }

    const updateData =
      type === "outlet"
        ? { isOutlet: false }
        : type === "featured"
        ? { isFeatured: false }
        : { isOutlet: false, isFeatured: false }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      select: { id: true, name: true, isOutlet: true, isFeatured: true },
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error("[DELETE /api/admin/campaigns]", err)
    return NextResponse.json({ error: "Ürün kampanyadan çıkarılamadı." }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/campaigns
// Kampanyalı ürünün fiyat ve indirim bilgilerini güncelle
// Body: { productId: string, manualPrice?: number | null, manualPriceCurrency?: string | null, campaignDiscountPct?: number | null }
// ---------------------------------------------------------------------------
const patchSchema = z.object({
  productId: z.string().uuid(),
  manualPrice: z.number().nonnegative().nullable().optional(),
  manualPriceCurrency: z.enum(["TRY", "USD", "EUR"]).nullable().optional(),
  campaignDiscountPct: z.number().min(0).max(100).nullable().optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  try {
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri.", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { productId, manualPrice, manualPriceCurrency, campaignDiscountPct } = parsed.data

    const updateData: Record<string, unknown> = {}
    if (manualPrice !== undefined) updateData.manualPrice = manualPrice
    if (manualPriceCurrency !== undefined) updateData.manualPriceCurrency = manualPriceCurrency
    if (campaignDiscountPct !== undefined) updateData.campaignDiscountPct = campaignDiscountPct

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 })
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      select: {
        id: true,
        name: true,
        manualPrice: true,
        manualPriceCurrency: true,
        campaignDiscountPct: true,
        isFeatured: true,
        isOutlet: true,
      },
    })

    // Fiyat cache'ini temizle — bir sonraki istekte taze hesaplanır
    invalidatePriceCache(productId)

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error("[PATCH /api/admin/campaigns]", err)
    return NextResponse.json({ error: "Kampanya fiyatı güncellenemedi." }, { status: 500 })
  }
}
