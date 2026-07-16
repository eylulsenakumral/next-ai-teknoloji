import type { ProfitMargin } from "@prisma/client"
import { prisma } from "@/lib/db"
import { withCache, invalidatePriceCache, CacheKey, TTL } from "@/lib/cache"

// Default global margin when no ProfitMargin record exists
const DEFAULT_MARGIN_PCT = 30
const DEFAULT_VAT_RATE = 20

export interface PriceCalculation {
  purchasePrice: number
  supplierProductId: string | null
  supplierId: string
  supplierName: string
  marginPct: number
  marginSource: "product" | "category" | "brand" | "global" | "supplier" | "manual"
  salePriceExVat: number
  vatRate: number
  salePriceIncVat: number
  profitAmount: number
  stockQuantity: number
  currency: string
  // manualPrice (outlet) ürünlerde, manualPrice uygulanmadan önceki normal hesaplanmış fiyat.
  // outlet olmayan ürünlerde null. Liste UI'ında üzeri çizili "orijinal fiyat" için.
  originalSalePriceExVat: number | null
}

/**
 * Calculate sale price from raw inputs. Pure math, no DB access.
 */
export function simulatePrice(
  purchasePrice: number,
  marginPct: number,
  vatRate: number
): { saleExVat: number; saleIncVat: number; profit: number } {
  const saleExVat = round4(purchasePrice * (1 + marginPct / 100))
  const saleIncVat = round4(saleExVat * (1 + vatRate / 100))
  const profit = round4(saleExVat - purchasePrice)
  return { saleExVat, saleIncVat, profit }
}

/**
 * Resolve the applicable margin for a given product, category, and brand.
 * Priority: PRODUCT > CATEGORY > BRAND > GLOBAL
 * Within same scope, higher priority number wins.
 */
export async function getApplicableMargin(
  productId: string,
  categoryId: string | null,
  brandId: string | null
): Promise<{ marginPct: number; source: string }> {
  const now = new Date()

  // Fetch all potentially applicable margins in one query
  const scopeIds = [productId, categoryId, brandId].filter(Boolean) as string[]

  const margins = await prisma.profitMargin.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      OR: [
        { scope: "GLOBAL", scopeId: null },
        { scope: { in: ["PRODUCT", "CATEGORY", "BRAND"] }, scopeId: { in: scopeIds } },
      ],
      AND: [
        { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
        { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
      ],
    },
    orderBy: { priority: "desc" },
  })

  // Find highest priority match per scope (PRODUCT > CATEGORY > BRAND > GLOBAL)
  const scopePriority: Record<string, number> = {
    PRODUCT: 4,
    CATEGORY: 3,
    BRAND: 2,
    GLOBAL: 1,
  }

  let best: { marginPct: number; source: string } | null = null
  let bestScopePriority = -1
  let bestRecordPriority = -1

  for (const m of margins) {
    // Verify scopeId matches the right entity
    if (m.scope === "PRODUCT" && m.scopeId !== productId) continue
    if (m.scope === "CATEGORY" && m.scopeId !== categoryId) continue
    if (m.scope === "BRAND" && m.scopeId !== brandId) continue

    const sp = scopePriority[m.scope] ?? 0
    const rp = m.priority

    if (
      sp > bestScopePriority ||
      (sp === bestScopePriority && rp > bestRecordPriority)
    ) {
      bestScopePriority = sp
      bestRecordPriority = rp
      best = {
        marginPct: parseFloat(m.marginPct.toString()),
        source: m.scope.toLowerCase(),
      }
    }
  }

  if (best) return best

  // Fallback: use default
  return { marginPct: DEFAULT_MARGIN_PCT, source: "global" }
}

/**
 * Calculate price for a single product.
 * Picks cheapest in-stock supplier, resolves applicable margin.
 * Result is cached; call invalidatePriceCache(productId) on data changes.
 */
export async function calculateProductPrice(
  productId: string
): Promise<PriceCalculation | null> {
  return withCache(CacheKey.price(productId), TTL.PRICE, () => _calculateProductPrice(productId))
}

async function _calculateProductPrice(productId: string): Promise<PriceCalculation | null> {
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    include: {
      supplierProducts: {
        where: {
          deletedAt: null,
          isAvailable: true,
          productId,
          purchasePrice: { not: null },
        },
        include: { supplier: true },
        orderBy: { purchasePrice: "asc" },
      },
    },
  })

  if (!product) return null

  // Fırsat/outlet ürünlerde manualPrice doğrudan satış fiyatıdır — marj uygulanmaz.
  // supplierProducts query filter'ı (isAvailable + purchasePrice not null) bu ürünleri
  // eleyebilir; bu yüzden manualPrice dalı supplierProducts[0] opsiyonel kabul eder.
  if (product.manualPrice != null) {
    const manualPriceNum = parseFloat(product.manualPrice.toString())
    const totalStock = product.supplierProducts.reduce((sum, sp) => sum + sp.stockQuantity, 0)
    const sp = product.supplierProducts[0]
    // manualPrice uygulanmadan önceki "normal" fiyat — üzeri çizili orijinal fiyat için.
    const originalSalePriceExVat = sp?.purchasePrice != null
      ? await computeOriginalPrice(sp, productId, product.categoryId, product.brandId)
      : null
    return {
      purchasePrice: manualPriceNum,
      supplierProductId: sp?.id ?? null,
      supplierId: sp?.supplierId ?? "",
      supplierName: sp?.supplier?.name ?? "",
      marginPct: 0,
      marginSource: "manual",
      salePriceExVat: manualPriceNum,
      vatRate: 20,
      salePriceIncVat: Math.round(manualPriceNum * 1.20 * 100) / 100,
      profitAmount: 0,
      stockQuantity: totalStock,
      currency: product.manualPriceCurrency ?? "USD",
      originalSalePriceExVat,
    }
  }

  // Non-manualPrice: product query zaten purchasePrice: { not: null } + orderBy asc
  // filter ediyor. Liste/detay route ile tutarlı olması için stock şartı KOYMUYORUZ —
  // stok 0 ürünler için de fiyat döner (outlet / pre-order / detay görünür).
  if (product.supplierProducts.length === 0) return null

  const cheapest = product.supplierProducts[0]
  const purchasePrice = parseFloat(cheapest.purchasePrice!.toString())
  const vatRate = cheapest.vatRate
    ? parseFloat(cheapest.vatRate.toString())
    : DEFAULT_VAT_RATE

  const totalStock = product.supplierProducts.reduce((sum, sp) => sum + sp.stockQuantity, 0)

  // Supplier margin önce gelir; yoksa ProfitMargin tablosuna düş
  const supplierMarginRate = cheapest.supplier?.marginRate != null
    ? Number(cheapest.supplier.marginRate)
    : null
  let marginPct: number
  let source: string
  if (supplierMarginRate !== null) {
    marginPct = supplierMarginRate
    source = "supplier"
  } else {
    const applicable = await getApplicableMargin(productId, product.categoryId, product.brandId)
    marginPct = applicable.marginPct
    source = applicable.source
  }

  const { saleExVat, saleIncVat, profit } = simulatePrice(
    purchasePrice,
    marginPct,
    vatRate
  )

  return {
    purchasePrice,
    supplierProductId: cheapest.id,
    supplierId: cheapest.supplierId,
    supplierName: cheapest.supplier.name,
    marginPct,
    marginSource: source as PriceCalculation["marginSource"],
    salePriceExVat: saleExVat,
    vatRate,
    salePriceIncVat: saleIncVat,
    profitAmount: profit,
    stockQuantity: totalStock,
    currency: cheapest.currency ?? "TRY",
    originalSalePriceExVat: null,
  }
}

/**
 * Calculate prices for multiple products in bulk.
 */
export async function calculateBulkPrices(
  productIds: string[]
): Promise<Map<string, PriceCalculation>> {
  const results = new Map<string, PriceCalculation>()

  // Batch load products with supplier products
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, deletedAt: null },
    include: {
      supplierProducts: {
        where: {
          deletedAt: null,
          isAvailable: true,
          purchasePrice: { not: null },
        },
        include: { supplier: true },
        orderBy: { purchasePrice: "asc" },
      },
    },
  })

  // Load all relevant margins at once
  const categoryIds = [...new Set(products.map((p) => p.categoryId).filter(Boolean))] as string[]
  const brandIds = [...new Set(products.map((p) => p.brandId).filter(Boolean))] as string[]
  const allScopeIds = [...productIds, ...categoryIds, ...brandIds]
  const now = new Date()

  const allMargins = await prisma.profitMargin.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      OR: [
        { scope: "GLOBAL", scopeId: null },
        {
          scope: { in: ["PRODUCT", "CATEGORY", "BRAND"] },
          scopeId: { in: allScopeIds },
        },
      ],
      AND: [
        { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
        { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
      ],
    },
    orderBy: { priority: "desc" },
  })

  for (const product of products) {
    const totalStock = product.supplierProducts.reduce((sum, sp) => sum + sp.stockQuantity, 0)

    // Fırsat/outlet ürünlerde manualPrice doğrudan satış fiyatıdır.
    // supplierProducts query filter'ı bu ürünleri eleyebilir; bu yüzden sp opsiyonel.
    if ((product as { manualPrice?: unknown }).manualPrice != null) {
      const manualPriceNum = parseFloat(String((product as { manualPrice: unknown }).manualPrice))
      const sp = product.supplierProducts[0]
      const originalSalePriceExVat = computeOriginalPriceFromList(
        sp,
        allMargins,
        product.id,
        product.categoryId,
        product.brandId
      )
      results.set(product.id, {
        purchasePrice: manualPriceNum,
        supplierProductId: sp?.id ?? null,
        supplierId: sp?.supplierId ?? "",
        supplierName: sp?.supplier?.name ?? "",
        marginPct: 0,
        marginSource: "manual",
        salePriceExVat: manualPriceNum,
        vatRate: 20,
        salePriceIncVat: Math.round(manualPriceNum * 1.20 * 100) / 100,
        profitAmount: 0,
        stockQuantity: totalStock,
        currency: (product as { manualPriceCurrency?: string | null }).manualPriceCurrency ?? "USD",
        originalSalePriceExVat,
      })
      continue
    }

    // Stock şartı yok — liste/detay route ile tutarlı.
    if (product.supplierProducts.length === 0) continue

    const cheapest = product.supplierProducts[0]
    const purchasePrice = parseFloat(cheapest.purchasePrice!.toString())
    const vatRate = cheapest.vatRate
      ? parseFloat(cheapest.vatRate.toString())
      : DEFAULT_VAT_RATE

    // Resolve margin from pre-loaded margins
    const { marginPct, source } = resolveMarginFromList(
      allMargins,
      product.id,
      product.categoryId,
      product.brandId
    )

    const { saleExVat, saleIncVat, profit } = simulatePrice(
      purchasePrice,
      marginPct,
      vatRate
    )

    results.set(product.id, {
      purchasePrice,
      supplierProductId: cheapest.id,
      supplierId: cheapest.supplierId,
      supplierName: cheapest.supplier.name,
      marginPct,
      marginSource: source as PriceCalculation["marginSource"],
      salePriceExVat: saleExVat,
      vatRate,
      salePriceIncVat: saleIncVat,
      profitAmount: profit,
      stockQuantity: totalStock,
      currency: (cheapest as { currency?: string | null }).currency ?? "TRY",
      originalSalePriceExVat: null,
    })
  }

  return results
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveMarginFromList(
  margins: ProfitMargin[],
  productId: string,
  categoryId: string | null,
  brandId: string | null
): { marginPct: number; source: string } {
  const scopePriority: Record<string, number> = {
    PRODUCT: 4,
    CATEGORY: 3,
    BRAND: 2,
    GLOBAL: 1,
  }

  let best: { marginPct: number; source: string } | null = null
  let bestScopePriority = -1
  let bestRecordPriority = -1

  for (const m of margins) {
    if (m.scope === "PRODUCT" && m.scopeId !== productId) continue
    if (m.scope === "CATEGORY" && m.scopeId !== categoryId) continue
    if (m.scope === "BRAND" && m.scopeId !== brandId) continue

    const sp = scopePriority[m.scope] ?? 0
    const rp = m.priority

    if (
      sp > bestScopePriority ||
      (sp === bestScopePriority && rp > bestRecordPriority)
    ) {
      bestScopePriority = sp
      bestRecordPriority = rp
      best = {
        marginPct: parseFloat(m.marginPct.toString()),
        source: m.scope.toLowerCase(),
      }
    }
  }

  return best ?? { marginPct: DEFAULT_MARGIN_PCT, source: "global" }
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000
}

/**
 * manualPrice uygulanmadan önceki "normal" satış fiyatı (outlet için üzeri çizili).
 * Liste route'taki originalPrice hesabıyla birebir aynı: supplier.marginRate ?? ProfitMargin.
 */
async function computeOriginalPrice(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sp: any,
  productId: string,
  categoryId: string | null,
  brandId: string | null
): Promise<number | null> {
  if (sp?.purchasePrice == null) return null
  const pp = parseFloat(sp.purchasePrice.toString())
  if (!Number.isFinite(pp)) return null
  const supplierRate =
    sp.supplier?.marginRate != null ? Number(sp.supplier.marginRate) : null
  const rate =
    supplierRate ?? (await getApplicableMargin(productId, categoryId, brandId)).marginPct
  return Math.round(pp * (1 + rate / 100) * 100) / 100
}

/**
 * computeOriginalPrice'ın bulk versiyonu — pre-loaded margins listesinden.
 */
function computeOriginalPriceFromList(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sp: any,
  margins: any[],
  productId: string,
  categoryId: string | null,
  brandId: string | null
): number | null {
  if (sp?.purchasePrice == null) return null
  const pp = parseFloat(sp.purchasePrice.toString())
  if (!Number.isFinite(pp)) return null
  const supplierRate =
    sp.supplier?.marginRate != null ? Number(sp.supplier.marginRate) : null
  const rate =
    supplierRate ?? resolveMarginFromList(margins, productId, categoryId, brandId).marginPct
  return Math.round(pp * (1 + rate / 100) * 100) / 100
}
