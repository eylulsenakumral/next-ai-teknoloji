import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getDealerSession, requireDealerSession } from "@/lib/dealer-auth"
import { calculateProductPrice, getStockInfo } from "@/lib/pricing"

export async function GET(req: NextRequest) {
  const session = await getDealerSession()
  const authError = requireDealerSession(session)
  if (authError) return authError

  const { searchParams } = new URL(req.url)

  const q = searchParams.get("q") ?? ""
  const brandId = searchParams.get("brandId") ?? ""
  const categoryId = searchParams.get("categoryId") ?? ""
  const supplierId = searchParams.get("supplierId") ?? ""
  const minPrice = searchParams.get("minPrice")
  const maxPrice = searchParams.get("maxPrice")
  const inStock = searchParams.get("inStock")
  const sortBy = searchParams.get("sortBy") ?? "newest"
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const limit = Math.min(48, Math.max(1, Number(searchParams.get("limit") ?? "24")))

  // Fiyat filtresi için supplier product'ları önceden bul
  let filteredProductIds: string[] | undefined

  if (minPrice || maxPrice || inStock === "true" || inStock === "false") {
    const spWhere: Record<string, unknown> = {
      deletedAt: null,
    }
    if (inStock !== "false") {
      spWhere.isAvailable = true
    }
    if (minPrice || maxPrice) {
      spWhere.purchasePrice = {
        ...(minPrice ? { gte: Number(minPrice) } : {}),
        ...(maxPrice ? { lte: Number(maxPrice) } : {}),
      }
    }
    if (inStock === "true") {
      spWhere.stockQuantity = { gt: 0 }
    } else if (inStock === "false") {
      spWhere.stockQuantity = { equals: 0 }
    }

    const supplierProducts = await prisma.supplierProduct.findMany({
      where: spWhere,
      select: { productId: true },
    })
    filteredProductIds = [
      ...new Set(
        supplierProducts
          .map((sp) => sp.productId)
          .filter((id): id is string => id !== null)
      ),
    ]
  }

  // Kategori filtresi: seçilen kategori + tüm alt kategorileri dahil et
  let categoryFilter: Record<string, unknown> = {}
  if (categoryId) {
    const allCats = await prisma.category.findMany({
      where: { deletedAt: null },
      select: { id: true, parentId: true },
    })
    const descendantIds = new Set<string>([categoryId])
    function findDescendants(parentId: string) {
      for (const c of allCats) {
        if (c.parentId === parentId && !descendantIds.has(c.id)) {
          descendantIds.add(c.id)
          findDescendants(c.id)
        }
      }
    }
    findDescendants(categoryId)
    categoryFilter = { categoryId: { in: [...descendantIds] } }
  }

  const where: Record<string, unknown> = {
    deletedAt: null,
    isActive: true,
    supplierProducts: {
      some: {
        deletedAt: null,
        isAvailable: true,
        stockQuantity: { gt: 0 },
      },
    },
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { barcode: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { modelCode: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(brandId ? { brandId } : {}),
    ...categoryFilter,
    ...(supplierId
      ? { supplierProducts: { some: { supplierId, deletedAt: null, isAvailable: true, stockQuantity: { gt: 0 } } } }
      : {}),
    ...(filteredProductIds ? { id: { in: filteredProductIds } } : {}),
  }

  const orderBy: Record<string, string> =
    sortBy === "name"
      ? { name: "asc" }
      : sortBy === "price"
        ? { createdAt: "desc" } // fiyat sıralaması hesaplamalı olduğu için en yeni
        : { createdAt: "desc" } // newest (default)

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
        category: { select: { id: true, name: true, slug: true } },
        supplierProducts: {
          where: { deletedAt: null, isAvailable: true },
          select: {
            purchasePrice: true,
            vatRate: true,
            stockQuantity: true,
            isAvailable: true,
            currency: true,
            supplier: { select: { marginRate: true } },
          },
          orderBy: { purchasePrice: "asc" },
          take: 1,
        },
      },
    }),
    prisma.product.count({ where }),
  ])

  // Fiyat ve stok bilgilerini hesapla
  const productsWithPricing = products.map((product) => {
    const sp = product.supplierProducts[0]
    let pricing = null

    // Fırsat/outlet ürünlerde manualPrice direkt satış fiyatıdır
    if (product.manualPrice != null) {
      const manualPriceNum = Number(product.manualPrice)
      const originalPriceNum = sp?.purchasePrice
        ? Math.round(Number(sp.purchasePrice) * (1 + Number(sp.supplier?.marginRate ?? 30) / 100) * 100) / 100
        : null
      pricing = {
        salePriceExVat: manualPriceNum,
        salePriceIncVat: Math.round(manualPriceNum * 1.20 * 100) / 100,
        vatRate: 20,
        currency: product.manualPriceCurrency ?? "USD",
        originalPrice: originalPriceNum,
      }
    } else if (sp?.purchasePrice) {
      const purchasePrice = Number(sp.purchasePrice)
      const vatRate = Number(sp.vatRate ?? 20)
      const multiplier = 1 + Number(sp.supplier?.marginRate ?? 30) / 100
      const salePriceExVat = purchasePrice * multiplier
      const salePriceIncVat = salePriceExVat * (1 + vatRate / 100)
      pricing = {
        salePriceExVat: Math.round(salePriceExVat * 100) / 100,
        salePriceIncVat: Math.round(salePriceIncVat * 100) / 100,
        vatRate,
        currency: sp.currency ?? "TRY",
      }
    }

    const totalStock = product.supplierProducts.reduce(
      (sum, s) => sum + s.stockQuantity,
      0
    )

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      barcode: product.barcode,
      sku: product.sku,
      modelCode: product.modelCode,
      shortDescription: product.shortDescription,
      images: product.images,
      warrantyMonths: product.warrantyMonths,
      minOrderQuantity: product.minOrderQuantity,
      unit: product.unit,
      isNew: product.isNew,
      isFeatured: product.isFeatured,
      isOutlet: product.isOutlet,
      brand: product.brand,
      category: product.category,
      pricing,
      stock: {
        quantity: totalStock,
        isAvailable: totalStock > 0,
      },
    }
  })

  return NextResponse.json({
    products: productsWithPricing,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}
