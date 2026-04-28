/**
 * sync-reser-neon.ts
 *
 * Standalone Reser XML → Neon PostgreSQL sync script.
 * Uses @neondatabase/serverless HTTP transport — no TCP port 5433 required.
 * Does NOT import anything from src/ — self-contained.
 *
 * Run: npx tsx scripts/sync-reser-neon.ts
 */

import "dotenv/config"
import { neon } from "@neondatabase/serverless"
import { XMLParser } from "fast-xml-parser"

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const XML_URL = "https://www.reserbayi.com/xml/?6406140538d5b04f896983513ee5e934"
const RESER_VAT_RATE = 20
const RESER_CURRENCY = "USD"
const FETCH_TIMEOUT_MS = 60_000

// ---------------------------------------------------------------------------
// Neon SQL client (tagged-template, HTTP transport)
// ---------------------------------------------------------------------------

const sql = neon(process.env.DATABASE_URL!)

// ---------------------------------------------------------------------------
// Category slug maps (mirrored from reser.service.ts)
// ---------------------------------------------------------------------------

const RESER_FULLPATH_MAP: Record<string, string> = {
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
  "laptop": "laptop",
  "notebook": "laptop",
  "tablet": "tablet",
  "çevre birimleri > monitör": "monitor",
  "çevre birimleri > klavye": "klavye",
  "çevre birimleri > mouse": "mouse",
}

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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  ozellikler?: {
    ozellik?:
      | Array<{ adi?: string; degeri?: string }>
      | { adi?: string; degeri?: string }
  }
  detay?: string
  [key: string]: unknown
}

interface SyncResult {
  synced: number
  created: number
  updated: number
  skipped: number
  errors: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function parsePrice(raw: string | number | undefined | null): number | null {
  if (raw === null || raw === undefined || raw === "") return null
  const str = String(raw).trim().replace(",", ".")
  const num = parseFloat(str)
  if (isNaN(num) || num <= 0) return null
  return num
}

function parseCategoryPath(
  raw: string
): Array<{ categoryName: string; fullPath: string }> {
  if (!raw?.trim()) return []
  const decoded = raw.replace(/&gt;/g, ">")
  const segments = decoded
    .split(">")
    .map((s) => s.trim())
    .filter(Boolean)
  if (segments.length === 0) return []

  const paths: Array<{ categoryName: string; fullPath: string }> = []
  for (let i = segments.length; i >= 1; i--) {
    const slice = segments.slice(0, i)
    paths.push({
      categoryName: slice[slice.length - 1],
      fullPath: slice.join(" > ").toLowerCase(),
    })
  }
  return paths
}

// ---------------------------------------------------------------------------
// DB helpers (all use tagged-template sql to prevent injection)
// ---------------------------------------------------------------------------

async function getOrCreateSupplier(): Promise<string> {
  // Upsert supplier row — ON CONFLICT on unique(code)
  const rows = await sql`
    INSERT INTO suppliers (
      id, code, name, website_url, scraper_type,
      is_active, priority, sync_interval_minutes,
      created_at, updated_at
    )
    VALUES (
      gen_random_uuid(), ${"reser"}, ${"Reser Bayi"},
      ${"https://www.reserbayi.com"}, ${"API"},
      ${true}, ${10}, ${360},
      NOW(), NOW()
    )
    ON CONFLICT (code) DO UPDATE
      SET is_active = true,
          updated_at = NOW()
    RETURNING id
  `
  return rows[0].id as string
}

async function findBrandByName(name: string): Promise<string | null> {
  const rows = await sql`
    SELECT id FROM brands
    WHERE LOWER(name) = LOWER(${name})
      AND deleted_at IS NULL
    LIMIT 1
  `
  return rows[0]?.id ?? null
}

async function findBrandBySlug(slug: string): Promise<string | null> {
  const rows = await sql`
    SELECT id FROM brands
    WHERE slug = ${slug}
      AND deleted_at IS NULL
    LIMIT 1
  `
  return rows[0]?.id ?? null
}

async function createBrand(name: string, slug: string): Promise<string> {
  const rows = await sql`
    INSERT INTO brands (id, name, slug, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), ${name}, ${slug}, ${true}, ${0}, NOW(), NOW())
    RETURNING id
  `
  return rows[0].id as string
}

async function findCategoryBySlug(slug: string): Promise<string | null> {
  const rows = await sql`
    SELECT id FROM categories
    WHERE slug = ${slug}
      AND deleted_at IS NULL
    LIMIT 1
  `
  return rows[0]?.id ?? null
}

async function findCategoryByName(name: string): Promise<string | null> {
  const rows = await sql`
    SELECT id FROM categories
    WHERE LOWER(name) = LOWER(${name})
      AND deleted_at IS NULL
    LIMIT 1
  `
  return rows[0]?.id ?? null
}

async function findProductBySku(sku: string): Promise<{ id: string; sku: string | null; brand_id: string | null; category_id: string | null; images: string[]; metadata: unknown } | null> {
  const rows = await sql`
    SELECT id, sku, brand_id, category_id, images, metadata
    FROM products
    WHERE sku = ${sku}
      AND deleted_at IS NULL
    LIMIT 1
  `
  return (rows[0] as { id: string; sku: string | null; brand_id: string | null; category_id: string | null; images: string[]; metadata: unknown } | undefined) ?? null
}

async function findProductByReserId(reserId: string): Promise<{ id: string; sku: string | null; brand_id: string | null; category_id: string | null; images: string[]; metadata: unknown } | null> {
  const rows = await sql`
    SELECT id, sku, brand_id, category_id, images, metadata
    FROM products
    WHERE metadata->>'reser_id' = ${reserId}
      AND deleted_at IS NULL
    LIMIT 1
  `
  return (rows[0] as { id: string; sku: string | null; brand_id: string | null; category_id: string | null; images: string[]; metadata: unknown } | undefined) ?? null
}

async function slugExistsInProducts(slug: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM products WHERE slug = ${slug} LIMIT 1
  `
  return rows.length > 0
}

async function uniqueProductSlug(name: string): Promise<string> {
  let slug = generateSlug(name)
  if (!(await slugExistsInProducts(slug))) return slug
  let attempt = 1
  while (true) {
    const candidate = generateSlug(name, String(attempt))
    if (!(await slugExistsInProducts(candidate))) return candidate
    attempt++
  }
}

async function createProduct(data: {
  name: string
  slug: string
  sku: string | null
  brandId: string | null
  categoryId: string | null
  images: string[]
  metadata: Record<string, unknown> | null
}): Promise<string> {
  const rows = await sql`
    INSERT INTO products (
      id, name, slug, sku, brand_id, category_id,
      images, metadata, is_active, is_featured, is_new, is_outlet,
      min_order_quantity, unit, view_count,
      created_at, updated_at
    )
    VALUES (
      gen_random_uuid(),
      ${data.name},
      ${data.slug},
      ${data.sku},
      ${data.brandId},
      ${data.categoryId},
      ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(data.images)}::jsonb)),
      ${data.metadata ? JSON.stringify(data.metadata) : null}::jsonb,
      ${false},
      ${false},
      ${false},
      ${false},
      ${1},
      ${"ADET"},
      ${0},
      NOW(),
      NOW()
    )
    RETURNING id
  `
  return rows[0].id as string
}

async function updateProduct(data: {
  id: string
  name: string
  sku: string | null
  brandId: string | null
  categoryId: string | null
  images: string[]
  metadata: Record<string, unknown>
}): Promise<void> {
  await sql`
    UPDATE products SET
      name        = ${data.name},
      sku         = COALESCE(${data.sku}, sku),
      brand_id    = COALESCE(${data.brandId}, brand_id),
      category_id = COALESCE(${data.categoryId}, category_id),
      images      = CASE WHEN ${data.images.length} > 0 THEN ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(data.images)}::jsonb)) ELSE images END,
      metadata    = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify(data.metadata)}::jsonb,
      updated_at  = NOW()
    WHERE id = ${data.id}
  `
}

async function findSupplierProduct(supplierId: string, externalId: string): Promise<{ id: string } | null> {
  const rows = await sql`
    SELECT id FROM supplier_products
    WHERE supplier_id = ${supplierId}
      AND external_id = ${externalId}
    LIMIT 1
  `
  return (rows[0] as { id: string } | undefined) ?? null
}

async function createSupplierProduct(data: {
  supplierId: string
  productId: string
  externalId: string
  externalName: string
  externalSku: string | null
  purchasePrice: number
  vatRate: number
  currency: string
  stockQuantity: number
  isAvailable: boolean
  rawData: Record<string, unknown>
  matchMethod: "SKU" | "NAME_SIMILARITY"
  matchConfidence: number
}): Promise<void> {
  await sql`
    INSERT INTO supplier_products (
      id, supplier_id, product_id, external_id, external_name,
      external_sku, purchase_price, vat_rate, currency,
      stock_quantity, is_available, raw_data,
      match_method, match_confidence,
      last_scraped_at, created_at, updated_at
    )
    VALUES (
      gen_random_uuid(),
      ${data.supplierId},
      ${data.productId},
      ${data.externalId},
      ${data.externalName},
      ${data.externalSku},
      ${data.purchasePrice},
      ${data.vatRate},
      ${data.currency},
      ${data.stockQuantity},
      ${data.isAvailable},
      ${JSON.stringify(data.rawData)}::jsonb,
      ${data.matchMethod},
      ${data.matchConfidence},
      NOW(), NOW(), NOW()
    )
  `
}

async function updateSupplierProduct(data: {
  id: string
  productId: string
  externalName: string
  externalSku: string | null
  purchasePrice: number
  vatRate: number
  currency: string
  stockQuantity: number
  isAvailable: boolean
  rawData: Record<string, unknown>
  matchMethod: "SKU" | "NAME_SIMILARITY"
  matchConfidence: number
}): Promise<void> {
  await sql`
    UPDATE supplier_products SET
      product_id      = ${data.productId},
      external_name   = ${data.externalName},
      external_sku    = ${data.externalSku},
      purchase_price  = ${data.purchasePrice},
      vat_rate        = ${data.vatRate},
      currency        = ${data.currency},
      stock_quantity  = ${data.stockQuantity},
      is_available    = ${data.isAvailable},
      raw_data        = ${JSON.stringify(data.rawData)}::jsonb,
      match_method    = ${data.matchMethod},
      match_confidence = ${data.matchConfidence},
      last_scraped_at = NOW(),
      updated_at      = NOW()
    WHERE id = ${data.id}
  `
}

async function updateSupplierStatus(
  supplierId: string,
  syncStatus: "SUCCESS" | "PARTIAL" | "ERROR"
): Promise<void> {
  await sql`
    UPDATE suppliers SET
      last_sync_at = NOW(),
      sync_status  = ${syncStatus},
      updated_at   = NOW()
    WHERE id = ${supplierId}
  `
}

// ---------------------------------------------------------------------------
// Brand resolution (find or create, handles slug collisions)
// ---------------------------------------------------------------------------

async function resolveOrCreateBrand(brandName: string): Promise<string> {
  const byName = await findBrandByName(brandName)
  if (byName) return byName

  const baseSlug =
    brandName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `brand-${Date.now()}`

  const bySlug = await findBrandBySlug(baseSlug)
  if (bySlug) return bySlug

  try {
    return await createBrand(brandName, baseSlug)
  } catch {
    // Slug collision race — append timestamp
    return await createBrand(brandName, `${baseSlug}-${Date.now()}`)
  }
}

// ---------------------------------------------------------------------------
// Category resolution (never creates new categories)
// ---------------------------------------------------------------------------

async function resolveCategory(
  categoryRaw: string
): Promise<string | null> {
  const paths = parseCategoryPath(categoryRaw)
  if (paths.length === 0) return null

  for (const { categoryName, fullPath } of paths) {
    const segKey = categoryName.toLowerCase().trim()

    const fullSlug = RESER_FULLPATH_MAP[fullPath]
    if (fullSlug) {
      const id = await findCategoryBySlug(fullSlug)
      if (id) return id
    }

    const segSlug = RESER_SEGMENT_MAP[segKey]
    if (segSlug) {
      const id = await findCategoryBySlug(segSlug)
      if (id) return id
    }

    const id = await findCategoryByName(categoryName)
    if (id) return id
  }

  // Fallback to "diger-urunler"
  return await findCategoryBySlug("diger-urunler")
}

// ---------------------------------------------------------------------------
// Main sync logic
// ---------------------------------------------------------------------------

async function syncReserProducts(): Promise<SyncResult> {
  const result: SyncResult = {
    synced: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  }

  const supplierId = await getOrCreateSupplier()

  // --- Fetch XML ---
  console.log(`[Reser] XML indiriliyor: ${XML_URL}`)
  let xmlText: string
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(XML_URL, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NexaDepo/1.0)" },
    })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    xmlText = await res.text()
  } catch (err) {
    throw new Error(
      `Reser XML indirilemedi: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  // --- Parse XML ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parserOptions: any = {
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name: string) =>
      name === "urun" || name === "resim" || name === "ozellik",
    processEntities: {
      enabled: true,
      maxTotalExpansions: 10_000_000,
      maxExpandedLength: 100_000_000,
      maxEntityCount: 1_000_000,
    },
  }
  const parser = new XMLParser(parserOptions)

  let parsed: unknown
  try {
    parsed = parser.parse(xmlText)
  } catch (err) {
    throw new Error(
      `XML parse hatası: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  // Rate-limit / error response check
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

      // Images: resimler.resim may be string or string[]
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

      const purchasePrice = parsePrice(priceRaw)
      if (purchasePrice === null) {
        result.skipped++
        continue
      }

      const stockQuantity = Math.max(0, Number(stockRaw) || 0)
      const isAvailable = stockQuantity > 0

      // 1. Brand
      let brandId: string | null = null
      if (brandName) {
        brandId = await resolveOrCreateBrand(brandName)
      }

      // 2. Category (no new category creation)
      const categoryId = await resolveCategory(categoryRaw)

      // 3. Product — find by SKU, then by reser_id in metadata
      let product:
        | {
            id: string
            sku: string | null
            brand_id: string | null
            category_id: string | null
            images: string[]
            metadata: unknown
          }
        | null = null

      if (sku) product = await findProductBySku(sku)
      if (!product && externalId) product = await findProductByReserId(externalId)

      let productId: string
      if (!product) {
        const slug = await uniqueProductSlug(name)
        productId = await createProduct({
          name,
          slug,
          sku,
          brandId,
          categoryId,
          images,
          metadata: externalId ? { reser_id: externalId } : null,
        })
        result.created++
        console.log(`[${index}/${products.length}] ${name.slice(0, 60)} → created`)
      } else {
        productId = product.id
        const existingMeta =
          product.metadata &&
          typeof product.metadata === "object" &&
          !Array.isArray(product.metadata)
            ? (product.metadata as Record<string, unknown>)
            : {}
        await updateProduct({
          id: productId,
          name,
          sku,
          brandId,
          categoryId,
          images,
          metadata: {
            ...existingMeta,
            reser_id: externalId || existingMeta.reser_id,
          },
        })
        result.updated++
        console.log(`[${index}/${products.length}] ${name.slice(0, 60)} → updated`)
      }

      // 4. SupplierProduct upsert
      const matchMethod: "SKU" | "NAME_SIMILARITY" = sku ? "SKU" : "NAME_SIMILARITY"
      const matchConfidence = sku ? 90 : 50
      const extId = externalId || sku || name

      const categoryPaths = parseCategoryPath(categoryRaw)
      const supplierCategory = categoryPaths[0]?.categoryName ?? undefined

      const rawData: Record<string, unknown> = {
        ...(item as unknown as Record<string, unknown>),
        ...(supplierCategory ? { _supplierCategory: supplierCategory } : {}),
      }

      const existingSp = await findSupplierProduct(supplierId, extId)

      if (!existingSp) {
        await createSupplierProduct({
          supplierId,
          productId,
          externalId: extId,
          externalName: name,
          externalSku: sku,
          purchasePrice,
          vatRate: RESER_VAT_RATE,
          currency: RESER_CURRENCY,
          stockQuantity,
          isAvailable,
          rawData,
          matchMethod,
          matchConfidence,
        })
      } else {
        await updateSupplierProduct({
          id: existingSp.id,
          productId,
          externalName: name,
          externalSku: sku,
          purchasePrice,
          vatRate: RESER_VAT_RATE,
          currency: RESER_CURRENCY,
          stockQuantity,
          isAvailable,
          rawData,
          matchMethod,
          matchConfidence,
        })
      }

      result.synced++
    } catch (err) {
      result.errors++
      const label = String(item.urunadi ?? item.stokkodu ?? `#${index}`).slice(0, 60)
      console.error(
        `[${index}/${products.length}] ${label} → ERROR: ${
          err instanceof Error ? err.message : String(err)
        }`
      )
    }
  }

  // Update supplier lastSyncAt + syncStatus
  const finalStatus: "SUCCESS" | "PARTIAL" | "ERROR" =
    result.errors === 0 ? "SUCCESS" : result.synced > 0 ? "PARTIAL" : "ERROR"
  await updateSupplierStatus(supplierId, finalStatus)

  return result
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[Reser Neon Sync] DATABASE_URL tanımlı değil.")
    process.exit(1)
  }

  console.log("[Reser Neon Sync] Başlatılıyor...")
  console.log(
    "[Reser Neon Sync] DB:",
    process.env.DATABASE_URL.replace(/:.*@/, ":*****@")
  )

  const startTime = Date.now()

  try {
    const result = await syncReserProducts()
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log("\n[Reser Neon Sync] Tamamlandı!")
    console.log("─────────────────────────────────────")
    console.log(`  Synced  : ${result.synced}`)
    console.log(`  Created : ${result.created}`)
    console.log(`  Updated : ${result.updated}`)
    console.log(`  Skipped : ${result.skipped}`)
    console.log(`  Errors  : ${result.errors}`)
    console.log(`  Süre    : ${duration}s`)
    console.log("─────────────────────────────────────")

    process.exit(result.errors > 0 && result.synced === 0 ? 1 : 0)
  } catch (err) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.error(
      `[Reser Neon Sync] KRİTİK HATA (${duration}s):`,
      err instanceof Error ? err.message : String(err)
    )
    process.exit(1)
  }
}

main()
