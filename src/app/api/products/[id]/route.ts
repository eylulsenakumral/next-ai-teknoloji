import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { updateProductSchema } from "@/lib/validators/product"
import { generateSlug } from "@/lib/utils/slug"
import { getAdminSession, requireReadPermission, requireWritePermission } from "@/lib/auth-helpers"
import { withCache, invalidateProductCache, invalidateNextCache, CacheKey, TTL } from "@/lib/cache"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  const authError = requireReadPermission(session)
  if (authError) return authError

  const { id } = await params

  const product = await withCache(
    CacheKey.productDetail(id),
    TTL.PRODUCT_DETAIL,
    () =>
      prisma.product.findFirst({
        where: { id, deletedAt: null },
        include: {
          brand: { select: { id: true, name: true, logoUrl: true } },
          category: {
            select: {
              id: true,
              name: true,
              path: true,
              parent: { select: { id: true, name: true } },
            },
          },
          supplierProducts: {
            where: { deletedAt: null },
            include: {
              supplier: { select: { id: true, name: true, code: true } },
              priceHistory: {
                orderBy: { recordedAt: "desc" },
                take: 30,
                select: {
                  id: true,
                  oldPrice: true,
                  newPrice: true,
                  priceChangePct: true,
                  recordedAt: true,
                  currency: true,
                },
              },
            },
            orderBy: { purchasePrice: "asc" },
          },
        },
      })
  )

  if (!product) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 })
  }

  return NextResponse.json({ data: product })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  const authError = requireWritePermission(session)
  if (authError) return authError

  const { id } = await params

  const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } })
  if (!existing) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 })
  }

  const body = await req.json()
  const parsed = updateProductSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz veri.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data

  // Slug güncelleme - isim değiştiyse yeniden oluştur
  let finalSlug = existing.slug
  if (data.name && data.name !== existing.name) {
    const baseSlug = generateSlug(data.name)
    finalSlug = baseSlug
    let attempt = 0
    while (true) {
      const conflict = await prisma.product.findFirst({
        where: { slug: finalSlug, deletedAt: null, id: { not: id } },
      })
      if (!conflict) break
      attempt++
      finalSlug = `${baseSlug}-${attempt}`
    }
  }

  // Prisma relation updates (brand/category via FK)
  const updateData: Record<string, unknown> = {
    updatedBy: session!.user.id,
  }

  if (data.name !== undefined) { updateData.name = data.name; updateData.slug = finalSlug }
  if (data.barcode !== undefined) updateData.barcode = data.barcode ?? null
  if (data.sku !== undefined) updateData.sku = data.sku ?? null
  if (data.modelCode !== undefined) updateData.modelCode = data.modelCode ?? null
  if (data.description !== undefined) updateData.description = data.description ?? null
  if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription ?? null
  if (data.specs !== undefined) updateData.specs = data.specs ?? Prisma.JsonNull
  if (data.images !== undefined) updateData.images = data.images
  if (data.weight !== undefined) updateData.weight = data.weight ?? null
  if (data.dimensions !== undefined) updateData.dimensions = data.dimensions ?? Prisma.JsonNull
  if (data.warrantyMonths !== undefined) updateData.warrantyMonths = data.warrantyMonths ?? null
  if (data.isActive !== undefined) updateData.isActive = data.isActive
  if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured
  if (data.isNew !== undefined) updateData.isNew = data.isNew
  if (data.isOutlet !== undefined) updateData.isOutlet = data.isOutlet
  if (data.minOrderQuantity !== undefined) updateData.minOrderQuantity = data.minOrderQuantity
  if (data.unit !== undefined) updateData.unit = data.unit
  if (data.metadata !== undefined) updateData.metadata = data.metadata ?? Prisma.JsonNull
  if (data.manualPrice !== undefined) updateData.manualPrice = data.manualPrice ?? null
  if (data.manualPriceCurrency !== undefined) updateData.manualPriceCurrency = data.manualPriceCurrency ?? null
  if (data.campaignDiscountPct !== undefined) updateData.campaignDiscountPct = data.campaignDiscountPct ?? null
  if (data.brandId !== undefined) updateData.brandId = data.brandId ?? null
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId ?? null

  const product = await prisma.product.update({
    where: { id },
    data: updateData as Prisma.ProductUncheckedUpdateInput,
    include: {
      brand: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  })

  // Invalidate detail + list caches for this product
  await invalidateProductCache(id)

  return NextResponse.json({ data: product })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  const authError = requireWritePermission(session)
  if (authError) return authError

  const { id } = await params

  const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } })
  if (!existing) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 })
  }

  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: session!.user.id },
  })

  await invalidateProductCache(id)
  await invalidateNextCache(["product-listing"])

  return NextResponse.json({ success: true })
}
