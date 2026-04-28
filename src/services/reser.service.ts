// ============================================================================
// Reser Bayi XML Tedarikçi Entegrasyonu
// ============================================================================
// XML URL: https://www.reserbayi.com/xml/?6406140538d5b04f896983513ee5e934
// Root: <urunler> → <urun> listesi
// ============================================================================

import { prisma } from "@/lib/db"
import { XMLParser } from "fast-xml-parser"

const XML_URL = "https://www.reserbayi.com/xml/?6406140538d5b04f896983513ee5e934"
const RESER_VAT_RATE = 20
const RESER_CURRENCY = "USD"

// ============================================================================
// Reser → DB Kategori Eşleştirme Tablosu
// ============================================================================
// 1. Önce FULL PATH (lowercase) eşleşmesi aranır (en spesifik)
// 2. Sonra son SEGMENT (lowercase) eşleşmesi aranır
// 3. Sonra DB'de isimle arama (case-insensitive)
// 4. Hâlâ yoksa → "diger-urunler" fallback
// Eşleşmeyenler → "Diğer Ürünler" kategorisine düşer (yeni kategori AÇILMAZ)
// ============================================================================

const RESER_FULLPATH_MAP: Record<string, string> = {
  // --- Bilgisayar Parçaları alt kırılımları ---
  "bilgisayar parçaları > anakart > asus": "anakart",
  "bilgisayar parçaları > anakart > msi": "anakart",
  "bilgisayar parçaları > anakart > gigabyte": "anakart",
  "bilgisayar parçaları > anakart > asrock": "anakart",
  "bilgisayar parçaları > anakart": "anakart",
  "bilgisayar parçaları > işlemci > intel": "islemci",
  "bilgisayar parçaları > işlemci > amd": "islemci",
  "bilgisayar parçaları > işlemci": "islemci",
  "bilgisayar parçaları > ram > ddr4": "ram-bellek",
  "bilgisayar parçaları > ram > ddr5": "ram-bellek",
  "bilgisayar parçaları > ram": "ram-bellek",
  "bilgisayar parçaları > ekran kartı > nvidia": "ekran-karti",
  "bilgisayar parçaları > ekran kartı > amd": "ekran-karti",
  "bilgisayar parçaları > ekran kartı": "ekran-karti",
  "bilgisayar parçaları > ssd > nvme": "ssd",
  "bilgisayar parçaları > ssd > sata": "ssd",
  "bilgisayar parçaları > ssd": "ssd",
  "bilgisayar parçaları > hdd": "hdd",
  "bilgisayar parçaları > kasa": "kasa",
  "bilgisayar parçaları > güç kaynağı": "guc-kaynagi",
  "bilgisayar parçaları > soğutucu": "sogutucu",
  // --- Bilgisayar Sistemleri ---
  "laptop": "laptop",
  "notebook": "laptop",
  "tablet": "tablet",
  // --- Çevre Birimleri ---
  "çevre birimleri > monitör": "monitor",
  "çevre birimleri > klavye": "klavye",
  "çevre birimleri > mouse": "mouse",
}

// Son segment bazlı fallback mapping (full path eşleşmezse)
const RESER_SEGMENT_MAP: Record<string, string> = {
  "anakart": "anakart",
  "işlemci": "islemci",
  "ram": "ram-bellek",
  "ekran kartı": "ekran-karti",
  "ssd": "ssd",
  "hdd": "hdd",
  "monitör": "monitor",
  "klavye": "klavye",
  "mouse": "mouse",
  "kasa": "kasa",
  "güç kaynağı": "guc-kaynagi",
  "soğutucu": "sogutucu",
  "laptop": "laptop",
  "notebook": "laptop",
  "tablet": "tablet",
  "bilgisayar parçaları": "bilgisayar-parcalari",
}

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

interface ReserProduct {
  urunid?: string | number
  stokkodu?: string
  gtin?: string
  urunadi?: string
  marka?: string
  kategori?: string
  resimler?: { resim?: string | string[] }
  fiyat?: string | number
  para_birimi?: string
  kdv?: string | number
  stok?: string | number
  ozellikler?: { ozellik?: Array<{ adi?: string; degeri?: string }> | { adi?: string; degeri?: string } }
  detay?: string
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
// Fiyat parse: nokta ondalık ayraç (virgül yok)
// ============================================================================

function parsePrice(raw: string | number | undefined | null): number | null {
  if (raw === null || raw === undefined || raw === "") return null
  const str = String(raw).trim().replace(",", ".")
  const num = parseFloat(str)
  if (isNaN(num) || num <= 0) return null
  return num
}

// ============================================================================
// Kategori parse: "BİLGİSAYAR PARÇALARI > Anakart > ASUS" → [{categoryName, fullPath}]
// Separator: " > " veya ">"
// ============================================================================

function parseCategoryPath(raw: string): Array<{ categoryName: string; fullPath: string }> {
  if (!raw || !raw.trim()) return []

  // XML decode: &gt; → >
  const decoded = raw.replace(/&gt;/g, ">")

  // Tek path (pipe yok), ">" ile böl
  const segments = decoded.split(">").map((s) => s.trim()).filter(Boolean)
  if (segments.length === 0) return []

  const paths: Array<{ categoryName: string; fullPath: string }> = []

  // Her prefix'i ayrı bir path olarak ekle (en spesifikten genele)
  for (let i = segments.length; i >= 1; i--) {
    const slice = segments.slice(0, i)
    paths.push({
      categoryName: slice[slice.length - 1],
      fullPath: slice.join(" > ").toLowerCase(),
    })
  }

  return paths
}

// ============================================================================
// Reser supplier'ı getir veya oluştur
// ============================================================================

async function getOrCreateReserSupplier(): Promise<string> {
  const supplier = await prisma.supplier.upsert({
    where: { code: "reser" },
    update: { isActive: true },
    create: {
      code: "reser",
      name: "Reser Bayi",
      websiteUrl: "https://www.reserbayi.com",
      scraperType: "API",
      isActive: true,
      priority: 10,
      syncIntervalMinutes: 360,
    },
  })
  return supplier.id
}

// ============================================================================
// syncReserProducts
// ============================================================================

export async function syncReserProducts(): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, created: 0, updated: 0, skipped: 0, errors: 0 }

  const supplierId = await getOrCreateReserSupplier()

  // XML fetch
  console.log(`[Reser] XML indiriliyor: ${XML_URL}`)
  let xmlText: string
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)
    const res = await fetch(XML_URL, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NexaDepo/1.0)" },
    })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    xmlText = await res.text()
  } catch (err) {
    throw new Error(`Reser XML indirilemedi: ${err instanceof Error ? err.message : String(err)}`)
  }

  // XML parse
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parserOptions: any = {
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name: string) => name === "urun" || name === "resim" || name === "ozellik",
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

  // Rate-limit / hata yanıtı kontrolü
  const hataMsg = (parsed as { hata?: { mesaj?: string } }).hata?.mesaj
  if (hataMsg) {
    throw new Error(`Reser API hatası: ${hataMsg}`)
  }

  const urunler = (parsed as { urunler?: { urun?: ReserProduct[] } }).urunler
  const products: ReserProduct[] = urunler?.urun ?? []

  if (products.length === 0) {
    console.log("[Reser] Hiç ürün bulunamadı.")
    return result
  }

  console.log(`[Reser] ${products.length} ürün işlenecek.`)

  for (let i = 0; i < products.length; i++) {
    const item = products[i]
    const index = i + 1

    try {
      const externalId = String(item.urunid ?? "").trim()
      const rawSku = String(item.stokkodu ?? "").trim()
      const sku = rawSku ? `r-${rawSku}` : null
      const name = String(item.urunadi ?? "").trim()
      const brandName = String(item.marka ?? "").trim() || null
      const categoryRaw = String(item.kategori ?? "").trim()
      const priceRaw = item.fiyat
      const stockRaw = item.stok

      // Görseller: resimler.resim string veya string[] olabilir
      const resimRaw = item.resimler?.resim
      const images: string[] = resimRaw
        ? Array.isArray(resimRaw)
          ? resimRaw.filter(Boolean)
          : [String(resimRaw)].filter(Boolean)
        : []

      if (!name) {
        result.skipped++
        continue
      }

      if (!categoryRaw) {
        result.skipped++
        continue
      }

      const categoryPaths = parseCategoryPath(categoryRaw)
      if (categoryPaths.length === 0) {
        result.skipped++
        continue
      }

      const purchasePrice = parsePrice(priceRaw)
      if (purchasePrice === null) {
        result.skipped++
        continue
      }

      const stockQuantity = Math.max(0, Number(stockRaw) || 0)
      const isAvailable = stockQuantity > 0

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

      // 2. Category eşleştir (YENİ KATEGORİ AÇILMAZ)
      // 2a. RESER_FULLPATH_MAP
      // 2b. RESER_SEGMENT_MAP
      // 2c. DB'de isimle ara (case-insensitive)
      // 2d. Hiçbiri → "diger-urunler" fallback
      let cat = null

      for (const { categoryName, fullPath } of categoryPaths) {
        const segKey = categoryName.toLowerCase().trim()

        const fullSlug = RESER_FULLPATH_MAP[fullPath]
        if (fullSlug) {
          cat = await prisma.category.findFirst({ where: { slug: fullSlug, deletedAt: null } })
          if (cat) break
        }

        const segSlug = RESER_SEGMENT_MAP[segKey]
        if (segSlug) {
          cat = await prisma.category.findFirst({ where: { slug: segSlug, deletedAt: null } })
          if (cat) break
        }

        cat = await prisma.category.findFirst({
          where: { name: { equals: categoryName, mode: "insensitive" }, deletedAt: null },
        })
        if (cat) break
      }

      if (!cat) {
        cat = await prisma.category.findFirst({
          where: { slug: "diger-urunler", deletedAt: null },
        })
      }

      const categoryId = cat?.id ?? undefined

      // 3. Ürünü SKU → metadata.reser_id sırasıyla bul
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
            metadata: { path: ["reser_id"], equals: externalId },
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
            isActive: false,
            unit: "ADET",
            brandId,
            categoryId,
            images,
            metadata: externalId ? { reser_id: externalId } : undefined,
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
            brandId: brandId ?? product.brandId ?? undefined,
            categoryId: categoryId ?? product.categoryId ?? undefined,
            images: images.length > 0 ? images : product.images,
            metadata: {
              ...existingMeta,
              reser_id: externalId || existingMeta.reser_id,
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

      // Kategori: son segment
      const supplierCategory = categoryPaths[0]?.categoryName ?? undefined

      const supplierProductData = {
        productId: product.id,
        externalName: name,
        externalSku: sku ?? null,
        purchasePrice,
        vatRate: RESER_VAT_RATE,
        currency: RESER_CURRENCY,
        stockQuantity,
        isAvailable,
        lastScrapedAt: new Date(),
        rawData: {
          ...(item as unknown as Record<string, unknown>),
          ...(supplierCategory ? { _supplierCategory: supplierCategory } : {}),
        } as import("@prisma/client").Prisma.InputJsonValue,
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
      const name = String(item.urunadi ?? item.stokkodu ?? `#${index}`).slice(0, 60)
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
