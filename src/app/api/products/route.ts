import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { createProductSchema, productFilterSchema } from "@/lib/validators/product"
import { generateSlug } from "@/lib/utils/slug"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { withCache, invalidateProductCache, CacheKey, TTL } from "@/lib/cache"

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const params = Object.fromEntries(searchParams.entries())
  const filter = productFilterSchema.parse(params)

  // where koşulları
  type WhereClause = {
    deletedAt: null
    isActive?: boolean
    isFeatured?: boolean
    isNew?: boolean
    isOutlet?: boolean
    brandId?: string
    categoryId?: string | null | { not: null }
    OR?: Array<{
      name?: { contains: string; mode: "insensitive" }
      barcode?: { contains: string; mode: "insensitive" }
      sku?: { contains: string; mode: "insensitive" }
      modelCode?: { contains: string; mode: "insensitive" }
    }>
    supplierProducts?: {
      some: {
        deletedAt: null
        isAvailable?: boolean
        stockQuantity?: { gt: number } | { equals: number }
        supplierId?: string
      }
    }
  }

  const where: WhereClause = { deletedAt: null }

  if (filter.isActive !== undefined) where.isActive = filter.isActive
  if (filter.isFeatured) where.isFeatured = true
  if (filter.isNew) where.isNew = true
  if (filter.isOutlet) where.isOutlet = true
  if (filter.brandId) where.brandId = filter.brandId
  if (filter.categoryId) {
    where.categoryId = filter.categoryId
  } else {
    const hasCategory = searchParams.get("hasCategory")
    if (hasCategory === "true") {
      where.categoryId = { not: null }
    } else if (hasCategory === "false") {
      where.categoryId = null
    }
  }

  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { barcode: { contains: filter.search, mode: "insensitive" } },
      { sku: { contains: filter.search, mode: "insensitive" } },
      { modelCode: { contains: filter.search, mode: "insensitive" } },
    ]
  }

  if (filter.inStock !== undefined || filter.supplierId) {
    where.supplierProducts = {
      some: {
        deletedAt: null,
        ...(filter.inStock !== undefined
          ? { isAvailable: true, stockQuantity: filter.inStock ? { gt: 0 } : { equals: 0 } }
          : {}),
        ...(filter.supplierId ? { supplierId: filter.supplierId } : {}),
      },
    }
  }

  const orderBy: Record<string, "asc" | "desc"> = {
    [filter.sortBy]: filter.sortOrder,
  }

  // Build a deterministic cache key from all active filters
  const cacheKey = CacheKey.productList(
    new URLSearchParams(searchParams).toString() || "default"
  )

  const result = await withCache(cacheKey, TTL.PRODUCT_LIST, async () => {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        include: {
          brand: { select: { id: true, name: true, logoUrl: true } },
          category: { select: { id: true, name: true } },
          supplierProducts: {
            where: { deletedAt: null },
            select: {
              id: true,
              supplierId: true,
              purchasePrice: true,
              stockQuantity: true,
              isAvailable: true,
              currency: true,
              supplier: { select: { id: true, name: true, code: true } },
            },
            orderBy: { purchasePrice: "asc" },
          },
        },
      }),
      prisma.product.count({ where }),
    ])
    return {
      data: products,
      meta: {
        total,
        page: filter.page,
        limit: filter.limit,
        totalPages: Math.ceil(total / filter.limit),
      },
    }
  })

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const body = await req.json()
  const parsed = createProductSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz veri.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data

  // Slug oluştur - çakışma kontrolü
  const baseSlug = generateSlug(data.name)
  let finalSlug = baseSlug
  let attempt = 0
  while (true) {
    const existing = await prisma.product.findFirst({
      where: { slug: finalSlug, deletedAt: null },
    })
    if (!existing) break
    attempt++
    finalSlug = `${baseSlug}-${attempt}`
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: finalSlug,
      brandId: data.brandId ?? null,
      categoryId: data.categoryId ?? null,
      barcode: data.barcode ?? null,
      sku: data.sku ?? null,
      modelCode: data.modelCode ?? null,
      description: data.description ?? null,
      shortDescription: data.shortDescription ?? null,
      specs: data.specs ? data.specs : undefined,
      images: data.images ?? [],
      weight: data.weight ?? null,
      dimensions: data.dimensions ? data.dimensions : undefined,
      warrantyMonths: data.warrantyMonths ?? null,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
      isNew: data.isNew,
      isOutlet: data.isOutlet,
      minOrderQuantity: data.minOrderQuantity,
      unit: data.unit,
      // metadata Record<string,unknown> → cast to satisfy Prisma InputJsonValue
      ...(data.metadata ? { metadata: data.metadata as Prisma.InputJsonValue } : {}),
      createdBy: session!.user.id,
    },
    include: {
      brand: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  })

  // Invalidate product list caches so the new product appears immediately
  await invalidateProductCache()

  return NextResponse.json({ data: product }, { status: 201 })
}
