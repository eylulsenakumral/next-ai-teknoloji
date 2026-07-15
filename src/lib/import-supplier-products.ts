/**
 * Supplier Product Import Utility
 *
 * Tedarikçilerden (IndexGrup, Netex, Tesan) çekilen ürünleri SupplierProduct
 * tablosuna upsert eder. Batch halinde çalışır, kısmi hata durumunda başarılı
 * kayıtlar korunur.
 */

import { ScraperType, SupplierSyncStatus, Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import type { CategoryMappingsFile } from "@/lib/category-mapping"
import { findMapping } from "@/lib/category-mapping"

// ============================================================================
// Types
// ============================================================================

export interface SupplierProductInput {
  /** Tedarikçi tarafındaki ürün kodu (XML'deki KOD alanı) */
  externalCode: string
  name: string
  brand?: string
  /** Tedarikçi kategori adı — category-mapping üzerinden eşleştirilir */
  categoryName?: string
  price?: number
  vatRate?: number
  stock?: number
  imageUrl?: string
  specifications?: Record<string, string>
  rawData?: unknown
}

export interface ImportResult {
  total: number
  created: number
  updated: number
  errors: { code: string; error: string }[]
}

const BATCH_SIZE = 50
const LOG_INTERVAL = 100

// ============================================================================
// upsertSupplier
// ============================================================================

/**
 * Supplier kaydını upsert et ve id'yi döndür.
 */
export async function upsertSupplier(data: {
  code: string
  name: string
  scraperType?: ScraperType
}): Promise<string> {
  const supplier = await prisma.supplier.upsert({
    where: { code: data.code },
    create: {
      code: data.code,
      name: data.name,
      scraperType: data.scraperType ?? ScraperType.API,
      isActive: true,
      syncIntervalMinutes: 360,
      syncStatus: SupplierSyncStatus.IDLE,
    },
    update: {
      name: data.name,
      scraperType: data.scraperType ?? ScraperType.API,
    },
    select: { id: true },
  })

  return supplier.id
}

// ============================================================================
// upsertBrand (internal helper)
// ============================================================================

async function upsertBrand(name: string): Promise<string | null> {
  if (!name?.trim()) return null

  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  if (!slug) return null

  try {
    const brand = await prisma.brand.upsert({
      where: { slug },
      create: { name: name.trim(), slug },
      update: { name: name.trim() },
      select: { id: true },
    })
    return brand.id
  } catch {
    return null
  }
}

// ============================================================================
// importProducts
// ============================================================================

/**
 * Ürünleri SupplierProduct tablosuna upsert et.
 *
 * - supplierId: upsertSupplier tarafından döndürülen UUID
 * - supplierCode: category-mapping lookup için (örn. "b2bdepo")
 * - products: transform edilmiş ürün listesi
 * - categoryMappings: loadMappings() sonucu (opsiyonel — yoksa category eşleşmesi yapılmaz)
 */
export async function importProducts(params: {
  supplierId: string
  supplierCode: string
  products: SupplierProductInput[]
  categoryMappings?: CategoryMappingsFile
}): Promise<ImportResult> {
  const { supplierId, supplierCode, products, categoryMappings } = params

  console.log(`[import] ${products.length} urun isleniyor (supplier: ${supplierCode})`)

  const result: ImportResult = {
    total: products.length,
    created: 0,
    updated: 0,
    errors: [],
  }

  // Chunk'lara böl
  for (let chunkStart = 0; chunkStart < products.length; chunkStart += BATCH_SIZE) {
    const chunk = products.slice(chunkStart, chunkStart + BATCH_SIZE)

    for (let i = 0; i < chunk.length; i++) {
      const product = chunk[i]
      const globalIndex = chunkStart + i

      // Progress log
      if (globalIndex > 0 && (globalIndex + 1) % LOG_INTERVAL === 0) {
        console.log(
          `[import] ${globalIndex + 1}/${products.length} islendi` +
            ` (yeni: ${result.created}, guncellenen: ${result.updated}, hata: ${result.errors.length})`
        )
      }

      if (!product.externalCode) {
        result.errors.push({ code: "(bos)", error: "externalCode bos" })
        continue
      }

      try {
        // Brand upsert — ileride Product eşleşmesinde kullanılmak üzere Brand tablosuna eklenir
        if (product.brand) {
          await upsertBrand(product.brand)
        }

        // Category mapping lookupu — eşleşen categoryId bulunursa rawData'ya eklenir
        let mappedCategoryId: string | null = null
        if (product.categoryName && categoryMappings) {
          const mapping = findMapping(supplierCode, product.categoryName)
          if (mapping?.categoryId) {
            mappedCategoryId = mapping.categoryId
          }
        }

        const now = new Date()

        // Ham veriyi rawData'ya göm — mappedCategoryId ve brand bilgisi de dahil
        const enrichedRawData =
          product.rawData != null || product.specifications != null || mappedCategoryId != null
            ? {
                ...(typeof product.rawData === "object" && product.rawData != null
                  ? (product.rawData as Record<string, unknown>)
                  : {}),
                ...(product.specifications ?? {}),
                ...(mappedCategoryId ? { _mappedCategoryId: mappedCategoryId } : {}),
                ...(product.brand ? { _brand: product.brand } : {}),
                ...(product.categoryName ? { _supplierCategory: product.categoryName } : {}),
              }
            : null

        const upsertData: Prisma.SupplierProductUpdateInput = {
          externalName: product.name,
          externalUrl: product.imageUrl ?? null,
          purchasePrice:
            product.price != null ? new Prisma.Decimal(product.price) : null,
          vatRate:
            product.vatRate != null ? new Prisma.Decimal(product.vatRate) : null,
          currency: "USD",
          stockQuantity: product.stock ?? 0,
          isAvailable: (product.stock ?? 0) > 0,
          rawData: enrichedRawData != null
            ? (enrichedRawData as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          lastScrapedAt: now,
        }

        const existing = await prisma.supplierProduct.findUnique({
          where: {
            supplierId_externalId: {
              supplierId,
              externalId: product.externalCode,
            },
          },
          select: { id: true, purchasePrice: true },
        })

        if (existing) {
          // Fiyat değişikliği varsa PriceHistory kaydı oluştur
          const oldPriceDecimal = existing.purchasePrice
          const newPriceNumber = product.price ?? null

          await prisma.$transaction(async (tx) => {
            await tx.supplierProduct.update({
              where: { id: existing.id },
              data: upsertData,
            })

            if (
              newPriceNumber != null &&
              oldPriceDecimal != null &&
              Number(oldPriceDecimal) !== newPriceNumber
            ) {
              const oldNum = Number(oldPriceDecimal)
              const changePct =
                oldNum !== 0
                  ? Math.round(((newPriceNumber - oldNum) / oldNum) * 10000) / 100
                  : null

              await tx.priceHistory.create({
                data: {
                  supplierProductId: existing.id,
                  oldPrice: oldPriceDecimal,
                  newPrice: new Prisma.Decimal(newPriceNumber),
                  currency: "USD",
                  priceChangePct: changePct != null ? new Prisma.Decimal(changePct) : null,
                },
              })
            }
          })

          result.updated++
        } else {
          await prisma.supplierProduct.create({
            data: {
              supplierId,
              externalId: product.externalCode,
              externalName: product.name,
              externalUrl: product.imageUrl ?? null,
              purchasePrice:
                product.price != null ? new Prisma.Decimal(product.price) : null,
              vatRate:
                product.vatRate != null ? new Prisma.Decimal(product.vatRate) : null,
              currency: "USD",
              stockQuantity: product.stock ?? 0,
              isAvailable: (product.stock ?? 0) > 0,
              rawData: enrichedRawData != null
                ? (enrichedRawData as Prisma.InputJsonValue)
                : Prisma.JsonNull,
              lastScrapedAt: now,
            },
          })
          result.created++
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        result.errors.push({ code: product.externalCode, error: message })
        console.error(`[import] Hata (${product.externalCode}): ${message}`)
      }
    }
  }

  console.log(
    `[import] Tamamlandi — toplam: ${result.total}, yeni: ${result.created},` +
      ` guncellenen: ${result.updated}, hata: ${result.errors.length}`
  )

  return result
}

// ============================================================================
// updateSupplierSyncStatus (yardımcı)
// ============================================================================

/**
 * Sync sonrasında Supplier kaydının lastSyncAt ve syncStatus alanlarını güncelle.
 */
export async function updateSupplierSyncStatus(
  supplierId: string,
  status: SupplierSyncStatus,
  errorMessage?: string
): Promise<void> {
  await prisma.supplier.update({
    where: { id: supplierId },
    data: {
      lastSyncAt: new Date(),
      syncStatus: status,
      syncError: errorMessage ?? null,
    },
  })
}
