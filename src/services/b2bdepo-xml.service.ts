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
  // Yeni kategori ağacı: b2bdepo kategorilerini bizim hiyerarşimize eşleştir
  const ust = (ustKategori || "").toLowerCase()
  const alt = (altKategori || "").toLowerCase()
  const enAlt = (enAltKategori || "").toLowerCase()
  const text = `${ust} ${alt} ${enAlt}`

  const find = async (name: string, parentSlug?: string) => {
    if (parentSlug) {
      const parent = await prisma.category.findFirst({ where: { slug: parentSlug, deletedAt: null }, select: { id: true } })
      if (!parent) return null
      return prisma.category.findFirst({ where: { name: { equals: name, mode: "insensitive" as const }, parentId: parent.id, deletedAt: null }, select: { id: true } })
    }
    return prisma.category.findFirst({ where: { name: { equals: name, mode: "insensitive" as const }, deletedAt: null }, select: { id: true } })
  }

  // Yangın Algılama
  if (/yangın|fire|duman|smoke|heat detect/i.test(text)) {
    const c = await find("Yangın Alarm Sistemleri", "yangin-algilama-urunleri")
    if (c) return c.id
    return (await find("Yangın Algılama Ürünleri"))?.id ?? undefined
  }

  // Hırsız Algılama
  if (/hırsız|burglar|alarm sistem|hareket sens|pir sensor|motion|siren|magnetic|kontak|shock|glass break/i.test(text)) {
    const c = await find("Hırsız Alarm Sistemleri", "hirsiz-algilama-urunleri")
    if (c) return c.id
    return (await find("Hırsız Algılama Ürünleri"))?.id ?? undefined
  }

  // Intercom
  if (/intercom|villa set|kapı telefon|video intercom|dış ünite|iç ünite/i.test(text)) {
    if (/dış ünite|outdoor unit/i.test(text)) return (await find("Dış Ünite", "guvenlik-intercom-sistemleri"))?.id ?? undefined
    if (/iç ünite|indoor unit|monitor/i.test(text)) return (await find("İç Ünite", "guvenlik-intercom-sistemleri"))?.id ?? undefined
    if (/villa set/i.test(text)) return (await find("Villa Setleri", "guvenlik-intercom-sistemleri"))?.id ?? undefined
    return (await find("Intercom Sistemleri", "guvenlik"))?.id ?? undefined
  }

  // Analog Kameralar
  if (/ahd|hdcvi|hdtvi/i.test(text) || enAlt.includes("ahd") || enAlt.includes("hd-tvi")) {
    if (/hdcvi/i.test(text)) return (await find("HDCVI", "guvenlik-analog-kameralar"))?.id ?? undefined
    if (/hdtvi|hd-tvi/i.test(text)) return (await find("HDTVI", "guvenlik-analog-kameralar"))?.id ?? undefined
    return (await find("AHD", "guvenlik-analog-kameralar"))?.id ?? undefined
  }

  // Kayıt Cihazları
  if (alt.includes("kayıt")) {
    if (/nvr/i.test(text)) return (await find("NVR", "guvenlik-kayit-cihazlari"))?.id ?? undefined
    if (/dvr|xvr|hybrid/i.test(text)) return (await find("DVR / XVR", "guvenlik-kayit-cihazlari"))?.id ?? undefined
  }

  // Güvenlik Aksesuarları
  if (alt.includes("aksesuar") && ust.includes("güvenlik")) {
    if (/bağlantı ekipman/i.test(text)) return (await find("Bağlantı Ekipmanları", "guvenlik-guvenlik-aksesuarlari"))?.id ?? undefined
    if (/adapt/i.test(text)) return (await find("Güvenlik Adaptörleri", "guvenlik-guvenlik-aksesuarlari"))?.id ?? undefined
    if (/klavye/i.test(text)) return (await find("Kontrol Klavyesi", "guvenlik-guvenlik-aksesuarlari"))?.id ?? undefined
    if (/lens/i.test(text)) return (await find("Lens", "guvenlik-guvenlik-aksesuarlari"))?.id ?? undefined
    if (/montaj|aparat/i.test(text)) return (await find("Montaj Aparatı", "guvenlik-guvenlik-aksesuarlari"))?.id ?? undefined
    return (await find("Güvenlik Aksesuarları", "guvenlik"))?.id ?? undefined
  }

  // Switch
  if (alt.includes("switch")) {
    if (enAlt.includes("poe") || /poe switch/i.test(text)) return (await find("PoE Switchler", "network-switchler"))?.id ?? undefined
    if (enAlt.includes("data") || enAlt.includes("non-poe")) return (await find("Data/Non-PoE Switchler", "network-switchler"))?.id ?? undefined
    if (enAlt.includes("endüstriyel")) return (await find("Endüstriyel Switchler", "network-switchler"))?.id ?? undefined
    if (enAlt.includes("fiber") || enAlt.includes("omurga")) return (await find("Fiber/Omurga Switchler", "network-switchler"))?.id ?? undefined
    if (enAlt.includes("sfp") || enAlt.includes("gbic")) return (await find("SFP/GBIC Modül", "network-switchler"))?.id ?? undefined
    if (/poe/i.test(text)) return (await find("PoE Switchler", "network-switchler"))?.id ?? undefined
    return (await find("Data/Non-PoE Switchler", "network-switchler"))?.id ?? undefined
  }

  // Access Point / Ağ İletişim
  if (alt.includes("ağ iletişim") || /access point|router|hotspot|gateway|wifi|wireless|kablosuz/i.test(text)) {
    if (/anten|antenna/i.test(text)) return (await find("Antenler", "network"))?.id ?? undefined
    if (/hotspot|gateway/i.test(text)) return (await find("Hotspot/Gateway", "network-access-point"))?.id ?? undefined
    if (/home router|ev router|adsl|dsl|modem/i.test(text)) return (await find("Home Router", "network-access-point"))?.id ?? undefined
    if (/usb adapt/i.test(text)) return (await find("Kablosuz USB Adaptör", "network-access-point"))?.id ?? undefined
    if (/poe adapt|enjector|injector/i.test(text)) return (await find("PoE Adaptör/Enjector", "network-access-point"))?.id ?? undefined
    return (await find("Access Point ve Router", "network-access-point"))?.id ?? undefined
  }

  // Fiber
  if (alt.includes("fiber") || /fiber|sfp|media converter|optical/i.test(text)) {
    if (/adapt/i.test(text)) return (await find("Fiber Adaptörler", "network-fiber-urunler"))?.id ?? undefined
    if (/converter|media converter/i.test(text)) return (await find("Media Converter", "network-fiber-urunler"))?.id ?? undefined
    if (/patch kablo/i.test(text)) return (await find("Fiber Patch Kablo", "network-fiber-urunler"))?.id ?? undefined
    if (/patch panel|dağıtıc/i.test(text)) return (await find("Fiber Patch Paneller", "network-fiber-urunler"))?.id ?? undefined
    if (/pigtail/i.test(text)) return (await find("Fiber Pigtail", "network-fiber-urunler"))?.id ?? undefined
    return (await find("Fiber Ürünler", "network"))?.id ?? undefined
  }

  // Ağ Kabloları
  if (alt.includes("ağ kablo") || /cat6|cat5e|patch kablo|network kablo/i.test(text)) {
    if (/patch/i.test(text)) return (await find("Patch Kablolar", "network-ag-kablolari"))?.id ?? undefined
    return (await find("CAT6 Kablo", "network-ag-kablolari"))?.id ?? undefined
  }

  // Network Sarf
  if (alt.includes("network sarf") || /konnektor|pense|sonlandirma|crimp/i.test(text)) {
    if (/konnektor|connector|rj45/i.test(text)) return (await find("Konnektör", "network-network-sarf"))?.id ?? undefined
    if (/pense|crimp/i.test(text)) return (await find("Pense", "network-network-sarf"))?.id ?? undefined
    if (/sonlandirma/i.test(text)) return (await find("Sonlandırma Ürünleri", "network-network-sarf"))?.id ?? undefined
    return (await find("Network Sarf", "network"))?.id ?? undefined
  }

  // Patch Panel
  if (/patch panel/i.test(text)) return (await find("Patch Panel", "network"))?.id ?? undefined

  // Antenler
  if (/anten|antenna|sector|omni|mimo/i.test(text)) return (await find("Antenler", "network"))?.id ?? undefined

  // UPS
  if (alt.includes("ups") || alt.includes("kesintisiz") || /ups\b|line interactive|online ups|kesintisiz güç/i.test(text)) {
    if (/online/i.test(text)) return (await find("Online", "guc-elektronigi-ups"))?.id ?? undefined
    if (/line interactive/i.test(text)) return (await find("Line Interactive", "guc-elektronigi-ups"))?.id ?? undefined
    return (await find("UPS", "guc-elektronigi"))?.id ?? undefined
  }

  // Akü
  if (/akü|battery|\bpil\b/i.test(text)) return (await find("Akü", "guc-elektronigi"))?.id ?? undefined

  // Korumalı Priz
  if (/priz|surge protector|power strip|korumal/i.test(text)) return (await find("Korumalı Prizler", "guc-elektronigi"))?.id ?? undefined

  // Seslendirme
  if (alt.includes("ses sistem") || /amfi|mikser|amplifier|receiver|hoparlör|speaker|mikrofon|microphone|anons/i.test(text)) {
    if (/amfi|mikser|amplifier|receiver/i.test(text)) return (await find("Amfi / Mikserler", "seslendirme-sistemleri"))?.id ?? undefined
    if (/hoparl|speaker/i.test(text)) return (await find("Hoparlör", "seslendirme-sistemleri"))?.id ?? undefined
    if (/mikrofon|microphone|\bmic\b/i.test(text)) return (await find("Mikrofonlar", "seslendirme-sistemleri"))?.id ?? undefined
    if (/anons/i.test(text)) return (await find("Acil Anons Sistemleri", "seslendirme-sistemleri"))?.id ?? undefined
    return (await find("Seslendirme Sistemleri"))?.id ?? undefined
  }

  // Kabinetler
  if (alt.includes("kabin") || /\bkabin\b|rack|server rack|network rack/i.test(text)) {
    if (/aksesuar|fan|rail|shelf|drawer|cable organ/i.test(text)) return (await find("Kabin Aksesuarları", "kabinetler"))?.id ?? undefined
    return (await find("Kabin", "kabinetler"))?.id ?? undefined
  }

  return undefined
}

// IP kamera ürün adından tip + çözünürlük ile derin kategori bul
async function resolveIpCameraCategory(productName: string): Promise<string | undefined> {
  const name = productName.toLowerCase()
  const find = async (catName: string, parentSlug: string) => {
    const parent = await prisma.category.findFirst({ where: { slug: parentSlug, deletedAt: null }, select: { id: true } })
    if (!parent) return null
    return prisma.category.findFirst({ where: { name: { equals: catName, mode: "insensitive" as const }, parentId: parent.id, deletedAt: null }, select: { id: true } })
  }

  // Tip belirle
  let typeSlug = ""
  let typeName = ""
  if (/bullet/i.test(name)) { typeSlug = "guvenlik-ip-kameralar-bullet"; typeName = "Bullet" }
  else if (/dome/i.test(name)) { typeSlug = "guvenlik-ip-kameralar-dome"; typeName = "Dome" }
  else if (/ptz|speed ?dome|speeddome/i.test(name)) { typeSlug = "guvenlik-ip-kameralar-speed-dome-ptz"; typeName = "Speed Dome (PTZ)" }
  else if (/turret/i.test(name)) return (await find("Turret", "guvenlik-ip-kameralar"))?.id ?? undefined
  else if (/fisheye|panoramik|360|pano/i.test(name)) return (await find("Fisheye / Panoramik", "guvenlik-ip-kameralar"))?.id ?? undefined
  else if (/termal|thermal/i.test(name)) return (await find("Termal Kamera", "guvenlik-ip-kameralar"))?.id ?? undefined
  else if (/plaka|lpr|anpr/i.test(name)) return (await find("LPR / Plaka Tanıma", "guvenlik-ip-kameralar"))?.id ?? undefined
  else return (await prisma.category.findFirst({ where: { name: { equals: "IP Kameralar", mode: "insensitive" as const }, deletedAt: null }, select: { id: true } }))?.id ?? undefined

  // MP belirle
  let mp = "Diğer"
  if (/8\s?mp|4k\b|3840|2160/i.test(name)) mp = "8MP"
  else if (/5\s?mp|5mp\b/i.test(name)) mp = "5MP"
  else if (/4\s?mp|4mp\b|2688|2560/i.test(name)) mp = "4MP"
  else if (/3\s?mp|3mp\b|2048/i.test(name)) mp = "3MP"
  else if (/2\s?mp|2mp\b|1080|1920/i.test(name)) mp = "2MP"

  // Önce MP alt kategorisinde ara
  const mpCat = await find(mp, typeSlug)
  if (mpCat) return mpCat.id

  // Bulamazsa tip kategorisine dön
  const typeCat = await prisma.category.findFirst({ where: { slug: typeSlug, deletedAt: null }, select: { id: true } })
  return typeCat?.id ?? undefined
}

// Pasif ürünler kategorisinin ID'si (cache'li)
let passiveCategoryIdCache: string | null = null
async function getPassiveCategoryId(): Promise<string | undefined> {
  if (passiveCategoryIdCache) return passiveCategoryIdCache
  const cat = await prisma.category.findFirst({ where: { name: "Pasif Ürünler", deletedAt: null }, select: { id: true } })
  if (cat) {
    passiveCategoryIdCache = cat.id
    return cat.id
  }
  return undefined
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
        source: "b2bdepo",
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
  let categoryId = await resolveCategory(
    item.ustKategoriAdi,
    item.altKategoriAdi,
    item.enAltKategoriAdi
  )
  const brandId = await resolveBrand(item.marka)

  // IP Kameralar: resolveCategory b2bdepo enAlt "IP Kameralar" için skip eder,
  // ürün adından tip + MP çıkarıp derin kategoriye gönder
  if (!categoryId && item.enAltKategoriAdi?.toLowerCase().includes("ip kamera")) {
    categoryId = await resolveIpCameraCategory(item.urunAdi)
  }

  // Kategori bulunamadıysa pasif kategoriye at
  let isActive = true
  if (!categoryId) {
    categoryId = await getPassiveCategoryId()
    isActive = false
  }

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
        isActive,
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
        isActive,
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

  // _supplierCategory: ustKategoriAdi > altKategoriAdi > enAltKategoriAdi
  const supplierCategoryParts = [
    item.ustKategoriAdi,
    item.altKategoriAdi,
    item.enAltKategoriAdi,
  ].filter((p): p is string => Boolean(p))
  const supplierCategory = supplierCategoryParts.length > 0
    ? supplierCategoryParts.join(" > ")
    : undefined

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
    rawData: {
      ...(item as unknown as Record<string, unknown>),
      ...(supplierCategory ? { _supplierCategory: supplierCategory } : {}),
    } as import("@prisma/client").Prisma.InputJsonValue,
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

    // Batch update hazirla
    const now = new Date()
    const updateOps: ReturnType<typeof prisma.supplierProduct.update>[] = []
    const priceHistoryOps: ReturnType<typeof prisma.priceHistory.create>[] = []

    for (const item of xmlResult.items) {
      const prev = existingMap.get(item.urunKodu)
      if (!prev) continue

      const currency = "USD"

      updateOps.push(
        prisma.supplierProduct.update({
          where: { id: prev.id },
          data: {
            purchasePrice: item.ozelFiyat,
            vatRate: item.kdv,
            currency,
            stockQuantity: item.stok,
            isAvailable: item.stok > 0,
            lastScrapedAt: now,
          },
        })
      )

      if (prev.purchasePrice !== null && item.ozelFiyat !== prev.purchasePrice) {
        const pct =
          prev.purchasePrice !== 0
            ? Number((((item.ozelFiyat - prev.purchasePrice) / prev.purchasePrice) * 100).toFixed(2))
            : null

        priceHistoryOps.push(
          prisma.priceHistory.create({
            data: {
              supplierProductId: prev.id,
              oldPrice: prev.purchasePrice,
              newPrice: item.ozelFiyat,
              currency,
              priceChangePct: pct,
            },
          })
        )
        result.priceChanges++
      }

      result.updated++
      result.synced++
    }

    // Paralel batch execute (50'lik gruplar)
    const CONCURRENCY = 50
    for (let i = 0; i < updateOps.length; i += CONCURRENCY) {
      const chunk = updateOps.slice(i, i + CONCURRENCY)
      const results = await Promise.allSettled(chunk)
      for (const r of results) {
        if (r.status === "rejected") {
          result.errors++
          result.updated--
          result.synced--
        }
      }
    }
    // Price history — seri, hata tolere
    for (const op of priceHistoryOps) {
      try {
        await op
      } catch {
        // devam et
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
