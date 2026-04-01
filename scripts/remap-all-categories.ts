/**
 * Remap All Supplier Products to New Categories
 *
 * Seed sonrası tüm supplier_products'ı yeni kategori ağacına eşleştirir.
 * Eşleşmeyenler için otomatik kategori oluşturur.
 * Tamamen pg tabanlı — PrismaClient gerektirmez.
 *
 * Desteklenen tedarikçi formatları:
 *   INDEXGRUP/NETEX: raw_data->>'_supplierCategory' ("Category > Group")
 *   b2bdepo:         raw_data->>'ustKategoriAdi' > 'altKategoriAdi' > 'enAltKategoriAdi'
 *   okisan:          raw_data->>'category' (pipe | separated, > hierarchy)
 *   bizimhesap:      raw_data->>'category' (simple: "CCTV", "HİZMET")
 *   ergen:           raw_data->>'category' (çoğu null)
 *
 * Kullanım:
 *   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nextai \
 *     npx tsx scripts/remap-all-categories.ts [--dry-run] [--supplier INDEXGRUP]
 */

import "dotenv/config"
import { Pool } from "pg"

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/nextai"

const pool = new Pool({ connectionString: DATABASE_URL })

// CLI args
const args = process.argv.slice(2)
const DRY_RUN = args.includes("--dry-run")
const SUPPLIER_FILTER = args.includes("--supplier")
  ? args[args.indexOf("--supplier") + 1]
  : null

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CachedCategory {
  id: string
  name: string
  slug: string
  path: string
  parentId: string | null
  depth: number
}

interface CategorySource {
  /** Benzersiz kategori yolu (map key olarak kullanılır) */
  key: string
  /** Eşleştirme için aranacak metin */
  searchText: string
  /** Kaç ürün bu kategoride */
  count: number
}

// ---------------------------------------------------------------------------
// Ana kategori → keyword eşleştirme
// ---------------------------------------------------------------------------

const ROOT_KEYWORDS: Record<string, string[]> = {
  cctv: ["kamera", "cctv", "dvr", "nvr", "xvr", "hdcr", "ahd", "analog", "termal", "lpr", "plaka", "ptz", "fisheye", "bullet", "dome", "turret", "kayit cihaz", "video surve", "lens", "hard disk", "hdd", "ip kamera", "ip urun", " hdcvi ", "akilli ev", "video intercom", "mobıl", "mobil dvr", "mobil kamera", "ex-proof"],
  "bilgisayar-sunucu": ["bilgisayar", "notebook", "laptop", "masaüstü", "sunucu", "server", "tablet", "all-in-one", "mini pc", "barebone", "tower pc", "chromebook", "gaming notebook", "iş istasyonu", "aıo", "rak sunucu", "nas", "depolama sunucusu", "taşınabilir bilgisayar", "iş istasyon", "aio"],
  "pc-bilesenleri": ["bileşen", "işlemci", "anakart", "bellek", "ram", "ekran kartı", "kasa", "güç kaynağı", "psu", "soğutma", "ssd", "hdd", "nvme", "depolama", "disk", "genişleme", "bellekler", "harddisk", "bilgisayar kasa"],
  "network-fiber": ["ağ", "network", "switch", "router", "fiber", "kablosuz", "access point", "patch", "sfp", "rj45", "cat5", "cat6", "media converter", "kabin", "firewall", "vpn", "poe", "endüstriyel switch", "ucs server", "ethernet", "anahtar", "yönlendirici", "video konferans", "kabinet", "ap ", "servis paketi", "modem", "fiber optic", "patch panel", "network sarf", "ağ iletişim"],
  "yazici-tarayici": ["yazıcı", "tarayıcı", "printer", "scanner", "lazer", "mürekkep", "toner", "kartuş", "drum", "projeksiyon", "baskı", "sarfiyat", "barkod yazici", "inkjet", "lazer yazici"],
  "gecis-kontrol-alarm": ["geçiş", "kontrol", "alarm", "hırsız", "yangın", "turnike", "bariyer", "kart okuyucu", "biyometrik", "parmak izi", "yüz tanıma", "interkom", "kilit", "dedektör", "siren", "pır", "manyetik", "duman", "otopark", "kapı", "barkod okuyucu", "barkod sarf", "barkod", "pdks", "alarm sistem", "intercom", "biyometrik sistem"],
  "guc-elektronigi": ["güç", "ups", "regülatör", "adaptör", "şarj", "pil", "akü", "güneş", "solar", "voltaj", "powerbank", "kesintisiz", "invertör", "kgk", "online ups", "line interactive", "elektrik aksesuar"],
  "kablo-aksesuar": ["kablo", "hdmi", "displayport", "usb", "vga", "dvi", "dönüştürücü", "kvm", "splitter", "hub", "dongle", "converter", "priz", "uzatma", "iec", "kablolama", "jack", "konnektör", "patch cord", "patch panel", "yeraltı", "cep telefonu", "çevirici", "çoklayıcı"],
  "cevre-birimleri-aksesuar": ["çevre birim", "klavye", "mouse", "kulaklık", "webcam", "hoparlör", "stand", "soundbar", "mikrofon", "monitör apar", "notebook çanta", "dock", "akıllı ev", "akıllı priz", "akıllı ampul", "çevre birim", "klavye & mouse", "monitör & aksesuar"],
  "yazilim-lisans": ["yazılım", "lisans", "windows", "office", "antivirüs", "vms", "grafik", "autocad", "adobe", "linux", "işletim", "yedekleme", "antivirüs yazilim", "ofis yazilim", "sunucu lisans"],
  "pos-barkod": ["pos", "barkod", "para kasası", "fiş yazıcı", "müşteri ekranı", "ödeme terminali", "datakart", "mobil pos", "tablet pos", "termal", "ot/vt barkod", "barkod okuyucu", "pos terminal", "el terminali", "barkod yazici", "termal fis"],
  "akilli-sistemler": ["akıllı", "iot", "nesne tanıma", "hareket analizi", "insan sayma", "sensör", "görüntü analizi", "plaka tanıma", "yüz tanıma terminal", "görüntü işleme", "hava durumu", "görüntü işleme"],
}

// ---------------------------------------------------------------------------
// Slug & normalize helpers
// ---------------------------------------------------------------------------

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    .slice(0, 200)
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()
}

// ---------------------------------------------------------------------------
// Per-supplier category extraction
// ---------------------------------------------------------------------------

/**
 * Her tedarikçi için raw_data'dan kategori bilgisi çıkar.
 * SQL sorgusunda CASE ile tedarikçi bazlı extract yapar.
 */
function getSupplierCategoryQuery(supplierCode: string): string {
  const code = supplierCode.toUpperCase()

  switch (code) {
    case "INDEXGRUP":
    case "NETEX":
      // _supplierCategory alanı zaten "Category > Group" formatında
      return `raw_data->>'_supplierCategory'`

    case "B2BDEPO":
      // ustKategoriAdi > altKategoriAdi > enAltKategoriAdi
      return `CASE
        WHEN raw_data->>'altKategoriAdi' IS NOT NULL AND raw_data->>'altKategoriAdi' != ''
        THEN CONCAT_WS(' > ',
          raw_data->>'ustKategoriAdi',
          raw_data->>'altKategoriAdi',
          NULLIF(raw_data->>'enAltKategoriAdi', '')
        )
        ELSE raw_data->>'ustKategoriAdi'
      END`

    case "OKISAN":
      // category alanı: "Fiber Optik Sistemler|Fiber Optik Sistemler>Fiber Patch Kablolar"
      // İlk pipe'dan önceki kısım = ana kategori, son > sonrası = alt kategori
      return `CASE
        WHEN raw_data->>'category' IS NOT NULL AND raw_data->>'category' != ''
        THEN raw_data->>'category'
        ELSE NULL
      END`

    case "BIZIMHESAP":
      // category alanı basit: "CCTV", "HİZMET" vs.
      return `raw_data->>'category'`

    case "ERGEN":
      // category alanı çoğunlukla null
      return `raw_data->>'category'`

    default:
      // Genel: önce _supplierCategory, sonra category dene
      return `COALESCE(raw_data->>'_supplierCategory', raw_data->>'category')`
  }
}

/**
 * Okisan category string'ini parse et.
 * Format: "Brand|Brand>Category>SubCategory|Yeni Ürünler"
 * En anlamlı kategori yolunu çıkar.
 */
function parseOkisanCategory(raw: string): string {
  if (!raw) return ""

  // Pipe ile parçala, birden fazla kategori yolu olabilir
  const paths = raw.split("|").map((p) => p.trim()).filter(Boolean)

  // En uzun ve en anlamlı yolu seç (marka adı olmayan, > içeren)
  let bestPath = ""
  let bestScore = 0

  for (const path of paths) {
    const segments = path.split(">").map((s) => s.trim()).filter(Boolean)
    if (segments.length === 0) continue

    // İlk segment marka adı olabilir (DAHUA, TIANDY, vb.) — atla
    const brandPrefixes = ["DAHUA", "TIANDY", "CNB", "HIKVISION", "EATON", "EATON YANGIN", "VTH"]
    const startIdx = brandPrefixes.includes(segments[0]?.toUpperCase() ?? "") ? 1 : 0
    const meaningful = segments.slice(startIdx)

    if (meaningful.length === 0) continue

    // "Yeni Ürünler" gibi generic segmentleri atla
    const filtered = meaningful.filter((s) =>
      !["Yeni Ürünler", "Yeni ürünler"].includes(s)
    )

    if (filtered.length === 0) continue

    const score = filtered.join(" ").length
    if (score > bestScore) {
      bestScore = score
      bestPath = filtered.join(" > ")
    }
  }

  return bestPath || paths[0] || ""
}

/**
 * Ham kategori string'ini tedarikçi koduna göre normalize et.
 * Eşleştirme için aranacak metin döndürür.
 */
function normalizeCategory(supplierCode: string, raw: string): string {
  if (!raw) return ""

  const code = supplierCode.toUpperCase()

  switch (code) {
    case "OKISAN":
      return parseOkisanCategory(raw)

    case "BIZIMHESAP":
      // Basit kategori adları: "CCTV" → "CCTV", "HİZMET" → yoksay
      if (["HİZMET", "HIZMET", "KURULUM"].some((h) => raw.toUpperCase().includes(h))) {
        return ""
      }
      return raw

    case "ERGEN":
      // Çoğu null, varsa direkt kullan
      return raw

    default:
      // INDEXGRUP, NETEX, B2BDEPO zaten "Cat > Group" formatında
      return raw
  }
}

// ---------------------------------------------------------------------------
// CategoryMatcher (inline, no PrismaClient)
// ---------------------------------------------------------------------------

class InlineCategoryMatcher {
  private cache = new Map<string, CachedCategory>()
  private roots: CachedCategory[] = []
  private autoCreateCount = 0

  async init() {
    const { rows } = await pool.query(
      `SELECT id, name, slug, path, parent_id as "parentId", depth
       FROM categories WHERE deleted_at IS NULL AND is_active = true`
    )

    for (const cat of rows) {
      const c: CachedCategory = { ...cat, path: cat.path ?? "" }
      this.cache.set(c.slug, c)
      this.cache.set(c.name.toLowerCase(), c)
      if (c.depth === 0) this.roots.push(c)
    }

    console.log(`✅ ${rows.length} kategori cache'e yüklendi (${this.roots.length} root)`)
  }

  /**
   * Tedarikçi kategorisini bizim kategoriye eşleştir
   */
  async match(supplierCode: string, supplierCategory: string): Promise<string | null> {
    if (!supplierCategory) return null

    // Parse: "Category > Group" veya direkt "Category"
    const parts = supplierCategory.split(" > ").map((s) => s.trim())
    const category = parts[0] ?? ""
    const group = parts.slice(1).join(" ").trim() || (parts[parts.length - 1] ?? "")
    const combined = parts.join(" ").trim()

    // 1. Slug bazlı tam eşleşme
    for (const searchStr of [combined, `${category} ${group}`.trim(), group || category]) {
      const directSlug = generateSlug(searchStr)
      const directCat = this.cache.get(directSlug)
      if (directCat) return directCat.id
    }

    // 2. İsim bazlı tam eşleşme
    for (const searchStr of [combined, `${category} ${group}`.trim(), group, category]) {
      if (!searchStr) continue
      const normal = normalize(searchStr)
      const nameMatch = this.cache.get(normal)
      if (nameMatch) return nameMatch.id
    }

    // 3. Keyword bazlı kısmi eşleşme (en yüksek skorluyu bul)
    const normalCombined = normalize(combined)
    const keywords = normalCombined.split(/\s+/).filter((w) => w.length > 2)
    let bestMatch: { id: string; name: string; score: number } | null = null

    for (const keyword of keywords) {
      for (const [key, cat] of this.cache.entries()) {
        if (key.includes(keyword) || cat.name.toLowerCase().includes(keyword) || cat.slug.includes(keyword)) {
          const score = keyword.length
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { id: cat.id, name: cat.name, score }
          }
        }
      }
    }

    if (bestMatch && bestMatch.score >= 4) {
      return bestMatch.id
    }

    // 4. Eşleşme bulunamadı → otomatik kategori oluştur
    return this.autoCreate(category, group || "")
  }

  /**
   * En uygun ana kategoriyi bul
   */
  private findBestParent(searchText: string): CachedCategory | null {
    const normalized = normalize(searchText)
    let bestMatch: CachedCategory | null = null
    let bestScore = 0

    for (const [rootSlug, keywords] of Object.entries(ROOT_KEYWORDS)) {
      let score = 0
      for (const keyword of keywords) {
        if (normalized.includes(keyword)) {
          score += keyword.length
        }
      }
      if (score > bestScore) {
        bestScore = score
        bestMatch = this.cache.get(rootSlug) ?? null
      }
    }

    return bestMatch
  }

  /**
   * Alt kategoriyi parent altında oluştur
   */
  private async autoCreate(category: string, group: string): Promise<string | null> {
    const searchText = `${category} ${group}`.trim()
    const parent = this.findBestParent(searchText)

    if (!parent) {
      // SAFETY: parent bulunamadıysa root kategori oluşturma — sadece seed script yapabilir
      console.warn(`  ⚠️  Ana kategori bulunamadı, root kategori oluşturulmayacak: "${searchText}"`)
      return null
    }

    const childName = (group || category).trim()
    if (!childName) return null

    const childSlug = `${parent.slug}-${generateSlug(childName)}`

    // Zaten var mı?
    const existing = this.cache.get(childSlug)
    if (existing) return existing.id

    const existingByName = this.cache.get(childName.toLowerCase())
    if (existingByName && existingByName.parentId === parent.id) return existingByName.id

    const parentPath = parent.path ? `${parent.path}/${parent.slug}` : parent.slug
    const newPath = `${parentPath}/${childSlug}`
    const newDepth = parent.depth + 1

    // SAFETY: depth=0 root kategoriler asla otomatik oluşturulmamalı
    if (newDepth === 0) {
      console.warn(`  ⛔ Root kategori (depth=0) oluşturma engellendi: "${childName}" — yalnızca seed script root kategori ekleyebilir`)
      return null
    }

    if (DRY_RUN) {
      console.log(`  🆕 [DRY] Yeni: "${childName}" → ${parent.name} (depth=${newDepth})`)
      return null
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO categories (id, name, slug, parent_id, depth, path, is_active, sort_order, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, 999, NOW(), NOW())
         RETURNING id, name, slug, path, parent_id as "parentId", depth`,
        [childName, childSlug, parent.id, newDepth, newPath]
      )

      const newCat: CachedCategory = {
        id: rows[0].id,
        name: rows[0].name,
        slug: rows[0].slug,
        path: rows[0].path ?? "",
        parentId: rows[0].parentId,
        depth: rows[0].depth,
      }

      this.cache.set(newCat.slug, newCat)
      this.cache.set(newCat.name.toLowerCase(), newCat)
      this.autoCreateCount++

      console.log(`  ✨ Yeni: "${childName}" → ${parent.name} altında (depth=${newDepth})`)
      return newCat.id
    } catch (err) {
      console.error(`  ❌ Oluşturma hatası: "${childName}"`, err instanceof Error ? err.message : err)
      return null
    }
  }

  getAutoCreateCount() { return this.autoCreateCount }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Tüm Tedarikçi Ürünlerini Yeniden Eşleştir ===\n")
  if (DRY_RUN) console.log("[DRY RUN] Hiçbir şey kaydedilmeyecek\n")
  if (SUPPLIER_FILTER) console.log(`Yalnızca: ${SUPPLIER_FILTER}\n`)

  const matcher = new InlineCategoryMatcher()
  await matcher.init()

  // Tedarikçileri al
  const { rows: suppliers } = await pool.query(
    SUPPLIER_FILTER
      ? `SELECT id, code FROM suppliers WHERE code ILIKE $1 AND deleted_at IS NULL`
      : `SELECT id, code FROM suppliers WHERE deleted_at IS NULL ORDER BY code`,
    SUPPLIER_FILTER ? [SUPPLIER_FILTER] : []
  )

  console.log(`Tedarikçiler: ${suppliers.map((s) => s.code).join(", ")}\n`)

  const stats = { total: 0, mapped: 0, failed: 0, productsUpdated: 0, skipped: 0 }

  for (const supplier of suppliers) {
    console.log(`\n--- ${supplier.code} ---`)

    const catExpr = getSupplierCategoryQuery(supplier.code)

    // Benzersiz kategorileri al
    const { rows: cats } = await pool.query(
      `SELECT ${catExpr} as category, COUNT(*) as cnt
       FROM supplier_products
       WHERE supplier_id = $1 AND deleted_at IS NULL
         AND ${catExpr} IS NOT NULL
       GROUP BY ${catExpr}
       ORDER BY COUNT(*) DESC`,
      [supplier.id]
    )

    console.log(`  ${cats.length} benzersiz kategori`)

    // Her kategoriyi normalize et ve eşleştir
    const categoryMap = new Map<string, string | null>()

    for (const cat of cats) {
      const rawCategory = cat.category ?? ""
      const normalizedCat = normalizeCategory(supplier.code, rawCategory)
      stats.total++

      // Boş kategori atla
      if (!normalizedCat) {
        stats.skipped++
        continue
      }

      const categoryId = await matcher.match(supplier.code.toLowerCase(), normalizedCat)

      if (categoryId) {
        // raw (orijinal) kategori → ID mapping
        categoryMap.set(rawCategory, categoryId)
        stats.mapped++
      } else {
        stats.failed++
        console.warn(`  ⚠️  "${rawCategory}" → "${normalizedCat}" (${cat.cnt} ürün)`)
      }
    }

    // supplier_products'ı güncelle
    if (!DRY_RUN && categoryMap.size > 0) {
      console.log(`  Güncelleniyor...`)
      let updated = 0
      const BATCH = 200
      let offset = 0

      while (true) {
        const { rows } = await pool.query(
          `SELECT id, ${catExpr} as category
           FROM supplier_products
           WHERE supplier_id = $1 AND deleted_at IS NULL
           ORDER BY id LIMIT $2 OFFSET $3`,
          [supplier.id, BATCH, offset]
        )
        if (rows.length === 0) break
        offset += BATCH

        for (const row of rows) {
          const categoryId = categoryMap.get(row.category ?? "")
          if (!categoryId) continue

          await pool.query(
            `UPDATE supplier_products
             SET raw_data = COALESCE(raw_data, '{}'::jsonb)
               || jsonb_build_object('_mappedCategoryId', $1::text),
                 updated_at = NOW()
             WHERE id = $2`,
            [categoryId, row.id]
          )
          updated++
        }
      }

      stats.productsUpdated += updated
      console.log(`  ✅ ${updated} supplier_product güncellendi`)
    }
  }

  console.log(`\n=== ÖZET ===`)
  console.log(`Benzersiz kategori: ${stats.total}`)
  console.log(`Eşleşen: ${stats.mapped}`)
  console.log(`Atlanan (boş/hizmet): ${stats.skipped}`)
  console.log(`Otomatik oluşturulan: ${matcher.getAutoCreateCount()}`)
  console.log(`Eşleşmeyen: ${stats.failed}`)
  console.log(`Güncellenen ürün: ${stats.productsUpdated}`)

  if (DRY_RUN) console.log(`\n[DRY RUN] Hiçbir değişiklik yapılmadı`)

  await pool.end()
}

main().catch((err) => {
  console.error("Kritik hata:", err)
  pool.end()
  process.exit(1)
})
