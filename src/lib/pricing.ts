/**
 * Pricing service: alış fiyatından satış fiyatı hesaplar.
 * Margin cascade: PRODUCT > BRAND > CATEGORY > GLOBAL
 */

import { prisma } from "@/lib/db"

export interface PricingResult {
  purchasePrice: number
  vatRate: number
  marginPct: number
  salePriceExVat: number
  salePriceIncVat: number
}

/**
 * En yüksek öncelikli aktif marjı bul.
 * Scope sırası: PRODUCT > BRAND > CATEGORY > GLOBAL
 */
async function resolveMargin(
  productId: string,
  brandId: string | null,
  categoryId: string | null
): Promise<number> {
  // Önce product-level margin
  if (productId) {
    const productMargin = await prisma.profitMargin.findFirst({
      where: {
        scope: "PRODUCT",
        scopeId: productId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: { priority: "desc" },
    })
    if (productMargin) return Number(productMargin.marginPct)
  }

  // Brand margin
  if (brandId) {
    const brandMargin = await prisma.profitMargin.findFirst({
      where: {
        scope: "BRAND",
        scopeId: brandId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: { priority: "desc" },
    })
    if (brandMargin) return Number(brandMargin.marginPct)
  }

  // Category margin
  if (categoryId) {
    const categoryMargin = await prisma.profitMargin.findFirst({
      where: {
        scope: "CATEGORY",
        scopeId: categoryId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: { priority: "desc" },
    })
    if (categoryMargin) return Number(categoryMargin.marginPct)
  }

  // Global margin
  const globalMargin = await prisma.profitMargin.findFirst({
    where: {
      scope: "GLOBAL",
      isActive: true,
      deletedAt: null,
    },
    orderBy: { priority: "desc" },
  })

  return globalMargin ? Number(globalMargin.marginPct) : 30 // default %30
}

export async function calculateProductPrice(
  productId: string,
  brandId: string | null,
  categoryId: string | null
): Promise<PricingResult | null> {
  // En iyi tedarikçi fiyatını al (en düşük alış fiyatı)
  const supplierProduct = await prisma.supplierProduct.findFirst({
    where: {
      productId,
      isAvailable: true,
      deletedAt: null,
      purchasePrice: { not: null },
    },
    orderBy: { purchasePrice: "asc" },
  })

  if (!supplierProduct?.purchasePrice) return null

  const purchasePrice = Number(supplierProduct.purchasePrice)
  const vatRate = Number(supplierProduct.vatRate ?? 20)
  const marginPct = await resolveMargin(productId, brandId, categoryId)

  const salePriceExVat = purchasePrice * (1 + marginPct / 100)
  const salePriceIncVat = salePriceExVat * (1 + vatRate / 100)

  return {
    purchasePrice,
    vatRate,
    marginPct,
    salePriceExVat: Math.round(salePriceExVat * 100) / 100,
    salePriceIncVat: Math.round(salePriceIncVat * 100) / 100,
  }
}

export async function getStockInfo(productId: string): Promise<{
  totalStock: number
  isAvailable: boolean
}> {
  const result = await prisma.supplierProduct.aggregate({
    where: {
      productId,
      isAvailable: true,
      deletedAt: null,
    },
    _sum: { stockQuantity: true },
  })

  const totalStock = result._sum.stockQuantity ?? 0
  return {
    totalStock,
    isAvailable: totalStock > 0,
  }
}
