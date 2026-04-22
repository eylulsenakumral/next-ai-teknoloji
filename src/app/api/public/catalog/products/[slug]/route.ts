import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Tedarikçi → Depo adı eşlemesi
const SUPPLIER_DEPO_MAP: Record<string, string> = {
  b2bdepo: "Mersin Depo",
  okisan: "Perpa Depo",
  indexgrup: "Kadıköy Depo",
  netex: "Kadıköy Depo",
  ergen: "Ergen Depo",
  tesan: "Tesan Depo",
  bizimhesap: "Çorlu Depo",
}

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const session = await getServerSession(authOptions)
    const isAuthenticated = !!session?.user
    const isAdmin = ["admin", "super_admin"].includes((session?.user as { role?: string })?.role ?? "")
    const showPrice = isAuthenticated || isAdmin

    const product = await prisma.product.findFirst({
      where: { slug, deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        images: true,
        description: true,
        specs: true,
        sku: true,
        barcode: true,
        modelCode: true,
        weight: true,
        warrantyMonths: true,
        categoryId: true,
        brand: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true, parentId: true } },
        supplierProducts: {
          where: { deletedAt: null, isAvailable: true, stockQuantity: { gt: 0 } },
          select: {
            stockQuantity: true,
            purchasePrice: showPrice,
            currency: true,
            supplier: { select: { name: true, code: true } },
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 })
    }

    // Kategori ancestor zincirini oluştur (root → leaf)
    let categoryPath: { name: string; slug: string }[] = []
    if (product.category) {
      const path: { name: string; slug: string }[] = []
      let current = product.category as { name: string; slug: string; parentId: string | null } | null
      while (current) {
        path.unshift({ name: current.name, slug: current.slug })
        if (!current.parentId) break
        const parent = await prisma.category.findUnique({
          where: { id: current.parentId },
          select: { name: true, slug: true, parentId: true },
        })
        current = parent as { name: string; slug: string; parentId: string | null } | null
      }
      categoryPath = path
    }

    // Döviz kuru çek
    const usdTry = showPrice ? await getUsdTryRate() : 0

    const totalStock = product.supplierProducts.reduce((sum, sp) => sum + sp.stockQuantity, 0)

    // Tedarikçi bazlı stok ve fiyat bilgisi
    const suppliers = product.supplierProducts.map((sp) => {
      const supplierCode = sp.supplier?.code ?? ""
      const depoName = SUPPLIER_DEPO_MAP[supplierCode] || sp.supplier?.name || supplierCode
      const price = sp.purchasePrice ? Number(sp.purchasePrice) : null
      const currency = sp.currency || "TRY"
      const priceTry = price != null
        ? currency === "USD" ? price * usdTry
          : price
        : null

      return {
        depoName,
        stockQuantity: sp.stockQuantity,
        price,
        currency,
        priceTry,
      }
    })

    // En düşük fiyatı bul
    const lowestSupplier = showPrice
      ? suppliers.filter((s) => s.price !== null).sort((a, b) => (a.priceTry ?? 0) - (b.priceTry ?? 0))[0]
      : null

    const relatedProducts = product.categoryId
      ? await prisma.product.findMany({
          where: {
            categoryId: product.categoryId,
            id: { not: product.id },
            isActive: true,
            deletedAt: null,
          },
          take: 4,
          orderBy: { viewCount: "desc" },
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
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
        })
      : []

    // View count artır (fire-and-forget)
    prisma.product
      .update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => null)

    return NextResponse.json({
      data: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        images: product.images,
        description: product.description,
        specifications: product.specs,
        sku: product.sku,
        barcode: product.barcode,
        modelCode: product.modelCode,
        weight: product.weight,
        warrantyMonths: product.warrantyMonths,
        brand: product.brand,
        category: product.category,
        categoryPath,
        stockStatus: totalStock > 0,
        stockCount: totalStock,
        price: lowestSupplier?.price ?? null,
        currency: lowestSupplier?.currency ?? "TRY",
        priceTry: lowestSupplier?.priceTry ?? null,
        usdTryRate: usdTry,
        suppliers,
        relatedProducts: relatedProducts.map((rp) => {
          const stock = rp.supplierProducts.reduce((sum, sp) => sum + sp.stockQuantity, 0)
          const prices = showPrice ? rp.supplierProducts.map((sp) => Number(sp.purchasePrice)).filter((p) => p > 0) : []
          const rpLowest = showPrice && prices.length > 0 ? Math.min(...prices) : null
          const rpCurrency = rp.supplierProducts.find((sp) => sp.purchasePrice !== null)?.currency || "TRY"
          const rpPriceTry = rpLowest != null && rpCurrency === "USD" && usdTry > 0 ? rpLowest * usdTry : rpLowest
          return {
            id: rp.id,
            name: rp.name,
            slug: rp.slug,
            images: rp.images,
            brand: rp.brand,
            category: rp.category,
            stockStatus: stock > 0,
            stockCount: stock,
            price: rpLowest,
            currency: rpCurrency,
            priceTry: rpPriceTry,
            usdTryRate: usdTry,
          }
        }),
      },
    })
  } catch (error) {
    console.error("[public/catalog/products/[slug]] GET error:", error)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
