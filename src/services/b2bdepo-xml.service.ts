// ============================================================================
// B2BDepo XML Entegrasyon Servisi
// ============================================================================
// ProductList: Tam urun senkronizasyonu (gunde 3, 22:00-07:00)
// PriceStock: Hizli fiyat/stok guncelleme (gunde 5)
// ============================================================================

import { prisma } from "@/lib/db"
import {
  B2BDepoXmlFetcher,
  type B2BDepoProduct,
} from "@/workers/scraper/suppliers/b2bdepo-xml"

// ============================================================================
// Types
// ============================================================================

export interface SyncProductsResult {
  synced: number
  created: number
  updated: number
  errors: number
  durationMs: number
}

export interface SyncPriceStockResult {
  synced: number
  updated: number
  priceChanges: number
  errors: number
  durationMs: number
}

export interface B2BDepoSyncStatus {
  productList: {
    usedToday: number
    maxPerDay: number
    remaining: number
    lastSyncAt: string | null
    isAllowedNow: boolean // 22:00-07:00 arasi mi
  }
  priceStock: {
    usedToday: number
    maxPerDay: number
    remaining: number
    lastSyncAt: string | null
  }
}

// ============================================================================
// Constants
// ============================================================================

const SUPPLIER_CODE = "b2bdepo"
const PRODUCT_LIST_MAX_PER_DAY = 3
const PRICE_STOCK_MAX_PER_DAY = 5
const SETTING_KEY_PRODUCT_LIST = "b2bdepo.xml_product_list_usage"
const SETTING_KEY_PRICE_STOCK = "b2bdepo.xml_price_stock_usage"

// ============================================================================
// Helpers
// ============================================================================

function generateSlug(name: string, suffix?: string): string {
  const base = name
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200)
  return suffix ? `${base}-${suffix}` : base
}

async function uniqueSlug(name: string, table: "product" | "category" | "brand"): Promise<string> {
  let slug = generateSlug(name)
  let attempt = 0
  while (true) {
    let existing: unknown = null
    if (table === "product") {
      existing = await prisma.product.findUnique({ where: { slug } })
    } else if (table === "category") {
      existing = await prisma.category.findUnique({ where: { slug } })
    } else if (table === "brand") {
      existing = await prisma.brand.findUnique({ where: { slug } })
    }
    if (!existing) return slug
    attempt++
    slug = generateSlug(name, String(attempt))
  }
}

/** Turkiye saati ile 22:00-07:00 arasinda mi? */
function isWithinAllowedHours(): boolean {
  const now = new Date()
  // Turkiye UTC+3
  const turkeyHour = (now.getUTCHours() + 3) % 24
  // 22:00-07:00 arasi: saat >= 22 veya saat < 7
  return turkeyHour >= 22 || turkeyHour < 7
}

/** Bugunun tarihini YYYY-MM-DD olarak dondur (Turkiye saati) */
function todayDateKey(): string {
  const now = new Date()
  const turkeyOffset = 3 * 60 * 60 * 1000
  const turkeyNow = new Date(now.getTime() + turkeyOffset)
  return turkeyNow.toISOString().slice(0, 10)
}

// ============================================================================
// Rate limit tracking
// ============================================================================

interface UsageRecord {
  date: string
  count: number
  lastAt: string | null
}

async function getUsage(settingKey: string): Promise<UsageRecord> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: settingKey },
    })
    if (setting?.value) {
      const val = setting.value as Record<string, unknown>
      const dateKey = todayDateKey()
      if (val.date === dateKey) {
        return {
          date: dateKey,
          count: Number(val.count ?? 0),
          lastAt: (val.lastAt as string) ?? null,
        }
      }
    }
  } catch {
    // Setting yoksa sifirdan basla
  }
  return { date: todayDateKey(), count: 0, lastAt: null }
}

async function incrementUsage(settingKey: string): Promise<void> {
  const usage = await getUsage(settingKey)
  const newUsage: UsageRecord = {
    date: todayDateKey(),
    count: usage.count + 1,
    lastAt: new Date().toISOString(),
  }

  await prisma.setting.upsert({
    where: { key: settingKey },
    update: {
      value: newUsage as unknown as import("@prisma/client").Prisma.InputJsonValue,
    },
    create: {
      key: settingKey,
      value: newUsage as unknown as import("@prisma/client").Prisma.InputJsonValue,
      group: "SCRAPER",
      description: `B2BDepo XML ${settingKey.includes("product_list") ? "ProductList" : "PriceStock"} gunluk kullanim sayaci`,
    },
  })
}

// ============================================================================
// Supplier kaydini getir
// ============================================================================

async function getB2BDepoSupplierId(): Promise<string> {
  const supplier = await prisma.supplier.upsert({
    where: { code: SUPPLIER_CODE },
    update: {},
    create: {
      code: SUPPLIER_CODE,
      name: "B2BDepo",
      websiteUrl: "https://www.b2bdepo.com",
      scraperType: "API",
      isActive: true,
      priority: 5,
      syncIntervalMinutes: 480,
    },
  })
  return supplier.id
}

// ============================================================================
// Kategori hiyerarsisi olustur/eslestir
// ============================================================================

async function resolveCategory(
  ustKategori?: string,
  altKategori?: string,
  enAltKategori?: string
): Promise<string | undefined> {
  if (!ustKategori) return undefined

  // 1. Ust kategori - SADECE BUL, otomatik oluşturma
  let parent = await prisma.category.findFirst({
    where: { name: { equals: ustKategori, mode: "insensitive" }, parentId: null, deletedAt: null },
  })
  if (!parent) return undefined

  if (!altKategori) return parent.id

  // 2. Alt kategori - SADECE BUL, otomatik oluşturma
  let mid = await prisma.category.findFirst({
    where: { name: { equals: altKategori, mode: "insensitive" }, parentId: parent.id, deletedAt: null },
  })
  if (!mid) return undefined

  if (!enAltKategori) return mid.id

  // 3. En alt kategori - SADECE BUL, otomatik oluşturma
  let leaf = await prisma.category.findFirst({
    where: { name: { equals: enAltKategori, mode: "insensitive" }, parentId: mid.id, deletedAt: null },
  })
  if (!leaf) return undefined

  return leaf.id
}

// ============================================================================
// Marka eslestir
// ============================================================================

async function resolveBrand(markaAdi?: string): Promise<string | undefined> {
  if (!markaAdi) return undefined

  let brand = await prisma.brand.findFirst({
    where: { name: { equals: markaAdi, mode: "insensitive" }, deletedAt: null },
  })

  if (!brand) {
    const slug = await uniqueSlug(markaAdi, "brand")
    brand = await prisma.brand.create({
      data: {
        name: markaAdi,
        slug,
        isActive: true,
      },
    })
  }

  return brand.id
}

// ============================================================================
// syncProducts - Tam urun senkronizasyonu (ProductList XML)
// ============================================================================

export async function syncProducts(): Promise<SyncProductsResult> {
  const startTime = Date.now()
  const result: SyncProductsResult = { synced: 0, created: 0, updated: 0, errors: 0, durationMs: 0 }

  // Rate limit kontrolu
  if (!isWithinAllowedHours()) {
    throw new Error("ProductList sadece 22:00-07:00 (TR saati) arasinda cekilebilir")
  }

  const usage = await getUsage(SETTING_KEY_PRODUCT_LIST)
  if (usage.count >= PRODUCT_LIST_MAX_PER_DAY) {
    throw new Error(`ProductList gunluk limit asildi (${usage.count}/${PRODUCT_LIST_MAX_PER_DAY})`)
  }

  const supplierId = await getB2BDepoSupplierId()

  // Supplier'i RUNNING olarak isaretle
  await prisma.supplier.update({
    where: { code: SUPPLIER_CODE },
    data: { syncStatus: "RUNNING", syncError: null },
  })

  // Log olustur
  const log = await prisma.scraperLog.create({
    data: {
      supplierId,
      status: "RUNNING",
      startedAt: new Date(),
    },
  })

  try {
    // XML cek
    const fetcher = new B2BDepoXmlFetcher()
    const xmlResult = await fetcher.fetchProductList()

    // Kullanimi kaydet
    await incrementUsage(SETTING_KEY_PRODUCT_LIST)

    // Mevcut supplier product'lari haritala
    const existing = await prisma.supplierProduct.findMany({
      where: { supplierId, deletedAt: null },
      select: { id: true, externalId: true, purchasePrice: true },
    })
    const existingMap = new Map<string, { id: string; purchasePrice: number | null }>()
    for (const e of existing) {
      if (e.externalId) {
        existingMap.set(e.externalId, {
          id: e.id,
          purchasePrice: e.purchasePrice ? Number(e.purchasePrice) : null,
        })
      }
    }

    // Her urunu isle
    for (const item of xmlResult.products) {
      try {
        await processProduct(item, supplierId, existingMap, result)
        result.synced++
      } catch {
        result.errors++
      }
    }

    // Scraper log guncelle
    result.durationMs = Date.now() - startTime
    await prisma.scraperLog.update({
      where: { id: log.id },
      data: {
        status: result.errors === 0 ? "SUCCESS" : result.synced > 0 ? "PARTIAL" : "ERROR",
        finishedAt: new Date(),
        productsFound: xmlResult.products.length,
        productsNew: result.created,
        productsUpdated: result.updated,
        errorsCount: result.errors,
        durationMs: result.durationMs,
      },
    })

    // Supplier guncelle
    await prisma.supplier.update({
      where: { code: SUPPLIER_CODE },
      data: {
        syncStatus: result.errors === 0 ? "SUCCESS" : result.synced > 0 ? "PARTIAL" : "ERROR",
        syncError: null,
        lastSyncAt: new Date(),
      },
    })

    console.log(
      `[B2BDepo XML] syncProducts tamamlandi: ${result.synced} synced, ${result.created} yeni, ${result.updated} guncellenen, ${result.errors} hata`
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    result.durationMs = Date.now() - startTime

    await prisma.scraperLog.update({
      where: { id: log.id },
      data: {
        status: "ERROR",
        finishedAt: new Date(),
        errorMessage: message,
        durationMs: result.durationMs,
      },
    })

    await prisma.supplier.update({
      where: { code: SUPPLIER_CODE },
      data: { syncStatus: "ERROR", syncError: message },
    })

    throw err
  }

  return result
}

// ============================================================================
// Tek urun isleme (syncProducts icinde)
// ============================================================================

async function processProduct(
  item: B2BDepoProduct,
  supplierId: string,
  existingMap: Map<string, { id: string; purchasePrice: number | null }>,
  result: SyncProductsResult
): Promise<void> {
  const extId = item.urunKodu
  const currency = "USD"

  // Kategori ve marka coz
  const categoryId = await resolveCategory(
    item.ustKategoriAdi,
    item.altKategoriAdi,
    item.enAltKategoriAdi
  )
  const brandId = await resolveBrand(item.marka)

  // Urunu barkod veya metadata ile bul
  let product = null
  if (item.ean) {
    product = await prisma.product.findFirst({
      where: { barcode: item.ean, deletedAt: null },
    })
  }
  if (!product) {
    product = await prisma.product.findFirst({
      where: {
        deletedAt: null,
        metadata: { path: ["b2bdepo_id"], equals: extId },
      },
    })
  }

  if (!product) {
    // Yeni urun olustur
    const slug = await uniqueSlug(item.urunAdi, "product")
    product = await prisma.product.create({
      data: {
        name: item.urunAdi,
        slug,
        barcode: item.ean ?? undefined,
        brandId,
        categoryId,
        images: item.resimler ?? [],
        isActive: true,
        unit: "ADET",
        metadata: { b2bdepo_id: extId },
      },
    })
    result.created++
  } else {
    // Mevcut urunu guncelle
    const existingMeta =
      product.metadata && typeof product.metadata === "object" && !Array.isArray(product.metadata)
        ? (product.metadata as Record<string, unknown>)
        : {}

    await prisma.product.update({
      where: { id: product.id },
      data: {
        name: item.urunAdi,
        barcode: item.ean ?? product.barcode,
        brandId: brandId ?? product.brandId ?? undefined,
        categoryId: categoryId ?? product.categoryId ?? undefined,
        images: item.resimler && item.resimler.length > 0 ? item.resimler : product.images,
        metadata: {
          ...existingMeta,
          b2bdepo_id: extId,
        } as import("@prisma/client").Prisma.InputJsonValue,
      },
    })
    result.updated++
  }

  // SupplierProduct upsert
  const prev = existingMap.get(extId)
  const matchMethod = item.ean ? ("BARCODE" as const) : ("SKU" as const)
  const matchConfidence = item.ean ? 100 : 80

  const supplierProductData = {
    productId: product.id,
    externalName: item.urunAdi,
    externalBarcode: item.ean ?? null,
    purchasePrice: item.ozelFiyat,
    vatRate: item.kdv,
    currency,
    stockQuantity: item.stok,
    isAvailable: item.stok > 0,
    lastScrapedAt: new Date(),
    rawData: item as unknown as import("@prisma/client").Prisma.InputJsonValue,
    matchMethod,
    matchConfidence,
  }

  if (prev) {
    await prisma.supplierProduct.update({
      where: { id: prev.id },
      data: supplierProductData,
    })

    // Fiyat degisikligi kontrolu
    if (
      prev.purchasePrice !== null &&
      item.ozelFiyat !== prev.purchasePrice
    ) {
      const pct =
        prev.purchasePrice !== 0
          ? Number((((item.ozelFiyat - prev.purchasePrice) / prev.purchasePrice) * 100).toFixed(2))
          : null

      await prisma.priceHistory.create({
        data: {
          supplierProductId: prev.id,
          oldPrice: prev.purchasePrice,
          newPrice: item.ozelFiyat,
          currency,
          priceChangePct: pct,
        },
      })
    }
  } else {
    const sp = await prisma.supplierProduct.create({
      data: {
        supplierId,
        externalId: extId,
        ...supplierProductData,
      },
    })
    existingMap.set(extId, { id: sp.id, purchasePrice: item.ozelFiyat })
  }
}

// ============================================================================
// syncPriceStock - Hizli fiyat/stok guncelleme (PriceStock XML)
// ============================================================================

export async function syncPriceStock(): Promise<SyncPriceStockResult> {
  const startTime = Date.now()
  const result: SyncPriceStockResult = { synced: 0, updated: 0, priceChanges: 0, errors: 0, durationMs: 0 }

  // Rate limit kontrolu
  const usage = await getUsage(SETTING_KEY_PRICE_STOCK)
  if (usage.count >= PRICE_STOCK_MAX_PER_DAY) {
    throw new Error(`PriceStock gunluk limit asildi (${usage.count}/${PRICE_STOCK_MAX_PER_DAY})`)
  }

  const supplierId = await getB2BDepoSupplierId()

  try {
    // XML cek
    const fetcher = new B2BDepoXmlFetcher()
    const xmlResult = await fetcher.fetchPriceStock()

    // Kullanimi kaydet
    await incrementUsage(SETTING_KEY_PRICE_STOCK)

    // Mevcut supplier product'lari haritala
    const existing = await prisma.supplierProduct.findMany({
      where: { supplierId, deletedAt: null },
      select: { id: true, externalId: true, purchasePrice: true },
    })
    const existingMap = new Map<string, { id: string; purchasePrice: number | null }>()
    for (const e of existing) {
      if (e.externalId) {
        existingMap.set(e.externalId, {
          id: e.id,
          purchasePrice: e.purchasePrice ? Number(e.purchasePrice) : null,
        })
      }
    }

    // Her urunu isle
    for (const item of xmlResult.items) {
      try {
        const prev = existingMap.get(item.urunKodu)
        if (!prev) {
          // Bilmedigimiz urun, atla (syncProducts ile gelecek)
          continue
        }

        const currency = "USD"

        await prisma.supplierProduct.update({
          where: { id: prev.id },
          data: {
            purchasePrice: item.ozelFiyat,
            vatRate: item.kdv,
            currency,
            stockQuantity: item.stok,
            isAvailable: item.stok > 0,
            lastScrapedAt: new Date(),
          },
        })

        // Fiyat degisikligi kontrolu
        if (
          prev.purchasePrice !== null &&
          item.ozelFiyat !== prev.purchasePrice
        ) {
          const pct =
            prev.purchasePrice !== 0
              ? Number((((item.ozelFiyat - prev.purchasePrice) / prev.purchasePrice) * 100).toFixed(2))
              : null

          await prisma.priceHistory.create({
            data: {
              supplierProductId: prev.id,
              oldPrice: prev.purchasePrice,
              newPrice: item.ozelFiyat,
              currency,
              priceChangePct: pct,
            },
          })
          result.priceChanges++
        }

        result.updated++
        result.synced++
      } catch {
        result.errors++
      }
    }

    result.durationMs = Date.now() - startTime

    // Supplier lastSyncAt guncelle
    await prisma.supplier.update({
      where: { code: SUPPLIER_CODE },
      data: { lastSyncAt: new Date() },
    })

    console.log(
      `[B2BDepo XML] syncPriceStock tamamlandi: ${result.updated} guncellenen, ${result.priceChanges} fiyat degisikligi, ${result.errors} hata`
    )
  } catch (err) {
    result.durationMs = Date.now() - startTime
    throw err
  }

  return result
}

// ============================================================================
// getSyncStatus - Son sync durumu ve kalan cekimler
// ============================================================================

export async function getSyncStatus(): Promise<B2BDepoSyncStatus> {
  const productListUsage = await getUsage(SETTING_KEY_PRODUCT_LIST)
  const priceStockUsage = await getUsage(SETTING_KEY_PRICE_STOCK)

  return {
    productList: {
      usedToday: productListUsage.count,
      maxPerDay: PRODUCT_LIST_MAX_PER_DAY,
      remaining: Math.max(0, PRODUCT_LIST_MAX_PER_DAY - productListUsage.count),
      lastSyncAt: productListUsage.lastAt,
      isAllowedNow: isWithinAllowedHours(),
    },
    priceStock: {
      usedToday: priceStockUsage.count,
      maxPerDay: PRICE_STOCK_MAX_PER_DAY,
      remaining: Math.max(0, PRICE_STOCK_MAX_PER_DAY - priceStockUsage.count),
      lastSyncAt: priceStockUsage.lastAt,
    },
  }
}
