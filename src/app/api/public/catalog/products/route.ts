import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// TCMB döviz kuru cache
let cachedUsdTry = 0
let cacheExpiry = 0

async function getUsdTryRate(): Promise<number> {
  const now = Date.now()
  if (cachedUsdTry && now < cacheExpiry) return cachedUsdTry
  try {
    const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml")
    const xml = await res.text()
    const match = xml.match(/CurrencyCode="USD"[\s\S]*?<ForexSelling>([\d.]+)<\/ForexSelling>/)
    if (match) {
      cachedUsdTry = parseFloat(match[1])
      cacheExpiry = now + 3600_000 // 1 saat cache
      return cachedUsdTry
    }
  } catch {}
  return 0
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const session = await getServerSession(authOptions)
    const isAuthenticated = !!session?.user
    const isAdmin = ["admin", "super_admin"].includes((session?.user as { role?: string })?.role ?? "")
    const showPrice = isAuthenticated || isAdmin

    const brandSlug = searchParams.get("brandSlug") ?? ""
    const categorySlug = searchParams.get("categorySlug") ?? ""
    const search = searchParams.get("search") ?? ""
    const sortBy = searchParams.get("sortBy") ?? "newest"
    const inStockParam = searchParams.get("inStock")
    const inStock = inStockParam === null ? true : inStockParam === "true"
    const campaign = searchParams.get("campaign") === "true"
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")))

    const orderBy =
      sortBy === "name-asc"
        ? { name: "asc" as const }
        : sortBy === "name-desc"
          ? { name: "desc" as const }
          : { createdAt: "desc" as const }

    // Kategori filtresi: seçilen kategori + tüm alt kategorileri dahil et
    // + product_categories junction table üzerinden çok kategorili ürünler
    let categoryFilter: Record<string, unknown> = {}
    if (categorySlug) {
      const cat = await prisma.category.findFirst({
        where: { slug: categorySlug, deletedAt: null, isActive: true },
        select: { id: true },
      })
      if (cat) {
        const allCats = await prisma.category.findMany({
          where: { deletedAt: null, isActive: true },
          select: { id: true, parentId: true },
        })
        const descendantIds = new Set<string>([cat.id])
        function findDescendants(parentId: string) {
          for (const c of allCats) {
            if (c.parentId === parentId && !descendantIds.has(c.id)) {
              descendantIds.add(c.id)
              findDescendants(c.id)
            }
          }
        }
        findDescendants(cat.id)
        const ids = [...descendantIds]
        // Junction table'dan ekstra ürün ID'lerini bul
        const junctionProducts = await prisma.$queryRaw<{ id: string }[]>`
          SELECT product_id as id FROM product_categories
          WHERE category_id = ANY(${ids}::uuid[])
        `
        const junctionIds = junctionProducts.map((p) => p.id)
        const allProductIds = new Set([...junctionIds])
        // Ana kategori + junction ürünlerini birleştir
        categoryFilter = {
          OR: [
            { categoryId: { in: ids } },
            ...(allProductIds.size > 0 ? [{ id: { in: [...allProductIds] } }] : []),
          ],
        }
      }
    }

    // AND ile tüm filtreleri birleştir (birden fazla OR çakışmasını önle)
    const andConditions: Record<string, unknown>[] = [
      { deletedAt: null },
      { isActive: true },
    ]

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { sku: { contains: search, mode: "insensitive" as const } },
          { modelCode: { contains: search, mode: "insensitive" as const } },
          { barcode: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          { brand: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      })
    }

    if (brandSlug) andConditions.push({ brand: { slug: brandSlug } })

    if (Object.keys(categoryFilter).length > 0) andConditions.push(categoryFilter)

    if (inStock) {
      andConditions.push({
        supplierProducts: { some: { deletedAt: null, isAvailable: true, stockQuantity: { gt: 0 } } },
      })
    }

    if (campaign) {
      andConditions.push({ OR: [{ isFeatured: true }, { isOutlet: true }] })
    }

    const where = { AND: andConditions }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          images: true,
          description: true,
          specs: true,
          brand: { select: { name: true, slug: true } },
          category: { select: { name: true, slug: true } },
          supplierProducts: {
            where: { deletedAt: null, isAvailable: true },
            select: {
              stockQuantity: true,
              purchasePrice: showPrice,
              currency: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ])

    // Döviz kuru çek (sadece bayi/admin fiyat görecekse)
    // Döviz kuru çek (sadece bayi/admin fiyat görecekse)
    const usdTry = showPrice ? await getUsdTryRate() : 0
    if (showPrice && !usdTry) {
      return NextResponse.json({ error: "Kur bilgisi alınamadı." }, { status: 503 })
    }

    const data = products.map((p) => {
      const totalStock = p.supplierProducts.reduce((sum, sp) => sum + sp.stockQuantity, 0)

      // Get lowest price if authenticated or admin
      const lowestSupplier = showPrice
        ? p.supplierProducts
            .filter((sp) => sp.purchasePrice !== null)
            .sort((a, b) => Number(a.purchasePrice) - Number(b.purchasePrice))[0]
        : null

      const lowestPrice = lowestSupplier ? Number(lowestSupplier.purchasePrice) : null
      const priceCurrency = lowestSupplier?.currency || "TRY"
      const priceTry = lowestPrice != null
        ? priceCurrency === "USD" ? lowestPrice * usdTry
          : priceCurrency === "EUR" ? lowestPrice * (usdTry / 1.0) // simplification
          : lowestPrice
        : null

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        images: p.images,
        description: p.description,
        specifications: p.specs,
        brand: p.brand,
        category: p.category,
        stockStatus: totalStock > 0,
        stockCount: totalStock,
        price: lowestPrice,
        currency: priceCurrency,
        priceTry,
        usdTryRate: usdTry,
      }
    })

    return NextResponse.json({
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("[public/catalog/products] GET error:", error)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
