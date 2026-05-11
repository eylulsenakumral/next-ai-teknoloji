/**
 * Supplier Sync Runner
 *
 * Cron handler tarafından çağrılan tedarikçi senkronizasyon motoru.
 * Her tedarikçi için retry (max 3, exponential backoff) ve timeout (5 dk) uygular.
 * Sonuçları ScraperLog tablosuna yazar.
 */

import { SupplierSyncStatus } from "@prisma/client"
import { prisma } from "@/lib/db"
import {
  upsertSupplier,
  importProducts,
  updateSupplierSyncStatus,
} from "@/lib/import-supplier-products"
import { loadMappings } from "@/lib/category-mapping"
import { writeSyncLog } from "@/lib/sync-logger"

// ============================================================================
// Constants
// ============================================================================

const SYNC_TIMEOUT_MS = 5 * 60 * 1000 // 5 dakika
const MAX_RETRIES = 3
const BACKOFF_BASE_MS = 1000 // 1s → 3s → 9s

// ============================================================================
// Types
// ============================================================================

export interface SupplierSyncResult {
  supplierCode: string
  supplierId: string
  status: "SUCCESS" | "PARTIAL" | "ERROR" | "SKIPPED"
  totalProducts: number
  created: number
  updated: number
  errors: number
  durationMs: number
  skippedReason?: string
  errorMessage?: string
  attempts: number
}

// ============================================================================
// sleep helper
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ============================================================================
// runWithTimeout
// ============================================================================

/**
 * Verilen async fonksiyonu belirlenen süre içinde tamamlamazsa reddeder.
 */
async function runWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Sync timeout: ${timeoutMs / 1000} saniye aşıldı`))
    }, timeoutMs)

    fn()
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

// ============================================================================
// Per-supplier sync functions
// ============================================================================

async function syncIndexGrup(supplierId: string): Promise<{
  total: number
  created: number
  updated: number
  errors: number
}> {
  const { IndexGrupXmlClient } = await import(
    "@/workers/scraper/suppliers/indexgrup-xml-v2"
  )
  const { loadMappings: _loadMappings } = await import("@/lib/category-mapping")

  const client = new IndexGrupXmlClient()
  const raw = await client.getAllProducts()

  console.log(`[cron/indexgrup] ${raw.length} ürün çekildi`)

  const categoryMappings = _loadMappings()

  const products = raw.map(
    (p: {
      productCode: string
      productName: string
      brand?: string
      categoryName?: string
      groupName?: string
      price?: number
      tax?: string
      stock?: number
      imageUrl?: string
      specifications?: Record<string, string>
      categoryCode?: string
      groupCode?: string
      companyCode?: string
      globalCode?: string
      imageDetailUrl?: string
      currency?: string
    }) => ({
      externalCode: p.productCode,
      name: p.productName,
      brand: p.brand,
      categoryName:
        p.categoryName && p.groupName
          ? `${p.categoryName} > ${p.groupName}`
          : (p.categoryName ?? undefined),
      price: p.price,
      vatRate: p.tax ? parseFloat(p.tax) : undefined,
      stock: p.stock,
      imageUrl: p.imageUrl,
      specifications: p.specifications,
      rawData: {
        productCode: p.productCode,
        productName: p.productName,
        brand: p.brand,
        categoryCode: p.categoryCode,
        categoryName: p.categoryName,
        groupCode: p.groupCode,
        groupName: p.groupName,
        companyCode: p.companyCode,
        globalCode: p.globalCode,
        imageUrl: p.imageUrl,
        imageDetailUrl: p.imageDetailUrl,
        tax: p.tax,
        price: p.price,
        currency: p.currency,
        stock: p.stock,
      },
    })
  )

  const result = await importProducts({
    supplierId,
    supplierCode: "indexgrup",
    products,
    categoryMappings,
  })

  return {
    total: result.total,
    created: result.created,
    updated: result.updated,
    errors: result.errors.length,
  }
}

async function syncNetex(supplierId: string): Promise<{
  total: number
  created: number
  updated: number
  errors: number
}> {
  const { NetexXmlClient } = await import(
    "@/workers/scraper/suppliers/netex-xml-v2"
  )
  const { loadMappings: _loadMappings } = await import("@/lib/category-mapping")

  const client = new NetexXmlClient()
  const raw = await client.getAllProducts()

  console.log(`[cron/netex] ${raw.length} ürün çekildi`)

  const categoryMappings = _loadMappings()

  const products = raw.map(
    (p: {
      productCode: string
      productName: string
      brand?: string
      categoryName?: string
      groupName?: string
      price?: number
      tax?: string
      stock?: number
      imageUrl?: string
      specifications?: Record<string, string>
      categoryCode?: string
      groupCode?: string
      companyCode?: string
      globalCode?: string
      imageDetailUrl?: string
      currency?: string
    }) => ({
      externalCode: p.productCode,
      name: p.productName,
      brand: p.brand,
      categoryName:
        p.categoryName && p.groupName
          ? `${p.categoryName} > ${p.groupName}`
          : (p.categoryName ?? undefined),
      price: p.price,
      vatRate: p.tax ? parseFloat(p.tax) : undefined,
      stock: p.stock,
      imageUrl: p.imageUrl,
      specifications: p.specifications,
      rawData: {
        productCode: p.productCode,
        productName: p.productName,
        brand: p.brand,
        categoryCode: p.categoryCode,
        categoryName: p.categoryName,
        groupCode: p.groupCode,
        groupName: p.groupName,
        companyCode: p.companyCode,
        globalCode: p.globalCode,
        imageUrl: p.imageUrl,
        imageDetailUrl: p.imageDetailUrl,
        tax: p.tax,
        price: p.price,
        currency: p.currency,
        stock: p.stock,
      },
    })
  )

  const result = await importProducts({
    supplierId,
    supplierCode: "netex",
    products,
    categoryMappings,
  })

  return {
    total: result.total,
    created: result.created,
    updated: result.updated,
    errors: result.errors.length,
  }
}

async function syncTesan(supplierId: string): Promise<{
  total: number
  created: number
  updated: number
  errors: number
}> {
  const { TesanSoapClient } = await import(
    "@/workers/scraper/suppliers/tesan-soap"
  )

  const client = new TesanSoapClient()

  const [categories, products, images, prices, stocks] = await Promise.all([
    client.getProductCategories(),
    client.getProductLists(),
    client.getProductImages(),
    client.getStockPrices(),
    client.getWareHouseStocks(),
  ])

  console.log(
    `[cron/tesan] kategoriler=${categories.length}, ürünler=${products.length},` +
      ` görseller=${images.length}, fiyatlar=${prices.length}, stoklar=${stocks.length}`
  )

  // Build lookup maps
  const imageMap = new Map<number, string>()
  for (const img of images) {
    if (!imageMap.has(img.stockId) && img.image) imageMap.set(img.stockId, img.image)
  }

  const priceMap = new Map<number, { price: number; currency: string }>()
  for (const p of prices) {
    if (!priceMap.has(p.stockId)) priceMap.set(p.stockId, { price: p.price, currency: p.currency })
  }

  const stockMap = new Map<number, number>()
  for (const s of stocks) {
    stockMap.set(s.stockId, (stockMap.get(s.stockId) ?? 0) + s.quantity)
  }

  const categoryMap = new Map<number, (typeof categories)[number]>()
  for (const c of categories) {
    if (!categoryMap.has(c.lowerGroupId)) categoryMap.set(c.lowerGroupId, c)
  }

  const transformedProducts = products.map((p) => {
    const category = categoryMap.get(p.lowerGroupId)
    const priceInfo = priceMap.get(p.stockId)
    const stockQty = stockMap.get(p.stockId) ?? 0
    const imageUrl = imageMap.get(p.stockId)
    const categoryName = category
      ? `${category.mainGroup} > ${category.lowerGroup}`
      : undefined

    return {
      externalCode: p.stockCode || String(p.stockId),
      name: p.product,
      brand: category?.brand,
      categoryName,
      price: priceInfo?.price,
      vatRate: p.tax,
      stock: stockQty,
      imageUrl,
      rawData: {
        stockId: p.stockId,
        stockCode: p.stockCode,
        productCode: p.productCode,
        product: p.product,
        unit: p.unit,
        tax: p.tax,
        lowerGroupId: p.lowerGroupId,
        specialCode: p.specialCode,
        productCatId: p.productCatId,
        productTypeId: p.productTypeId,
        brandId: p.brandId,
        productId: p.productId,
        productStatus: p.productStatus,
        stockStatus: p.stockStatus,
        barcode: p.barcode,
        price: priceInfo?.price,
        currency: priceInfo?.currency,
        imageUrl,
        categoryMainGroup: category?.mainGroup,
        categoryLowerGroup: category?.lowerGroup,
        categoryBrand: category?.brand,
        departman: category?.departman,
      },
    }
  })

  const result = await importProducts({
    supplierId,
    supplierCode: "tesan",
    products: transformedProducts,
  })

  return {
    total: result.total,
    created: result.created,
    updated: result.updated,
    errors: result.errors.length,
  }
}

async function syncReser(_supplierId: string): Promise<{
  total: number
  created: number
  updated: number
  errors: number
}> {
  const { syncReserProducts } = await import("@/services/reser.service")
  const result = await syncReserProducts()
  return {
    total: result.synced,
    created: result.created,
    updated: result.updated,
    errors: result.errors,
  }
}

async function syncB2BDepo(_supplierId: string): Promise<{
  total: number
  created: number
  updated: number
  errors: number
}> {
  const { syncProducts } = await import("@/services/b2bdepo-xml.service")
  const result = await syncProducts()
  return {
    total: result.synced,
    created: result.created,
    updated: result.updated,
    errors: result.errors,
  }
}

async function syncOkisan(_supplierId: string): Promise<{
  total: number
  created: number
  updated: number
  errors: number
}> {
  const { syncOkisanProducts } = await import("@/services/okisan.service")
  const result = await syncOkisanProducts()
  return {
    total: result.synced,
    created: result.created,
    updated: result.updated,
    errors: result.errors,
  }
}

// Supplier code → sync fonksiyonu eşlemesi
const SYNC_RUNNERS: Record<
  string,
  (supplierId: string) => Promise<{ total: number; created: number; updated: number; errors: number }>
> = {
  INDEXGRUP: syncIndexGrup,
  NETEX: syncNetex,
  TESAN: syncTesan,
  reser: syncReser,
  b2bdepo: syncB2BDepo,
  okisan: syncOkisan,
}

// ============================================================================
// runSupplierSync — tek bir tedarikçiyi retry ile çalıştır
// ============================================================================

async function runSupplierSync(supplier: {
  id: string
  code: string
  name: string
}): Promise<SupplierSyncResult> {
  const runner = SYNC_RUNNERS[supplier.code]

  if (!runner) {
    return {
      supplierCode: supplier.code,
      supplierId: supplier.id,
      status: "SKIPPED",
      totalProducts: 0,
      created: 0,
      updated: 0,
      errors: 0,
      durationMs: 0,
      skippedReason: `Tanımlı sync runner yok (code: ${supplier.code})`,
      attempts: 0,
    }
  }

  const startedAt = new Date()
  let lastError: Error | null = null
  let attempts = 0

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    attempts = attempt

    try {
      // İlk denemede RUNNING durumuna al
      if (attempt === 1) {
        await updateSupplierSyncStatus(supplier.id, SupplierSyncStatus.RUNNING)
      }

      console.log(
        `[cron] ${supplier.code} sync başlıyor (deneme ${attempt}/${MAX_RETRIES})`
      )

      const importResult = await runWithTimeout(
        () => runner(supplier.id),
        SYNC_TIMEOUT_MS
      )

      const completedAt = new Date()
      const durationMs = completedAt.getTime() - startedAt.getTime()

      const status =
        importResult.errors === 0 ? SupplierSyncStatus.SUCCESS : SupplierSyncStatus.PARTIAL
      const resultStatus: "SUCCESS" | "PARTIAL" =
        importResult.errors === 0 ? "SUCCESS" : "PARTIAL"

      await updateSupplierSyncStatus(supplier.id, status)

      await writeSyncLog({
        supplierId: supplier.id,
        supplierCode: supplier.code,
        startedAt,
        completedAt,
        status: resultStatus,
        totalProducts: importResult.total,
        created: importResult.created,
        updated: importResult.updated,
        errors: importResult.errors,
      })

      console.log(
        `[cron] ${supplier.code} tamamlandı — toplam: ${importResult.total},` +
          ` yeni: ${importResult.created}, güncellenen: ${importResult.updated},` +
          ` hata: ${importResult.errors}, süre: ${durationMs}ms`
      )

      return {
        supplierCode: supplier.code,
        supplierId: supplier.id,
        status: resultStatus,
        totalProducts: importResult.total,
        created: importResult.created,
        updated: importResult.updated,
        errors: importResult.errors,
        durationMs,
        attempts,
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.error(
        `[cron] ${supplier.code} hata (deneme ${attempt}/${MAX_RETRIES}): ${lastError.message}`
      )

      if (attempt < MAX_RETRIES) {
        const backoffMs = BACKOFF_BASE_MS * Math.pow(3, attempt - 1)
        console.log(`[cron] ${supplier.code} ${backoffMs}ms bekleyip tekrar deneniyor...`)
        await sleep(backoffMs)
      }
    }
  }

  // Tüm denemeler başarısız
  const completedAt = new Date()
  const durationMs = completedAt.getTime() - startedAt.getTime()
  const errorMessage = lastError?.message ?? "Bilinmeyen hata"

  await updateSupplierSyncStatus(
    supplier.id,
    SupplierSyncStatus.ERROR,
    errorMessage
  ).catch(() => {})

  await writeSyncLog({
    supplierId: supplier.id,
    supplierCode: supplier.code,
    startedAt,
    completedAt,
    status: "ERROR",
    totalProducts: 0,
    created: 0,
    updated: 0,
    errors: 1,
    errorDetails: errorMessage,
  })

  return {
    supplierCode: supplier.code,
    supplierId: supplier.id,
    status: "ERROR",
    totalProducts: 0,
    created: 0,
    updated: 0,
    errors: 1,
    durationMs,
    errorMessage,
    attempts,
  }
}

// ============================================================================
// runScheduledSync — cron tarafından çağrılan ana fonksiyon
// ============================================================================

/**
 * Aktif ve sync zamanı gelen tedarikçileri sırayla senkronize eder.
 *
 * - isActive = true olan supplier'ları çeker
 * - Her biri için lastSyncAt + syncIntervalMinutes kontrolü yapar
 * - Sırayla (paralel değil — API rate limit) çalıştırır
 */
export async function runScheduledSync(): Promise<{
  totalSuppliers: number
  synced: number
  skipped: number
  results: SupplierSyncResult[]
}> {
  const now = new Date()

  // Aktif tedarikçileri çek
  const suppliers = await prisma.supplier.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    orderBy: { priority: "desc" },
    select: {
      id: true,
      code: true,
      name: true,
      lastSyncAt: true,
      syncIntervalMinutes: true,
      syncStatus: true,
    },
  })

  const results: SupplierSyncResult[] = []
  let syncedCount = 0
  let skippedCount = 0

  for (const supplier of suppliers) {
    // Sync intervali kontrolü
    const intervalMs = (supplier.syncIntervalMinutes ?? 360) * 60 * 1000
    const nextSyncAt = supplier.lastSyncAt
      ? new Date(supplier.lastSyncAt.getTime() + intervalMs)
      : new Date(0) // hiç sync yapılmamışsa hemen çalıştır

    if (now < nextSyncAt) {
      const remainingMin = Math.ceil((nextSyncAt.getTime() - now.getTime()) / 60000)
      console.log(
        `[cron] ${supplier.code} atlandı — bir sonraki sync ${remainingMin} dakika sonra`
      )

      results.push({
        supplierCode: supplier.code,
        supplierId: supplier.id,
        status: "SKIPPED",
        totalProducts: 0,
        created: 0,
        updated: 0,
        errors: 0,
        durationMs: 0,
        skippedReason: `Interval henüz dolmadı (${remainingMin} dk kaldı)`,
        attempts: 0,
      })
      skippedCount++
      continue
    }

    // Halihazırda çalışıyorsa atla
    if (supplier.syncStatus === SupplierSyncStatus.RUNNING) {
      console.log(`[cron] ${supplier.code} atlandı — zaten RUNNING durumunda`)

      results.push({
        supplierCode: supplier.code,
        supplierId: supplier.id,
        status: "SKIPPED",
        totalProducts: 0,
        created: 0,
        updated: 0,
        errors: 0,
        durationMs: 0,
        skippedReason: "Zaten RUNNING durumunda",
        attempts: 0,
      })
      skippedCount++
      continue
    }

    const result = await runSupplierSync({
      id: supplier.id,
      code: supplier.code,
      name: supplier.name,
    })

    results.push(result)

    if (result.status !== "SKIPPED") {
      syncedCount++
    } else {
      skippedCount++
    }
  }

  return {
    totalSuppliers: suppliers.length,
    synced: syncedCount,
    skipped: skippedCount,
    results,
  }
}
