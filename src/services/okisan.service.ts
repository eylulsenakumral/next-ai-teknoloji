// ============================================================================
// Okisan XML Tedarikçi Entegrasyonu
// ============================================================================
// XML URL: https://okisan.com/xml/okisan-urunler.xml
// Root: <store> → <product> dizisi
// ============================================================================

import { prisma } from "@/lib/db"
import { XMLParser } from "fast-xml-parser"

const XML_URL = "https://okisan.com/xml/okisan-urunler.xml"
const OKISAN_VAT_RATE = 20
const OKISAN_CURRENCY = "USD"

// ============================================================================
// Types
// ============================================================================

export interface SyncResult {
  synced: number
  created: number
  updated: number
  skipped: number
  errors: number
}

interface OkisanProduct {
  // XML attribute
  id?: string | number
  // XML elements
  posttitle?: string
  productsku?: string
  markalar?: string
  category?: string
  price?: string | number
  quantity?: string | number
  stockstatus?: string
  featuredimage?: string
  [key: string]: unknown
}

// ============================================================================
// Slug üretici
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

async function uniqueProductSlug(name: string): Promise<string> {
  let slug = generateSlug(name)
  let attempt = 0
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } })
    if (!existing) return slug
    attempt++
    slug = generateSlug(name, String(attempt))
  }
}

// ============================================================================
// Fiyat parse: "6,72" → 6.72
// ============================================================================

function parsePrice(raw: string | number | undefined | null): number | null {
  if (raw === null || raw === undefined || raw === "") return null
  const str = String(raw).trim().replace(",", ".")
  const num = parseFloat(str)
  if (isNaN(num) || num <= 0) return null
  return num
}

// ============================================================================
// Kategori parse: "DAHUA>IP Kamera>Bullet|Diğer>Kameralar" → "Bullet"
// Tam path: "DAHUA > IP Kamera > Bullet"
// ============================================================================

function parseCategoryName(raw: string): { categoryName: string; fullPath: string } | null {
  if (!raw || !raw.trim()) return null

  // İlk pipe öncesini al
  const firstPipe = raw.indexOf("|")
  const firstPart = firstPipe !== -1 ? raw.slice(0, firstPipe) : raw

  // ">" ile böl, son segmenti al
  const segments = firstPart.split(">").map((s) => s.trim()).filter(Boolean)
  if (segments.length === 0) return null

  const categoryName = segments[segments.length - 1]
  const fullPath = segments.join(" > ")

  return { categoryName, fullPath }
}

// ============================================================================
// Okisan supplier'ı getir veya oluştur
// ============================================================================

async function getOrCreateOkisanSupplier(): Promise<string> {
  const supplier = await prisma.supplier.upsert({
    where: { code: "okisan" },
    update: { isActive: true },
    create: {
      code: "okisan",
      name: "Okisan Güvenlik Teknolojileri",
      websiteUrl: "https://okisan.com",
      scraperType: "API",
      isActive: true,
      priority: 10,
      syncIntervalMinutes: 360,
    },
  })
  return supplier.id
}

// ============================================================================
// syncOkisanProducts
// ============================================================================

export async function syncOkisanProducts(): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, created: 0, updated: 0, skipped: 0, errors: 0 }

  const supplierId = await getOrCreateOkisanSupplier()

  // XML fetch
  console.log(`[Okisan] XML indiriliyor: ${XML_URL}`)
  let xmlText: string
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)
    const res = await fetch(XML_URL, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    xmlText = await res.text()
  } catch (err) {
    throw new Error(`Okisan XML indirilemedi: ${err instanceof Error ? err.message : String(err)}`)
  }

  // XML parse
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parserOptions: any = {
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name: string) => name === "product",
    // Okisan XML has many entity references — raise limits significantly
    processEntities: {
      enabled: true,
      maxTotalExpansions: 10000000,
      maxExpandedLength: 100000000,
      maxEntityCount: 1000000,
    },
  }
  const parser = new XMLParser(parserOptions)

  let parsed: unknown
  try {
    parsed = parser.parse(xmlText)
  } catch (err) {
    throw new Error(`XML parse hatası: ${err instanceof Error ? err.message : String(err)}`)
  }

  const store = (parsed as { store?: { product?: OkisanProduct[] } }).store
  const products: OkisanProduct[] = store?.product ?? []

  if (products.length === 0) {
    console.log("[Okisan] Hiç ürün bulunamadı.")
    return result
  }

  console.log(`[Okisan] ${products.length} ürün işlenecek.`)

  for (let i = 0; i < products.length; i++) {
    const item = products[i]
    const index = i + 1

    try {
      const externalId = String(item["@_id"] ?? item.id ?? "").trim()
      const name = String(item.posttitle ?? "").trim()
      const sku = String(item.productsku ?? "").trim() || null
      const brandName = String(item.markalar ?? "").trim() || null
      const categoryRaw = String(item.category ?? "").trim()
      const priceRaw = item.price
      const quantityRaw = item.quantity
      const stockStatus = String(item.stockstatus ?? "").trim()
      const featuredImage = String(item.featuredimage ?? "").trim() || null

      if (!name) {
        result.skipped++
        continue
      }

      // Kategorisiz ürünleri atla
      if (!categoryRaw) {
        result.skipped++
        continue
      }

      const categoryParsed = parseCategoryName(categoryRaw)
      if (!categoryParsed) {
        result.skipped++
        continue
      }

      // Fiyatsız ürünleri atla
      const purchasePrice = parsePrice(priceRaw)
      if (purchasePrice === null) {
        result.skipped++
        continue
      }

      const stockQuantity = Math.max(0, Number(quantityRaw) || 0)
      const isAvailable = stockStatus.toLowerCase() === "in stock"
      const images: string[] = featuredImage ? [featuredImage] : []

      // 1. Brand eşleştir veya oluştur
      let brandId: string | undefined
      if (brandName) {
        let brand = await prisma.brand.findFirst({
          where: { name: { equals: brandName, mode: "insensitive" }, deletedAt: null },
        })
        if (!brand) {
          const brandSlug =
            brandName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "") || `brand-${Date.now()}`
          brand = await prisma.brand.findFirst({ where: { slug: brandSlug, deletedAt: null } })
          if (!brand) {
            try {
              brand = await prisma.brand.create({ data: { name: brandName, slug: brandSlug } })
            } catch {
              brand = await prisma.brand.create({
                data: { name: brandName, slug: `${brandSlug}-${Date.now()}` },
              })
            }
          }
        }
        brandId = brand.id
      }

      // 2. Category eşleştir veya oluştur
      const { categoryName, fullPath } = categoryParsed
      let categoryId: string | undefined

      let cat = await prisma.category.findFirst({
        where: { name: { equals: categoryName, mode: "insensitive" }, deletedAt: null },
      })
      if (!cat) {
        const catSlug =
          categoryName
            .toLowerCase()
            .replace(/ğ/g, "g")
            .replace(/ü/g, "u")
            .replace(/ş/g, "s")
            .replace(/ı/g, "i")
            .replace(/ö/g, "o")
            .replace(/ç/g, "c")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || `cat-${Date.now()}`

        cat = await prisma.category.findFirst({ where: { slug: catSlug, deletedAt: null } })
        if (!cat) {
          try {
            cat = await prisma.category.create({
              data: {
                name: categoryName,
                slug: catSlug,
                depth: 0,
                sortOrder: 0,
                path: fullPath.toLowerCase(),
              },
            })
          } catch {
            cat = await prisma.category.create({
              data: {
                name: categoryName,
                slug: `${catSlug}-${Date.now()}`,
                depth: 0,
                sortOrder: 0,
                path: fullPath.toLowerCase(),
              },
            })
          }
        }
      }
      categoryId = cat.id

      // 3. Ürünü SKU → metadata.okisan_id sırasıyla bul
      let product = null
      if (sku) {
        product = await prisma.product.findFirst({
          where: { sku, deletedAt: null },
        })
      }
      if (!product && externalId) {
        product = await prisma.product.findFirst({
          where: {
            deletedAt: null,
            metadata: { path: ["okisan_id"], equals: externalId },
          },
        })
      }

      if (!product) {
        const slug = await uniqueProductSlug(name)
        product = await prisma.product.create({
          data: {
            name,
            slug,
            sku: sku ?? undefined,
            isActive: false, // Entegrasyondan gelen yeni ürünler varsayılan olarak yayında değil
            unit: "ADET",
            brandId,
            categoryId,
            images,
            metadata: externalId ? { okisan_id: externalId } : undefined,
          },
        })
        result.created++
        console.log(`[${index}/${products.length}] ${name} → ✓ created`)
      } else {
        const existingMeta =
          product.metadata &&
          typeof product.metadata === "object" &&
          !Array.isArray(product.metadata)
            ? (product.metadata as Record<string, unknown>)
            : {}
        await prisma.product.update({
          where: { id: product.id },
          data: {
            name,
            sku: sku ?? product.sku,
            // isActive güncellenmiyor: admin yayına almışsa bozma
            brandId: brandId ?? product.brandId ?? undefined,
            categoryId: categoryId ?? product.categoryId ?? undefined,
            images: images.length > 0 ? images : product.images,
            metadata: {
              ...existingMeta,
              okisan_id: externalId || existingMeta.okisan_id,
            } as import("@prisma/client").Prisma.InputJsonValue,
          },
        })
        result.updated++
        console.log(`[${index}/${products.length}] ${name} → ✓ updated`)
      }

      // 4. SupplierProduct kaydet / güncelle
      const matchMethod = sku ? ("SKU" as const) : ("NAME_SIMILARITY" as const)
      const matchConfidence = sku ? 90 : 50
      const extId = externalId || sku || name

      const supplierProduct = await prisma.supplierProduct.findUnique({
        where: { supplierId_externalId: { supplierId, externalId: extId } },
      })

      const supplierProductData = {
        productId: product.id,
        externalName: name,
        externalSku: sku ?? null,
        purchasePrice: purchasePrice,
        vatRate: OKISAN_VAT_RATE,
        currency: OKISAN_CURRENCY,
        stockQuantity,
        isAvailable,
        lastScrapedAt: new Date(),
        rawData: item as unknown as import("@prisma/client").Prisma.InputJsonValue,
        matchMethod,
        matchConfidence,
      }

      if (!supplierProduct) {
        await prisma.supplierProduct.create({
          data: {
            supplierId,
            externalId: extId,
            ...supplierProductData,
          },
        })
      } else {
        await prisma.supplierProduct.update({
          where: { id: supplierProduct.id },
          data: supplierProductData,
        })
      }

      result.synced++
    } catch (err) {
      result.errors++
      const name = String(item.posttitle ?? item.productsku ?? `#${index}`).slice(0, 60)
      console.error(
        `[${index}/${products.length}] ${name} → ✗ ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  // Supplier lastSyncAt güncelle
  await prisma.supplier.update({
    where: { id: supplierId },
    data: {
      lastSyncAt: new Date(),
      syncStatus:
        result.errors === 0 ? "SUCCESS" : result.synced > 0 ? "PARTIAL" : "ERROR",
    },
  })

  return result
}
