// ============================================================================
// BizimHesap B2B API Service
// ============================================================================
// Base URL: https://bizimhesap.com/api/b2b
// Auth: token header (e.g. 0B413362518942E88F3A1039658A0C2B)
// ============================================================================

import { prisma } from "@/lib/db"
import { generateSlug } from "@/lib/utils/slug"
import bcrypt from "bcryptjs"

const BASE_URL = "https://bizimhesap.com/api/b2b"

// ============================================================================
// Types
// ============================================================================

interface BizimhesapResponse<T> {
  resultCode: number
  errorText: string
  data: T
}

interface BizimhesapProduct {
  // Gerçek BizimHesap API alanları
  id?: string
  title?: string
  code?: string
  barcode?: string
  description?: string
  note?: string
  price?: number | string       // satış fiyatı (müşteriye)
  buyingPrice?: number | string // alış fiyatı
  variantPrice?: number | string
  currency?: string             // "USD", "TRY", vb.
  unit?: string                 // "Adet", "Kutu", vb.
  tax?: number | string         // KDV oranı (ör: 20)
  photo?: string[]
  quantity?: number | string    // stok miktarı
  brand?: string
  category?: string
  isActive?: number | boolean
  isEcommerce?: number | boolean
  // Eski/alternatif alanlar (backward compat)
  ProductId?: string
  Barcode?: string
  name?: string
  Name?: string
  Description?: string
  Price?: number | string
  VatRate?: number | string
  vatRate?: number | string
  stockQuantity?: number
  StockQuantity?: number
  sku?: string
  Sku?: string
  [key: string]: unknown
}

interface BizimhesapWarehouse {
  id?: string
  Id?: string
  warehouseId?: string
  WarehouseId?: string
  name?: string
  Name?: string
  [key: string]: unknown
}

interface BizimhesapInventoryItem {
  productId?: string
  ProductId?: string
  barcode?: string
  Barcode?: string
  quantity?: number
  Quantity?: number
  stockQuantity?: number
  StockQuantity?: number
  [key: string]: unknown
}

interface BizimhesapCustomer {
  // Gerçek BizimHesap API alanları
  id?: string
  code?: string          // müşteri kodu (ör: "NX001")
  title?: string         // firma unvanı (ör: "112 BİLGİSAYAR-MUSTAFA ÇAKMAK")
  address?: string
  phone?: string
  taxno?: string         // vergi numarası
  taxoffice?: string     // vergi dairesi
  authorized?: string    // yetkili kişi adı
  balance?: string       // Türkçe format: "2.586,28" veya "-2.586,28"
  chequeandbond?: string
  currency?: string
  email?: string
  // Eski/alternatif alanlar (backward compat)
  Id?: string
  Title?: string
  name?: string
  Name?: string
  Phone?: string
  Email?: string
  taxOffice?: string
  TaxOffice?: string
  taxNumber?: string
  TaxNumber?: string
  Address?: string
  city?: string
  City?: string
  [key: string]: unknown
}

export interface SyncProductsResult {
  synced: number
  created: number
  updated: number
  errors: number
}

export interface SyncInventoryResult {
  synced: number
  errors: number
}

export interface SyncCustomersResult {
  synced: number
  created: number
  updated: number
  errors: number
}

// ============================================================================
// Core fetch utility
// ============================================================================

async function bizimhesapFetch<T>(endpoint: string, token: string): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        token,
      },
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`BizimHesap API ${res.status}: ${text.slice(0, 200)}`)
    }

    const json = (await res.json()) as BizimhesapResponse<T>

    if (json.resultCode !== 1) {
      throw new Error(`BizimHesap hata: ${json.errorText || "Bilinmeyen hata"}`)
    }

    return json.data
  } finally {
    clearTimeout(timeout)
  }
}

// ============================================================================
// Helper: token'ı DB'den veya env'den oku
// ============================================================================

export async function getBizimhesapToken(): Promise<string | null> {
  // 1. DB Setting tablosundan dene
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "bizimhesap.api_key" },
    })
    if (setting?.value) {
      const val = setting.value
      if (typeof val === "string" && val.trim()) return val.trim()
      if (typeof val === "object" && val !== null && "v" in val) {
        const v = (val as { v: unknown }).v
        if (typeof v === "string" && v.trim()) return v.trim()
      }
    }
  } catch {
    // DB hatası olsa bile env'e düş
  }

  // 2. Env'den dene
  const envToken = process.env.BIZIMHESAP_API_KEY
  if (envToken?.trim()) return envToken.trim()

  return null
}

// ============================================================================
// BizimHesap Supplier kaydını getir veya oluştur
// ============================================================================

async function getOrCreateBizimhesapSupplier(): Promise<string> {
  const supplier = await prisma.supplier.upsert({
    where: { code: "bizimhesap" },
    update: { isActive: true },
    create: {
      code: "bizimhesap",
      name: "BizimHesap",
      websiteUrl: "https://bizimhesap.com",
      scraperType: "API",
      isActive: true,
      priority: 10,
      syncIntervalMinutes: 360,
    },
  })
  return supplier.id
}

// ============================================================================
// slug üretici (Product için)
// ============================================================================

async function uniqueProductSlug(name: string): Promise<string> {
  const base = generateSlug(name)
  let slug = base
  let attempt = 0
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } })
    if (!existing) return slug
    attempt++
    slug = `${base}-${attempt}`
  }
}

// ============================================================================
// dealer_code üretici (NAT-XXXX)
// ============================================================================

async function generateDealerCode(): Promise<string> {
  let attempts = 0
  while (attempts < 100) {
    const num = Math.floor(1000 + Math.random() * 9000)
    const code = `NAT-${num}`
    const existing = await prisma.customer.findUnique({ where: { dealerCode: code } })
    if (!existing) return code
    attempts++
  }
  // Timestamp fallback
  return `NAT-${Date.now().toString().slice(-6)}`
}

// ============================================================================
// Balance parse: Türkçe format "2.586,28" veya "-2.586,28" → number
// ============================================================================

function parseBalance(raw: string | undefined | null): number {
  if (!raw) return 0
  const trimmed = raw.trim()
  if (!trimmed || trimmed === "0,00" || trimmed === "0.00") return 0
  // Negatif kontrol
  const isNegative = trimmed.startsWith("-")
  const abs = trimmed.replace(/^-/, "")
  // Türkçe format: nokta = binlik ayırıcı, virgül = ondalık
  // "2.586,28" → "2586.28"
  const normalized = abs.replace(/\./g, "").replace(",", ".")
  const num = parseFloat(normalized)
  if (isNaN(num)) return 0
  return isNegative ? -num : num
}

// ============================================================================
// Telefon normalize
// Döndürür: { phone: "05494521660", whatsappPhone: "905494521660" }
// ============================================================================

function normalizePhonesFromRaw(raw: string | undefined | null): {
  phone: string | null
  whatsappPhone: string | null
} {
  if (!raw) return { phone: null, whatsappPhone: null }
  const digits = raw.replace(/\D/g, "")
  if (!digits) return { phone: null, whatsappPhone: null }

  let tenDigits: string | null = null

  if (digits.startsWith("90") && digits.length === 12) {
    tenDigits = digits.slice(2) // 90XXXXXXXXXX → XXXXXXXXXX
  } else if (digits.startsWith("0") && digits.length === 11) {
    tenDigits = digits.slice(1) // 0XXXXXXXXXX → XXXXXXXXXX
  } else if (digits.length === 10) {
    tenDigits = digits
  }

  if (!tenDigits) return { phone: digits || null, whatsappPhone: digits || null }

  return {
    phone: `0${tenDigits}`,      // 05XXXXXXXXX
    whatsappPhone: `90${tenDigits}`, // 905XXXXXXXXX
  }
}

/** Tek değer döndüren basit helper (inventory / eski kullanım için) */
function normalizePhone(raw: string | undefined | null): string | null {
  return normalizePhonesFromRaw(raw).whatsappPhone
}

// ============================================================================
// syncProducts
// ============================================================================

export async function syncProducts(token: string): Promise<SyncProductsResult> {
  const result: SyncProductsResult = { synced: 0, created: 0, updated: 0, errors: 0 }
  let skippedCount = 0

  const supplierId = await getOrCreateBizimhesapSupplier()

  let products: BizimhesapProduct[] = []
  try {
    const data = await bizimhesapFetch<{ products?: BizimhesapProduct[] } | BizimhesapProduct[]>(
      "/products",
      token
    )
    products = Array.isArray(data)
      ? data
      : (data as { products?: BizimhesapProduct[] }).products ?? []
  } catch (err) {
    throw new Error(`Ürün listesi alınamadı: ${err instanceof Error ? err.message : String(err)}`)
  }

  for (const item of products) {
    // Kategorisi boş olanları atla
    const category = (item.category ?? "").trim()
    if (!category) {
      skippedCount++
      continue
    }

    try {
      // Gerçek BizimHesap API alanlarını çıkar
      const externalId = String(item.id ?? item.ProductId ?? "").trim()
      const barcode = String(item.barcode ?? item.Barcode ?? "").trim() || null
      const name = String(item.title ?? item.name ?? item.Name ?? "").trim()
      const description = String(item.description ?? item.Description ?? "").trim() || null
      const sku = String(item.code ?? item.sku ?? item.Sku ?? "").trim() || null
      const brandName = String(item.brand ?? "").trim() || null
      const categoryName = String(item.category ?? "").trim() || null
      const unitRaw = String(item.unit ?? "").trim()
      const isActiveRaw = item.isActive ?? 1
      const isActive = isActiveRaw === 1 || isActiveRaw === true
      const photoArray = Array.isArray(item.photo) ? (item.photo as string[]).filter(Boolean) : []

      // Fiyatlar
      const salePriceRaw = item.price ?? item.Price ?? null
      const buyingPriceRaw = item.buyingPrice ?? null
      const vatRateRaw = item.tax ?? item.vatRate ?? item.VatRate ?? null
      const currencyRaw = String(item.currency ?? "TRY").trim().toUpperCase()
      const stockQtyRaw = item.qty ?? item.quantity ?? item.stockQuantity ?? item.StockQuantity ?? 0

      const purchasePrice =
        buyingPriceRaw !== null && buyingPriceRaw !== undefined && buyingPriceRaw !== ""
          ? Number(buyingPriceRaw)
          : salePriceRaw !== null && salePriceRaw !== undefined && salePriceRaw !== ""
            ? Number(salePriceRaw)
            : null
      const vatRate = vatRateRaw !== null && vatRateRaw !== undefined ? Number(vatRateRaw) : null
      const stockQuantity = Number(stockQtyRaw) || 0

      // Currency normalize: "USD" kalır, diğerleri → "TRY"
      const currency = ["USD", "EUR", "GBP", "TRY"].includes(currencyRaw) ? currencyRaw : "TRY"

      // Unit enum eşleştir
      const unitMap: Record<string, "ADET" | "KUTU" | "PAKET" | "KOLI" | "METRE" | "KILOGRAM"> = {
        adet: "ADET",
        kutu: "KUTU",
        paket: "PAKET",
        koli: "KOLI",
        metre: "METRE",
        kg: "KILOGRAM",
        kilogram: "KILOGRAM",
      }
      const unit = unitMap[unitRaw.toLowerCase()] ?? "ADET"

      if (!name) continue

      // 1. Brand eşleştir veya oluştur
      let brandId: string | undefined
      if (brandName) {
        let brand = await prisma.brand.findFirst({
          where: { name: { equals: brandName, mode: "insensitive" }, deletedAt: null },
        })
        if (!brand) {
          const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `brand-${Date.now()}`
          // Slug çakışmasını önle: önce slug ile de ara
          brand = await prisma.brand.findFirst({ where: { slug: brandSlug, deletedAt: null } })
          if (!brand) {
            try {
              brand = await prisma.brand.create({ data: { name: brandName, slug: brandSlug } })
            } catch {
              // Slug çakışması durumunda timestamp ekle
              brand = await prisma.brand.create({ data: { name: brandName, slug: `${brandSlug}-${Date.now()}` } })
            }
          }
        }
        brandId = brand.id
      }

      // 2. Category eşleştir - SADECE BUL, otomatik oluşturma
      let categoryId: string | undefined
      if (categoryName) {
        let cat = await prisma.category.findFirst({
          where: { name: { equals: categoryName, mode: "insensitive" }, deletedAt: null },
        })
        categoryId = cat?.id ?? undefined
      }

      // 3. Ürünü barkod → sku → bizimhesap_id sırasıyla bul
      let product = null
      if (barcode) {
        product = await prisma.product.findFirst({
          where: { barcode, deletedAt: null },
        })
      }
      if (!product && sku) {
        product = await prisma.product.findFirst({
          where: { sku, deletedAt: null },
        })
      }
      if (!product && externalId) {
        // metadata JSONB içinde bizimhesap_id ile ara
        product = await prisma.product.findFirst({
          where: {
            deletedAt: null,
            metadata: { path: ["bizimhesap_id"], equals: externalId },
          },
        })
      }

      if (!product) {
        const slug = await uniqueProductSlug(name)
        product = await prisma.product.create({
          data: {
            name,
            slug,
            barcode: barcode ?? undefined,
            sku: sku ?? undefined,
            description: description ?? undefined,
            isActive: false, // Entegrasyondan gelen yeni ürünler varsayılan olarak yayında değil
            unit,
            brandId,
            categoryId,
            images: photoArray,
            metadata: externalId ? { bizimhesap_id: externalId } : undefined,
          },
        })
        result.created++
      } else {
        // Mevcut ürünü güncelle - isActive'e DOKUNMA (admin yayına almış olabilir)
        const existingMeta =
          product.metadata && typeof product.metadata === "object" && !Array.isArray(product.metadata)
            ? (product.metadata as Record<string, unknown>)
            : {}
        await prisma.product.update({
          where: { id: product.id },
          data: {
            name,
            description: description ?? undefined,
            barcode: barcode ?? product.barcode,
            sku: sku ?? product.sku,
            // isActive güncellenmiyor: admin yayına almışsa bozma
            unit,
            brandId: brandId ?? product.brandId ?? undefined,
            categoryId: categoryId ?? product.categoryId ?? undefined,
            images: photoArray.length > 0 ? photoArray : product.images,
            metadata: {
              ...existingMeta,
              bizimhesap_id: externalId || existingMeta.bizimhesap_id,
            } as import("@prisma/client").Prisma.InputJsonValue,
          },
        })
        result.updated++
      }

      // 4. SupplierProduct kaydet / güncelle
      const extId = externalId || name
      const matchMethod = barcode ? ("BARCODE" as const) : sku ? ("SKU" as const) : ("NAME_SIMILARITY" as const)
      const matchConfidence = barcode ? 100 : sku ? 90 : 50

      const supplierProduct = await prisma.supplierProduct.findUnique({
        where: { supplierId_externalId: { supplierId, externalId: extId } },
      })

      const supplierProductData = {
        productId: product.id,
        externalName: name,
        externalBarcode: barcode ?? null,
        externalSku: sku ?? null,
        purchasePrice: purchasePrice !== null ? purchasePrice : null,
        vatRate: vatRate !== null ? vatRate : null,
        currency,
        stockQuantity,
        isAvailable: isActive && stockQuantity >= 0,
        lastScrapedAt: new Date(),
        rawData: {
          ...(item as Record<string, unknown>),
          ...(categoryName ? { _supplierCategory: categoryName } : {}),
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
    } catch {
      result.errors++
      // Tek ürün hatası tüm senkronizasyonu durdurmasın
    }
  }

  if (skippedCount > 0) {
    console.log(`[BizimHesap] ${skippedCount} ürün kategorisiz olduğu için atlandı.`)
  }

  // Kategorisiz ürünleri DB'den temizle (sadece boş string)
  const deletedUncategorized = await prisma.supplierProduct.deleteMany({
    where: {
      supplierId,
      rawData: { path: ["category"], equals: "" },
    },
  })
  if (deletedUncategorized.count > 0) {
    console.log(`[BizimHesap] ${deletedUncategorized.count} kategorisiz ürün veritabanından silindi.`)
  }

  // Supplier lastSyncAt güncelle
  await prisma.supplier.update({
    where: { id: supplierId },
    data: {
      lastSyncAt: new Date(),
      syncStatus: result.errors === 0 ? "SUCCESS" : result.synced > 0 ? "PARTIAL" : "ERROR",
    },
  })

  return result
}

// ============================================================================
// syncInventory
// ============================================================================

export async function syncInventory(token: string): Promise<SyncInventoryResult> {
  const result: SyncInventoryResult = { synced: 0, errors: 0 }

  const supplierId = await getOrCreateBizimhesapSupplier()

  // 1. Depoları çek
  let warehouses: BizimhesapWarehouse[] = []
  try {
    const data = await bizimhesapFetch<
      { warehouses?: BizimhesapWarehouse[] } | BizimhesapWarehouse[]
    >("/warehouses", token)
    warehouses = Array.isArray(data)
      ? data
      : (data as { warehouses?: BizimhesapWarehouse[] }).warehouses ?? []
  } catch (err) {
    throw new Error(`Depo listesi alınamadı: ${err instanceof Error ? err.message : String(err)}`)
  }

  // 2. Her depo için stok çek
  for (const warehouse of warehouses) {
    const warehouseId = String(
      warehouse.id ?? warehouse.Id ?? warehouse.warehouseId ?? warehouse.WarehouseId ?? ""
    )
    if (!warehouseId) continue

    let inventory: BizimhesapInventoryItem[] = []
    try {
      const data = await bizimhesapFetch<
        | { inventory?: BizimhesapInventoryItem[]; items?: BizimhesapInventoryItem[] }
        | BizimhesapInventoryItem[]
      >(`/inventory/${warehouseId}`, token)
      inventory = Array.isArray(data)
        ? data
        : (
            data as {
              inventory?: BizimhesapInventoryItem[]
              items?: BizimhesapInventoryItem[]
            }
          ).inventory ??
          (
            data as {
              inventory?: BizimhesapInventoryItem[]
              items?: BizimhesapInventoryItem[]
            }
          ).items ??
          []
    } catch {
      result.errors++
      continue
    }

    for (const item of inventory) {
      try {
        // BizimHesap inventory: { id, title, barcode, qty }
        const itemId = String(item.id ?? "").trim()
        const itemTitle = String(item.title ?? "").trim()
        const itemBarcode = String(item.barcode ?? "").trim()
        const quantity = Number(item.qty ?? item.quantity ?? item.Quantity ?? item.stockQuantity ?? 0)

        if (!itemId && !itemTitle) continue

        // SupplierProduct'u externalId, barcode veya isim ile bul
        const conditions = []
        if (itemId) conditions.push({ externalId: itemId })
        if (itemBarcode) conditions.push({ externalBarcode: itemBarcode })
        if (itemTitle) conditions.push({ externalName: itemTitle })

        const supplierProduct = await prisma.supplierProduct.findFirst({
          where: {
            supplierId,
            OR: conditions,
            deletedAt: null,
          },
        })

        if (supplierProduct) {
          await prisma.supplierProduct.update({
            where: { id: supplierProduct.id },
            data: {
              stockQuantity: Math.max(quantity, 0), // negatif stoku 0 yap
              isAvailable: quantity > 0,
              lastScrapedAt: new Date(),
            },
          })
          result.synced++
        }
      } catch {
        result.errors++
      }
    }
  }

  // Supplier lastSyncAt güncelle
  await prisma.supplier.update({
    where: {
      code: "bizimhesap",
    },
    data: {
      lastSyncAt: new Date(),
      syncStatus: result.errors === 0 ? "SUCCESS" : result.synced > 0 ? "PARTIAL" : "ERROR",
    },
  })

  return result
}

// ============================================================================
// syncCustomers
// ============================================================================

export async function syncCustomers(token: string): Promise<SyncCustomersResult> {
  const result: SyncCustomersResult = { synced: 0, created: 0, updated: 0, errors: 0 }

  let customers: BizimhesapCustomer[] = []
  try {
    const data = await bizimhesapFetch<
      { customers?: BizimhesapCustomer[] } | BizimhesapCustomer[]
    >("/customers", token)
    customers = Array.isArray(data)
      ? data
      : (data as { customers?: BizimhesapCustomer[] }).customers ?? []
  } catch (err) {
    throw new Error(
      `Müşteri listesi alınamadı: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  for (const item of customers) {
    try {
      // Gerçek BizimHesap API alanlarını çıkar
      const bizimhesapId = String(item.id ?? item.Id ?? "").trim()
      const bizimhesapCode = String(item.code ?? "").trim() || null
      const rawTitle = String(item.title ?? item.Title ?? item.name ?? item.Name ?? "").trim()
      const rawPhone = String(item.phone ?? item.Phone ?? "").trim() || null
      const email = String(item.email ?? item.Email ?? "").trim() || null

      // BizimHesap gerçek alan adları: taxno, taxoffice, authorized
      const taxNumber = String(item.taxno ?? item.taxNumber ?? item.TaxNumber ?? "").trim() || null
      const taxOffice = String(item.taxoffice ?? item.taxOffice ?? item.TaxOffice ?? "").trim() || null
      const authorized = String(item.authorized ?? "").trim() || null
      const address = String(item.address ?? item.Address ?? "").trim() || null
      const city = String(item.city ?? item.City ?? "").trim() || null
      const rawBalance = String(item.balance ?? "").trim() || null

      if (!rawTitle) continue

      // companyName = title, contactName = authorized (API'deki yetkili kişi)
      const companyName = rawTitle

      // Eğer API "authorized" değeri varsa onu kullan, yoksa title içinde " - " varsa böl
      let contactName: string | null = authorized
      if (!contactName && rawTitle.includes(" - ")) {
        const parts = rawTitle.split(" - ")
        contactName = parts.slice(1).join(" - ").trim() || null
      }

      // Telefon: phone → "05xx", whatsappPhone → "905xx"
      const { phone, whatsappPhone } = normalizePhonesFromRaw(rawPhone)

      // Balance parse: "2.586,28" → 2586.28
      const newBalance = parseBalance(rawBalance)

      // Mevcut müşteriyi bul: önce taxno, sonra telefon ile eşleştir
      let existing = null

      if (taxNumber) {
        existing = await prisma.customer.findFirst({
          where: { taxNumber, deletedAt: null },
        })
      }

      if (!existing && (phone || whatsappPhone)) {
        const orConditions: Array<{ phone?: string; whatsappPhone?: string }> = []
        if (phone) orConditions.push({ phone }, { whatsappPhone: phone })
        if (whatsappPhone) orConditions.push({ whatsappPhone }, { phone: whatsappPhone })
        if (rawPhone) orConditions.push({ phone: rawPhone })

        existing = await prisma.customer.findFirst({
          where: { OR: orConditions, deletedAt: null },
        })
      }

      // Mevcut metadata birleştirme yardımcısı
      function mergeMetadata(
        existingMeta: unknown,
        updates: Record<string, unknown>
      ): Record<string, unknown> {
        const base =
          existingMeta && typeof existingMeta === "object" && !Array.isArray(existingMeta)
            ? (existingMeta as Record<string, unknown>)
            : {}
        return { ...base, ...updates }
      }

      const metaUpdates = {
        bizimhesap_id: bizimhesapId || undefined,
        bizimhesap_code: bizimhesapCode || undefined,
        source: "bizimhesap",
        syncedAt: new Date().toISOString(),
      }

      if (existing) {
        // Balance değişmişse AccountTransaction ekle
        const oldBalance = Number(existing.balance)
        const balanceDiff = newBalance - oldBalance

        await prisma.customer.update({
          where: { id: existing.id },
          data: {
            companyName,
            contactName: contactName ?? existing.contactName,
            phone: phone ?? existing.phone,
            whatsappPhone: whatsappPhone ?? existing.whatsappPhone,
            email: email ?? existing.email,
            taxOffice: taxOffice ?? existing.taxOffice,
            taxNumber: taxNumber ?? existing.taxNumber,
            address: address ?? existing.address,
            city: city ?? existing.city,
            balance: newBalance,
            metadata: mergeMetadata(existing.metadata, metaUpdates) as import("@prisma/client").Prisma.InputJsonValue,
          },
        })

        // Bakiye değiştiyse hareket kaydı ekle
        if (rawBalance !== null && Math.abs(balanceDiff) >= 0.01) {
          await prisma.accountTransaction.create({
            data: {
              customerId: existing.id,
              type: "ADJUSTMENT",
              amount: balanceDiff,
              balanceAfter: newBalance,
              currency: "TRY",
              referenceType: "BIZIMHESAP_SYNC",
              referenceId: bizimhesapId || bizimhesapCode || undefined,
              description: `BizimHesap cari bakiye senkronizasyonu (önceki: ${oldBalance.toFixed(2)}, yeni: ${newBalance.toFixed(2)})`,
            },
          })
        }

        result.updated++
      } else {
        // Yeni müşteri oluştur
        const dealerCode = await generateDealerCode()
        const randomPassword = Math.random().toString(36).slice(2, 10)
        const passwordHash = await bcrypt.hash(randomPassword, 10)

        const newCustomer = await prisma.customer.create({
          data: {
            dealerCode,
            passwordHash,
            companyName,
            contactName: contactName ?? undefined,
            phone: phone ?? undefined,
            whatsappPhone: whatsappPhone ?? undefined,
            email: email ?? undefined,
            taxOffice: taxOffice ?? undefined,
            taxNumber: taxNumber ?? undefined,
            address: address ?? undefined,
            city: city ?? undefined,
            country: "TR",
            status: "APPROVED",
            approvedAt: new Date(),
            balance: newBalance,
            creditLimit: 0,
            discountRate: 0,
            metadata: mergeMetadata(null, metaUpdates) as import("@prisma/client").Prisma.InputJsonValue,
          },
        })

        // Başlangıç bakiyesi sıfır değilse açılış hareketi ekle
        if (Math.abs(newBalance) >= 0.01) {
          await prisma.accountTransaction.create({
            data: {
              customerId: newCustomer.id,
              type: "OPENING_BALANCE",
              amount: newBalance,
              balanceAfter: newBalance,
              currency: "TRY",
              referenceType: "BIZIMHESAP_SYNC",
              referenceId: bizimhesapId || bizimhesapCode || undefined,
              description: "BizimHesap'tan aktarılan açılış bakiyesi",
            },
          })
        }

        result.created++
      }

      result.synced++
    } catch {
      result.errors++
      // Tek müşteri hatası tüm senkronizasyonu durdurmasın
    }
  }

  return result
}
