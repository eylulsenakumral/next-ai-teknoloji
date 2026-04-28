import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { decode } from "next-auth/jwt"
import { authOptions } from "@/lib/auth"
import { unstable_cache } from "next/cache"

// TCMB döviz kuru cache - unstable_cache ile 1 saat
const getCachedUsdTryRate = unstable_cache(
  async (): Promise<number> => {
    try {
      const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
        next: { revalidate: 3600 },
      })
      const xml = await res.text()
      const match = xml.match(/CurrencyCode="USD"[\s\S]*?<ForexSelling>([\d.]+)<\/ForexSelling>/)
      if (match) {
        return parseFloat(match[1])
      }
    } catch {}
    return 0
  },
  ["usd-try-rate"],
  { revalidate: 3600 }
)

// Kategori hiyerarşisi cache - 5 dakika
const getCategoryDescendants = unstable_cache(
  async (categorySlug: string) => {
    const cat = await prisma.category.findFirst({
      where: { slug: categorySlug, deletedAt: null, isActive: true },
      select: { id: true },
    })
    if (!cat) return []

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
    return [...descendantIds]
  },
  ["category-descendants"],
  { revalidate: 300 }
)

// Product listing cache - 60 saniye
const getCachedProductListing = unstable_cache(
  async (
    brandSlug: string,
    categorySlug: string,
    search: string,
    sortBy: string,
    inStock: boolean,
    campaign: boolean,
    minPrice: number | null,
    maxPrice: number | null,
    page: number,
    limit: number
  ) => {
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
      const ids = await getCategoryDescendants(categorySlug)
      if (ids.length > 0) {
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

    const brandSlugs = brandSlug
      .split(",")
      .map((slug) => slug.trim())
      .filter(Boolean)
    if (brandSlugs.length === 1) andConditions.push({ brand: { slug: brandSlugs[0] } })
    if (brandSlugs.length > 1) andConditions.push({ brand: { slug: { in: brandSlugs } } })

    if (Object.keys(categoryFilter).length > 0) andConditions.push(categoryFilter)

    if (minPrice != null || maxPrice != null) {
      andConditions.push({
        supplierProducts: {
          some: {
            deletedAt: null,
            isAvailable: true,
            purchasePrice: {
              ...(minPrice != null ? { gte: minPrice } : {}),
              ...(maxPrice != null ? { lte: maxPrice } : {}),
            },
          },
        },
      })
    }

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
          manualPrice: true,
          manualPriceCurrency: true,
          brand: { select: { name: true, slug: true } },
          category: { select: { name: true, slug: true } },
          supplierProducts: {
            where: { deletedAt: null, isAvailable: true },
            select: {
              stockQuantity: true,
              purchasePrice: true,
              currency: true,
              supplier: { select: { code: true, marginRate: true } },
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ])

    return { products, total }
  },
  ["product-listing"],
  { revalidate: 60, tags: ["product-listing"] }
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    let authSession = await getServerSession(authOptions)
    if (!authSession?.user) {
      const authHeader = req.headers.get("authorization")
      const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
      if (bearer && process.env.NEXTAUTH_SECRET) {
        try {
          const decoded = await decode({ secret: process.env.NEXTAUTH_SECRET, token: bearer })
          if (decoded?.role === "dealer" && decoded?.status === "APPROVED") {
            authSession = { user: decoded as any, expires: "" }
          }
        } catch {}
      }
    }
    const isAuthenticated = !!authSession?.user
    const isAdmin = ["admin", "super_admin"].includes((authSession?.user as { role?: string })?.role ?? "")
    const showPrice = isAuthenticated || isAdmin

    const brandSlug = searchParams.get("brandSlug") ?? ""
    const categorySlug = searchParams.get("categorySlug") ?? ""
    const search = searchParams.get("search") ?? ""
    const sortBy = searchParams.get("sortBy") ?? "newest"
    const inStockParam = searchParams.get("inStock")
    const inStock = inStockParam === null ? true : inStockParam === "true"
    const campaign = searchParams.get("campaign") === "true"
    const minPriceParam = Number(searchParams.get("minPrice"))
    const maxPriceParam = Number(searchParams.get("maxPrice"))
    const minPrice = Number.isFinite(minPriceParam) && minPriceParam > 0 ? minPriceParam : null
    const maxPrice = Number.isFinite(maxPriceParam) && maxPriceParam > 0 ? maxPriceParam : null
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")))

    // Cache'den ürünleri çek
    const { products, total } = await getCachedProductListing(
      brandSlug,
      categorySlug,
      search,
      sortBy,
      inStock,
      campaign,
      minPrice,
      maxPrice,
      page,
      limit
    )

    // Döviz kuru çek (sadece bayi/admin fiyat görecekse)
    const usdTry = showPrice ? await getCachedUsdTryRate() : 0
    if (showPrice && !usdTry) {
      return NextResponse.json({ error: "Kur bilgisi alınamadı." }, { status: 503 })
    }

    const data = products.map((p) => {
      const totalStock = p.supplierProducts.reduce((sum, sp) => sum + sp.stockQuantity, 0)

      // Get lowest price if authenticated or admin (with supplier markup)
      // Okisan ürünleri için fiyat gizlenir
      const lowestSupplier = showPrice
        ? p.supplierProducts
            .filter((sp) => sp.purchasePrice !== null)
            .map((sp) => {
              const base = Number(sp.purchasePrice)
              const code = sp.supplier?.code?.toUpperCase() ?? ""
              const markup = 1 + Number(sp.supplier?.marginRate ?? 30) / 100
              return { ...sp, markedUpPrice: base * markup, supplierCode: code }
            })
            .sort((a, b) => a.markedUpPrice - b.markedUpPrice)[0]
        : null

      const isOkisanOnly = lowestSupplier?.supplierCode === "OKISAN"
      let lowestPrice = lowestSupplier && !isOkisanOnly ? lowestSupplier.markedUpPrice : null
      let priceCurrency = lowestSupplier?.currency || "TRY"

      // Fırsat/outlet ürünlerde manualPrice direkt satış fiyatıdır
      if (showPrice && (p as { manualPrice?: unknown }).manualPrice != null) {
        lowestPrice = Number((p as { manualPrice: unknown }).manualPrice)
        priceCurrency = (p as { manualPriceCurrency?: string }).manualPriceCurrency ?? "USD"
      }

      const priceTry = lowestPrice != null
        ? priceCurrency === "USD" ? lowestPrice * usdTry
          : priceCurrency === "EUR" ? lowestPrice * (usdTry / 1.0)
          : lowestPrice
        : null

      const manualPrice = (p as { manualPrice?: unknown }).manualPrice
      const originalPrice = showPrice && manualPrice != null && lowestSupplier && !isOkisanOnly
        ? lowestSupplier.markedUpPrice
        : null
      const originalPriceTry = originalPrice != null
        ? (lowestSupplier!.currency === "USD" ? originalPrice * usdTry : originalPrice)
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
        hidePrice: isOkisanOnly,
        price: lowestPrice,
        currency: priceCurrency,
        priceTry,
        originalPrice,
        originalPriceTry,
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
