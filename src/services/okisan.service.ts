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
// Okisan → DB Kategori Eşleştirme Tablosu
// ============================================================================
// 1. Önce FULL PATH (lowercase) eşleşmesi aranır (en spesifik)
// 2. Sonra son SEGMENT (lowercase) eşleşmesi aranır
// 3. Sonra DB'de isimle arama (case-insensitive)
// 4. Hâlâ yoksa → "diger-urunler" fallback
// Eşleşmeyenler → "Diğer Ürünler" kategorisine düşer (yeni kategori AÇILMAZ)
// ============================================================================

const OKISAN_FULLPATH_MAP: Record<string, string> = {
  // --- IP Kamera alt kırılımları → Güvenlik & CCTV / IP Kameralar ---
  "ip ürünler > ip kamera > lite serisi > 2 megapixel": "ip-kameralar",
  "ip ürünler > ip kamera > lite serisi > 4 megapixel": "ip-kameralar",
  "ip ürünler > ip kamera > lite serisi > 5 megapixel": "ip-kameralar",
  "ip ürünler > ip kamera > lite serisi > 8 megapixel": "ip-kameralar",
  "ip ürünler > ip kamera > lite serisi > 3 megapiksel": "ip-kameralar",
  "ip ürünler > ip kamera > pro serisi > 2 megapixel": "ip-kameralar",
  "ip ürünler > ip kamera > pro serisi > 4 megapixel": "ip-kameralar",
  "ip ürünler > ip kamera > pro serisi > 8 megapixel": "ip-kameralar",
  "ip ürünler > ip kamera > ultra serisi > 12 megapixel": "ip-kameralar",
  "ip ürünler > ip kamera > ultra serisi > 2 megapixel": "ip-kameralar",
  "ip ürünler > ip kamera > ultra serisi > 8 megapixel": "ip-kameralar",
  "ip ürünler > ip kamera > consumer serisi > 2 megapixel": "ip-kameralar",
  "ip ürünler > ip kamera > consumer serisi > 4 megapixel": "ip-kameralar",
  "ip ürünler > ip kamera > panoramic > fisheye": "ip-kameralar",
  "ip ürünler > ip kamera > pinhole serisi > 2 megapixel": "ip-kameralar",
  "ip ürünler > ip kamera > pinhole serisi > 4 megapixel": "ip-kameralar",
  "ip ürünler > ip kamera > wifi serisi > 3 megapixel": "ip-kameralar",
  "ip ürünler > ip kamera > eco savvy 3.0 > 8 megapixel": "ip-kameralar",
  "ip ürünler > ip kamera > wizsense > 3 serisi": "ip-kameralar",
  "ip ürünler > ip kamera > wizmind > 5 serisi": "ip-kameralar",

  // --- IP Kayıt Cihazları ---
  "ip ürünler > ip kayıt cihazı > lite nvr > 1hdd": "kayit-cihazlari",
  "ip ürünler > ip kayıt cihazı > lite nvr > 2hdd": "kayit-cihazlari",
  "ip ürünler > ip kayıt cihazı > pro nvr > 2hdd": "kayit-cihazlari",
  "ip ürünler > ip kayıt cihazı > pro nvr > 4hdd": "kayit-cihazlari",
  "ip ürünler > ip kayıt cihazı > pro nvr > 8hdd": "kayit-cihazlari",
  "ip ürünler > ip kayıt cihazı > ultra nvr": "kayit-cihazlari",
  "ip ürünler > ip kayıt cihazı > wizmind serisi": "kayit-cihazlari",

  // --- IP PTZ ---
  "ip ürünler > ip ptz kamera > lite serisi > 2 megapixel": "ip-ptz-kamera",
  "ip ürünler > ip ptz kamera > pro serisi > 2 megapixel": "ip-ptz-kamera",
  "ip ürünler > ip ptz kamera > pro serisi > 4 megapixel": "ip-ptz-kamera",
  "ip ürünler > ip ptz kamera > ultra serisi > 2 megapixel": "ip-ptz-kamera",
  "ip ürünler > ip ptz kamera > ultra serisi": "ip-ptz-kamera",
  "ip ürünler > ip ptz kamera > wizmind serisi > 2 megapixel": "ip-ptz-kamera",
  "ip ürünler > ip ptz kamera > wizzesense serisi > 2 megapixel": "ip-ptz-kamera",
  "ip ürünler > ip ptz kamera > wizzesense serisi > 4 megapixel": "ip-ptz-kamera",

  // --- HDCVI alt kırılımları ---
  "hdcvi ürünler > hdcvi kamera > lite serisi > 2 megapixel": "analog-kameralar",
  "hdcvi ürünler > hdcvi kamera > lite serisi > 4 megapixel": "analog-kameralar",
  "hdcvi ürünler > hdcvi kamera > lite serisi > 5 megapixel": "analog-kameralar",
  "hdcvi ürünler > hdcvi kamera > pro serisi > 4k serisi": "analog-kameralar",
  "hdcvi ürünler > hdcvi kamera > pro serisi > 4 megapixel": "analog-kameralar",
  "hdcvi ürünler > hdcvi kamera > pro serisi > 1080p": "analog-kameralar",
  "hdcvi ürünler > hdcvi kamera > ultra serisi > 720p": "analog-kameralar",
  "hdcvi ürünler > hdcvi kamera > micro-size serisi": "analog-kameralar",
  "hdcvi ürünler > hdcvi kamera > active deterrence series": "analog-kameralar",

  // --- HDCVI Kayıt Cihazları ---
  "hdcvi ürünler > hdcvi kayıt cihazı > lite h.265 1080p serisi > 1 hdd": "dvr",
  "hdcvi ürünler > hdcvi kayıt cihazı > lite h.265 1080p serisi > 2 hdd": "dvr",
  "hdcvi ürünler > hdcvi kayıt cihazı > lite h.265 1080p serisi > 8 hdd": "dvr",
  "hdcvi ürünler > hdcvi kayıt cihazı > lite serisi > 1u": "dvr",
  "hdcvi ürünler > hdcvi kayıt cihazı > lite serisi > 1.5u": "dvr",
  "hdcvi ürünler > hdcvi kayıt cihazı > lite serisi > compact 1u": "dvr",
  "hdcvi ürünler > hdcvi kayıt cihazı > lite serisi > mini 1u": "dvr",
  "hdcvi ürünler > hdcvi kayıt cihazı > pro serisi > 1hdd": "dvr",
  "hdcvi ürünler > hdcvi kayıt cihazı > pro serisi > 2hdd": "dvr",
  "hdcvi ürünler > hdcvi kayıt cihazı > pro serisi > 8hdd": "dvr",
  "hdcvi ürünler > hdcvi kayıt cihazı > wizzesense serisi > i3 serisi": "dvr",
  "hdcvi ürünler > hdcvi kayıt cihazı > cooper serisi": "dvr",
  "hdcvi ürünler > hdcvi kayıt cihazı > lite ai serisi": "dvr",
  "hdcvi ürünler > hdcvi kayıt cihazı > atm & encoder & x86 serisi": "dvr",

  // --- HDCVI PTZ ---
  "hdcvi ürünler > hdcvi ptz kamera > 1080p": "analog-kameralar",
  "hdcvi ürünler > hdcvi ptz kamera > 2 megapixel": "analog-kameralar",
  "hdcvi ürünler > hdcvi ptz kamera > 4 megapixel": "analog-kameralar",
  "hdcvi ürünler > hdcvi ptz kamera > 720p": "analog-kameralar",
  "hdcvi ürünler > hdcvi aksesuar": "cctv-aksesuarlari",
  "hdcvi ürünler > hdcvi aksesuar > balun": "cctv-aksesuarlari",

  // --- Akıllı Ev - Otomasyon alt kırılımları ---
  "akıllı ev - otomasyon > video intercom > ip sistemler > vth": "monitorlu-ic-unite",
  "akıllı ev - otomasyon > video intercom > ip sistemler > açık istasyon": "kapi-istasyonu",
  "akıllı ev - otomasyon > video intercom > analog sistemler": "analog-intercom",
  "akıllı ev - otomasyon > access kontrol > parmak izi okuyucu": "biyometrik-okuyucu",

  // --- Mobil ürünler alt kırılımları ---
  "mobil ürünler > mobil dvr": "dvr",
  "mobil ürünler > mobil ip kamera": "ip-kameralar",
  "mobil ürünler > mobil kamera": "analog-kameralar",
  "mobil ürünler > mobil monitör": "monitor",
  "mobil ürünler > mobil nvr": "nvr",

  // --- Ex-Proof alt kırılımları ---
  "ex-proof ve anti korozyon > ex-proof muhafaza": "ex-proof-ve-anti-korozyon",
  "ex-proof ve anti korozyon > kameralar": "ex-proof-ve-anti-korozyon",
  "ex-proof ve anti korozyon > aksesuarlar": "ex-proof-ve-anti-korozyon",
  "ex-proof ve anti korozyon > dvr": "ex-proof-ve-anti-korozyon",
  "ex-proof ve anti korozyon > kablolar": "ex-proof-ve-anti-korozyon",
  "ex-proof ve anti korozyon > mönitörler": "monitor",
  "ex-proof ve anti korozyon > panel": "ex-proof-ve-anti-korozyon",

  // --- EATON Yangın alt kırılımları ---
  "eaton yangin > yangın panelleri": "yangin-paneli",
  "eaton yangin > dedektörler": "dedektor",
  "eaton yangin > modüller": "eaton-yangin",
  "eaton yangin > sirenler": "yangin-sireni",
  "eaton yangin > üniteler": "eaton-yangin",

  // --- Aksesuarlar alt kırılımları ---
  "aksesuarlar > poe switchler": "poe-switch",
  "aksesuarlar > poe switchler > epoe switchler": "poe-switch",
  "aksesuarlar > poe switchler > masaüstü poe switch": "poe-switch",
  "aksesuarlar > kamera aksesuarları": "cctv-aksesuarlari",
  "aksesuarlar > kamera aksesuarları > bağlantı adaptörleri": "kamera-aksesuarlari",
  "aksesuarlar > kamera aksesuarları > bağlantı kutuları": "kamera-aksesuarlari",
  "aksesuarlar > kamera aksesuarları > duvara montaj braketleri": "kamera-aksesuarlari",
  "aksesuarlar > megapiksel lensler": "cctv-aksesuarlari",
  "aksesuarlar > analog lensler": "cctv-aksesuarlari",
  "aksesuarlar > switchler": "switch",
  "aksesuarlar > transmisyon": "transmisyon",
  "aksesuarlar > access switchler": "access-switchler",
  "aksesuarlar > topla ma switchleri": "switch",
  "aksesuarlar > kablolama": "cctv-aksesuarlari",
  "aksesuarlar > mikrofonlar": "cctv-aksesuarlari",
  "aksesuarlar > video sinyal çözüm üniteleri": "cctv-aksesuarlari",
  "aksesuarlar > distribütör ve yükselticiler": "cctv-aksesuarlari",
  "aksesuarlar > haraket üniteleri": "cctv-aksesuarlari",
  "aksesuarlar > ayaklar ve muhafazalar": "cctv-aksesuarlari",
  "aksesuarlar > keyboardlar": "cctv-aksesuarlari",

  // --- Monitör ve Videowall ---
  "monitör ve videowall > cctv monitörler > 4k serisi": "monitor",
  "monitör ve videowall > cctv monitörler > 21.5\" - 23.6\"": "monitor",
  "monitör ve videowall > cctv monitörler > 43''": "monitor",
  "monitör ve videowall > cctv monitörler > 55\"": "monitor",

  // --- Trafik çözümleri ---
  "trafik çözümleri > trafik akışı analiz kamerası": "trafik-kamerasi",
  "trafik çözümleri > trafik dsp kameraları": "trafik-kamerasi",
  "trafik çözümleri > aksesuarlar": "trafik-cozumleri",
  "trafik çözümleri > lambalar": "trafik-cozumleri",

  // --- Görüntüleme ve Kontrol ---
  "görüntüleme ve kontrol > lcd videowall": "monitor-ve-videowall",
  "görüntüleme ve kontrol > monitörler": "monitor",
  "görüntüleme ve kontrol > monitörler > commercial serisi": "monitor",
  "görüntüleme ve kontrol > monitörler > light serisi": "monitor",

  // --- DAHUA alt kırılımları ---
  "dahua > ip ürünler > ip kamera > lite serisi": "ip-kameralar",
  "dahua > ip ürünler > ip kamera > pro serisi": "ip-kameralar",
  "dahua > ip ürünler > ip kamera > wizsense": "ip-kameralar",
  "dahua > ip ürünler > ip kamera > wizmind": "ip-kameralar",
  "dahua > ip ürünler > ip kayıt cihazı > lite nvr": "kayit-cihazlari",
  "dahua > ip ürünler > ip kayıt cihazı > pro nvr": "kayit-cihazlari",
  "dahua > ip ürünler > ip ptz kamera": "ip-ptz-kamera",
  "dahua > hdcvi ürünler > hdcvi kamera": "analog-kameralar",
  "dahua > hdcvi ürünler > hdcvi kayıt cihazı": "dvr",
  "dahua > hdcvi ürünler > hdcvi ptz kamera": "analog-kameralar",
  "dahua > mobil ürünler": "mobil-urunler",
  "dahua > monitör ve videowall": "monitor-ve-videowall",
  "dahua > trafik çözümleri": "trafik-cozumleri",
  "dahua > lazer - termal ürünler > lazer kamera": "termal-kameralar",
  "dahua > akıllı ev - otomasyon": "akilli-ev-otomasyon",
  "dahua > akıllı ev - otomasyon > access kontrol": "gecis-kontrol",

  // --- Fiber Optik alt kırılımları ---
  "fiber optik sistemler > fiber patch kablolar": "fiber-patch-cord",
  "fiber optik sistemler > fiber bağlantı aparatları": "fiber-panel-aksesuar",
  "fiber optik sistemler > media dönüştürücüler": "media-converter",
  "fiber optik sistemler > pigtailler ve uç aparatı": "fiber-panel-aksesuar",
  "fiber optik sistemler > rack tipi terminal kutuları": "fiber-panel-aksesuar",
  "fiber optik sistemler > test cihazları": "fiber-optik-sistemler",
  "fiber optik sistemler > duvar tipi ve yeraltı kutuları": "fiber-panel-aksesuar",

  // --- Diğer Ürünler alt kırılımları ---
  "diğer ürünler > analog dvr": "dvr",
  "diğer ürünler > analog kamera": "analog-kameralar",
  "diğer ürünler > seri sonu ip kamera": "ip-kameralar",
  "diğer ürünler > seri sonu nvr": "kayit-cihazlari",
  "diğer ürünler > webserverlar": "cctv-aksesuarlari",

  // --- Alarm alt kırılımları (DAHUA > Diğer Ürünler > Alarm) ---
  "diğer ürünler > alarm ve otomasyon > dedektörler": "dedektor",
  "diğer ürünler > alarm ve otomasyon > sirenler": "yangin-sireni",
  "diğer ürünler > alarm ve otomasyon > manyetik kontaklar": "hirsiz-alarm",
  "diğer ürünler > alarm ve otomasyon > butonlar-aküler-trafolar": "alarm-paneli",
  "diğer ürünler > alarm ve otomasyon > beam dedektörler": "dedektor",
}

// Son segment bazlı fallback mapping (full path eşleşmezse)
const OKISAN_SEGMENT_MAP: Record<string, string> = {
  // --- Ana kategoriler ---
  "ip ürünler": "guvenlik-cctv",
  "hdcvi ürünler": "guvenlik-cctv",
  "hdcvi kamera": "analog-kameralar",
  "akıllı ev - otomasyon": "akilli-ev-otomasyon",
  "mobil ürünler": "guvenlik-cctv",
  "ex-proof ve anti korozyon": "ex-proof-ve-anti-korozyon",
  "monitör ve videowall": "monitor-ve-videowall",
  "görüntüleme ve kontrol": "goruntuleme-ve-kontrol",
  "trafik çözümleri": "trafik-cozumleri",
  "lazer - termal ürünler": "termal-kameralar",
  "hikvision": "hikvision",
  "eaton yangin": "eaton-yangin",
  "cnb": "cnb",
  "dahua": "dahua",
  "tiandy": "tiandy",
  "covid-19 tespit ürünleri": "covid-19-tespit-urunleri",

  // --- Megapixel çözünürlükler → Geçiş Kontrol & Alarm altı ---
  "2 megapixel": "2-megapixel",
  "3 megapiksel": "3-megapiksel",
  "4 megapixel": "4-megapixel",
  "5 megapixel": "5-megapixel",
  "8 megapixel": "8-megapixel",
  "12 megapixel": "12-megapixel",
  "4k serisi": "4k-serisi",

  // --- Ağ & Network ---
  "fiber optik sistemler": "fiber-optik-sistemler",
  "transmisyon": "transmisyon",
  "access switchler": "access-switchler",

  // --- Kablo & Aksesuar ---
  "aksesuarlar": "aksesuarlar",

  // --- Çevre Birimleri ---
  "vth": "monitorlu-ic-unite",
  "açık istasyon": "kapi-istasyonu",

  // --- Diğer ---
  "diğer ürünler": "diger-urunler",
  "yeni ürünler": "diger-urunler",
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

function parseCategoryPaths(raw: string): Array<{ categoryName: string; fullPath: string }> {
  if (!raw || !raw.trim()) return []

  // Pipe ile böl, her segmenti ayrı bir path olarak değerlendir
  // "DAHUA>IP Ürünler|DAHUA>IP Ürünler>IP Kamera|..." → 4 ayrı path
  const pipeParts = raw.split("|").map((p) => p.trim()).filter(Boolean)

  const paths: Array<{ categoryName: string; fullPath: string }> = []

  for (const part of pipeParts) {
    const segments = part.split(">").map((s) => s.trim()).filter(Boolean)
    if (segments.length === 0) continue

    const categoryName = segments[segments.length - 1]
    const fullPath = segments.join(" > ")
    paths.push({ categoryName, fullPath })
  }

  // En spesifikten (en uzun) en genele doğru sırala
  paths.sort((a, b) => b.fullPath.length - a.fullPath.length)

  return paths
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

      const categoryParsed = parseCategoryPaths(categoryRaw)
      if (categoryParsed.length === 0) {
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

      // 2. Category eşleştir (YENİ KATEGORİ AÇILMAZ)
      // Tüm pipe segmentlerini en spesifikten genele dene:
      // 2a. Her path → OKISAN_FULLPATH_MAP
      // 2b. Her path son segment → OKISAN_SEGMENT_MAP
      // 2c. Her path son segment → DB'de isimle ara (case-insensitive)
      // 2d. Hiçbiri → "diger-urunler" fallback
      const categoryPaths = parseCategoryPaths(categoryRaw)
      let categoryId: string | undefined
      let cat = null

      for (const { categoryName, fullPath } of categoryPaths) {
        const fullKey = fullPath.toLowerCase().trim()
        const segKey = categoryName.toLowerCase().trim()

        // FULLPATH_MAP ile dene
        const fullSlug = OKISAN_FULLPATH_MAP[fullKey]
        if (fullSlug) {
          cat = await prisma.category.findFirst({ where: { slug: fullSlug, deletedAt: null } })
          if (cat) break
        }

        // SEGMENT_MAP ile dene
        const segSlug = OKISAN_SEGMENT_MAP[segKey]
        if (segSlug) {
          cat = await prisma.category.findFirst({ where: { slug: segSlug, deletedAt: null } })
          if (cat) break
        }

        // DB'de isimle ara
        cat = await prisma.category.findFirst({
          where: { name: { equals: categoryName, mode: "insensitive" }, deletedAt: null },
        })
        if (cat) break
      }

      // Hâlâ yoksa → "Diğer Ürünler" fallback
      if (!cat) {
        cat = await prisma.category.findFirst({
          where: { slug: "diger-urunler", deletedAt: null },
        })
      }

      categoryId = cat?.id ?? undefined

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

      // _supplierCategory: category alanındaki son pipe segmentinin son ">" parçası
      const lastPipeSegment = categoryRaw
        ? categoryRaw.split("|").pop()?.trim() ?? ""
        : ""
      const supplierCategory = lastPipeSegment
        ? lastPipeSegment.split(">").pop()?.trim() || undefined
        : undefined

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
