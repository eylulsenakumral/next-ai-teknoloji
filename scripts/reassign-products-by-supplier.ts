/**
 * Tedarikci Bazli Kategori Yeniden Eslestirme Scripti
 *
 * Her tedarikcinin supplierProduct.rawData alanindaki kategori bilgisini kullanarak
 * urunleri dogru kategorilere tasir.
 *
 * Kullanim:
 *   npx tsx scripts/reassign-products-by-supplier.ts                    ← dry-run (varsayilan)
 *   npx tsx scripts/reassign-products-by-supplier.ts --execute             ← gercek calistirma
 *   npx tsx scripts/reassign-products-by-supplier.ts --supplier INDEXGRUP  ← sadece bir tedarikci
 *   npx tsx scripts/reassign-products-by-supplier.ts --supplier NETEX --execute
 *
 * Eşleştirme tablosu: data/supplier-category-mapping.json
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import fs from "fs"
import path from "path"

// ============================================================================
// DB BAĞLANTISI (proje standardi)
// ============================================================================

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ============================================================================
// CLI BAYRAKLARI
// ============================================================================

const EXECUTE = process.argv.includes("--execute")
const DRY_RUN = !EXECUTE

const args = process.argv.slice(2)
const SUPPLIER_FILTER = args.includes("--supplier")
  ? args[args.indexOf("--supplier") + 1]
  : null

// ============================================================================
// TİPLER
// ============================================================================

interface KategoriKayit {
  id: string
  parentId: string | null
  name: string
  slug: string
  depth: number
  path: string | null
  isActive: boolean
}

interface SupplierConfig {
  _field: string
  _separator: string | null
  _description?: string
  _useMappedId?: boolean
  [key: string]: string | boolean | undefined | null
}

interface TedarikciEslesme {
  supplierKey: string
  supplierCategory: string
  hedefSlug: string
  hedefCategoryId: string | null
  hedefCategoryName: string
  hedefCategoryPath: string
  productIds: string[]
  productCount: number
}

// ============================================================================
// YARDIMCI FONKSİYONLAR
// ============================================================================

function slugToLeafCategory(
  slug: string,
  slugMap: Map<string, KategoriKayit>,
): KategoriKayit | null {
  // Tam slug'dan basla, en spesifik olanı bul
  const cat = slugMap.get(slug)
  if (cat && cat.isActive) return cat

  // En son segment'i silerek ust kategorileri dene
  const parts = slug.split("-")
  while (parts.length > 1) {
    parts.pop()
    const parentSlug = parts.join("-")
    const parent = slugMap.get(parentSlug)
    if (parent && parent.isActive) return parent
  }

  return null
}

function resolveCategoryId(
  targetSlug: string,
  slugMap: Map<string, KategoriKayit>,
): { id: string; name: string; path: string } | null {
  const cat = slugToLeafCategory(targetSlug, slugMap)
  if (!cat) return null
  return {
    id: cat.id,
    name: cat.name,
    path: cat.path ?? cat.slug,
  }
}

/**
 * okisan icin prefix match: category string'inin icinde mapping key'i gecen ilk eslestirmeyi bulur
 */
function matchOkisanCategory(
  rawCategory: string,
  mappings: Record<string, string>,
): string | null {
  // En uzun match'i onceliklendir (en spesifik)
  const keys = Object.keys(mappings).sort((a, b) => b.length - a.length)

  for (const key of keys) {
    if (rawCategory.includes(key)) {
      return mappings[key]
    }
  }

  // Marka prefix'i kontrol et (DAHUA, TIANDY, CNB, EATON YANGIN, etc.)
  const brands = ["DAHUA", "TIANDY", "CNB", "Hikvision", "EATON YANGIN", "IP Ürünler", "HDCVI Ürünler", "Aksesuarlar", "Fiber Optik Sistemler", "Ex-Proof", "COVID-19", "Diğer Ürünler", "Yönetim Merkezi"]

  for (const brand of brands) {
    if (rawCategory.startsWith(brand)) {
      // Marka bazli genel eslestirme
      if (brand === "DAHUA" || brand === "TIANDY" || brand === "CNB" || brand === "Hikvision") return "cctv"
      if (brand === "EATON YANGIN") return "gecis-kontrol-alarm-yangin-alarm"
      if (brand === "Ex-Proof") return "cctv"
      if (brand === "COVID-19") return "akilli-sistemler-yuz-tanima"
    }
  }

  return null
}

/**
 * b2bdepo icin hierarchical match: en spesifikten en genele dogru eslestirmeyi bulur
 */
function matchB2bdepoCategory(
  ustKategori: string | null,
  altKategori: string | null,
  enAltKategori: string | null,
  mappings: Record<string, string>,
): string | null {
  if (!ustKategori) return null

  // En spesifkten basla
  const full = [ustKategori, altKategori, enAltKategori].filter(Boolean).join(" > ")
  if (mappings[full]) return mappings[full]

  const mid = [ustKategori, altKategori].filter(Boolean).join(" > ")
  if (altKategori && mappings[mid]) return mappings[mid]

  const top = ustKategori
  if (mappings[top]) return mappings[top]

  return null
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const baslangic = Date.now()

  console.log("=".repeat(70))
  console.log("  TEDARİKÇİ BAZLI KATEGORİ YENİDEN EŞLEŞTİRME")
  console.log("=".repeat(70))
  console.log(`  Mod: ${DRY_RUN ? "DRY-RUN (değişiklik YOK)" : "GERÇEK ÇALIŞTIRMA"}`)
  if (SUPPLIER_FILTER) console.log(`  Tedarikçi filtresi: ${SUPPLIER_FILTER}`)
  console.log("=".repeat(70))
  console.log()

  // --------------------------------------------------------------------------
  // FAZE 1: Eşleştirme tablosunu yükle
  // --------------------------------------------------------------------------
  console.log("[FAZE 1] Eşleştirme tablosu yükleniyor...")

  const mappingPath = path.join(__dirname, "..", "data", "supplier-category-mapping.json")
  if (!fs.existsSync(mappingPath)) {
    console.error(`  HATA: ${mappingPath} dosyası bulunamadı.`)
    console.error("  Önce data/supplier-category-mapping.json dosyasını oluşturun.")
    await prisma.$disconnect()
    await pool.end()
    process.exit(1)
  }

  const mappingData = JSON.parse(fs.readFileSync(mappingPath, "utf-8"))
  const supplierMappings = mappingData as Record<string, SupplierConfig>

  // Case-insensitive eslestirme: supplier code JSON key'leri ile karsilastir
  const mappingKeysLower = new Map<string, string>()
  for (const key of Object.keys(supplierMappings)) {
    mappingKeysLower.set(key.toLowerCase(), key)
  }

  const aktifTedarikciler = ["INDEXGRUP", "NETEX", "okisan", "ergen", "bizimhesap", "b2bdepo"]
    .filter((s) => mappingKeysLower.has(s.toLowerCase()))

  console.log(`  ${aktifTedarikciler.length} tedarikçi yüklendi: ${aktifTedarikciler.join(", ")}`)
  console.log()

  // --------------------------------------------------------------------------
  // FAZE 2: Tüm kategorileri yükle
  // --------------------------------------------------------------------------
  console.log("[FAZE 2] Kategoriler yükleniyor...")

  const tumKategoriler = await prisma.category.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      parentId: true,
      name: true,
      slug: true,
      depth: true,
      path: true,
      isActive: true,
    },
    orderBy: { depth: "asc" },
  }) as KategoriKayit[]

  const slugMap = new Map<string, KategoriKayit>()
  for (const kat of tumKategoriler) {
    slugMap.set(kat.slug, kat)
  }

  console.log(`  ${tumKategoriler.length} kategori yüklendi (${slugMap.size} slug)`)
  console.log()

  // --------------------------------------------------------------------------
  // FAZE 3: Her tedarikçinin ürünlerini analiz et
  // --------------------------------------------------------------------------
  console.log("[FAZE 3] Tedarikçi ürünleri analiz ediliyor...")
  console.log()

  const tumEslesmeler: TedarikciEslesme[] = []
  const istatistik = {
    toplamUrun: 0,
    eslesmeBulunan: 0,
    eslesmeBulunamayan: 0,
    ayniKategoridekiler: 0,
    gecersizSlug: 0,
    tedarikciBazli: {} as Record<string, { toplam: number; eslesen: number; bulunamayan: number }>,
  }

  const tedarikciFiltre = SUPPLIER_FILTER
    ? [SUPPLIER_FILTER.toUpperCase()]
    : aktifTedarikciler

  for (const supplierCode of tedarikciFiltre) {
    const jsonKey = mappingKeysLower.get(supplierCode.toLowerCase())
    const config = jsonKey ? supplierMappings[jsonKey] : null
    if (!config || !("_field" in config)) {
      console.log(`  UYARI: ${supplierCode} icin eslestirme konfigurasyonu bulunamadi, atlaniyor.`)
      continue
    }

    istatistik.tedarikciBazli[supplierCode] = { toplam: 0, eslesen: 0, bulunamayan: 0 }

    // Tedarikci urunlerini cek
    const supplierWhere: Record<string, unknown> = {
      deletedAt: null,
      product: { is: { deletedAt: null } },
      supplier: { is: { code: supplierCode } },
    }

    const supplierProducts = await prisma.supplierProduct.findMany({
      where: supplierWhere,
      select: {
        id: true,
        productId: true,
        rawData: true,
        product: {
          select: {
            id: true,
            name: true,
            categoryId: true,
          },
        },
      },
    })

    if (supplierProducts.length === 0) {
      console.log(`  ${supplierCode}: 0 ürün (product_id mevcut)`)
      continue
    }

    console.log(`  ${supplierCode}: ${supplierProducts.length} ürün analiz ediliyor...`)

    // Category extraction field
    const field = config._field as string

    // Her urun icin kategori eslestirmesi yap
    const eslesmeMap = new Map<string, TedarikciEslesme>() // hedefCatId -> eslesme
    const eslesmemisler: string[] = []

    for (const sp of supplierProducts) {
      if (!sp.productId || !sp.rawData || typeof sp.rawData !== "object") continue

      const raw = sp.rawData as Record<string, unknown>
      let supplierCategoryKey: string | null = null
      let hedefSlug: string | null = null

      // ---------------------------------------------------------------
      // INDEXGRUP & NETEX: categoryName > groupName
      // ---------------------------------------------------------------
      if (supplierCode === "INDEXGRUP" || supplierCode === "NETEX") {
        const categoryName = (raw["categoryName"] as string) ?? ""
        const groupName = (raw["groupName"] as string) ?? ""
        if (categoryName && groupName) {
          supplierCategoryKey = `${categoryName} > ${groupName}`
        } else if (categoryName) {
          supplierCategoryKey = categoryName
        } else if (groupName) {
          supplierCategoryKey = groupName
        }
        if (supplierCategoryKey) {
          hedefSlug = config[supplierCategoryKey] as string | undefined ?? null
        }
      }

      // ---------------------------------------------------------------
      // okisan: category field (| ile ayrilmis hiyerarsi)
      // ---------------------------------------------------------------
      else if (supplierCode === "okisan") {
        const rawCat = (raw["category"] as string) ?? ""
        if (rawCat) {
          supplierCategoryKey = rawCat
          // Exact match dene
          const exactMatch = config[rawCat]
          if (typeof exactMatch === "string") hedefSlug = exactMatch
          // Yoksa prefix match
          if (!hedefSlug) {
            const okisanMatch = matchOkisanCategory(rawCat, config as Record<string, string>)
            if (okisanMatch) hedefSlug = okisanMatch
          }
        }
      }

      // ---------------------------------------------------------------
      // ergen: _mappedCategoryId direkt kullanilir
      // ---------------------------------------------------------------
      else if (supplierCode === "ergen") {
        const mappedId = (raw["_mappedCategoryId"] as string) ?? ""
        if (mappedId) {
          // Dogrudan mappedCategoryId'yi kullan
          const hedefKat = slugMap.get("") // slug bos oldugu icin dogrudan id'den bul
          const catById = tumKategoriler.find((k) => k.id === mappedId)
          if (catById && catById.isActive) {
            istatistik.tedarikciBazli[supplierCode].toplam++
            istatistik.tedarikciBazli[supplierCode].eslesen++

            // Zaten dogru kategoride mi?
            if (sp.product.categoryId === catById.id) {
              istatistik.ayniKategoridekiler++
            } else {
              const key = catById.id
              if (!eslesmeMap.has(key)) {
                eslesmeMap.set(key, {
                  supplierKey: supplierCode,
                  supplierCategory: mappedId,
                  hedefSlug: catById.slug,
                  hedefCategoryId: catById.id,
                  hedefCategoryName: catById.name,
                  hedefCategoryPath: catById.path ?? catById.slug,
                  productIds: [],
                  productCount: 0,
                })
              }
              eslesmeMap.get(key)!.productIds.push(sp.productId)
              eslesmeMap.get(key)!.productCount++
            }
            continue
          }
        }
        // mappedId yok veya gecersiz, bu urunu atla
        istatistik.tedarikciBazli[supplierCode].toplam++
        istatistik.tedarikciBazli[supplierCode].bulunamayan++
        continue
      }

      // ---------------------------------------------------------------
      // bizimhesap: category field
      // ---------------------------------------------------------------
      else if (supplierCode === "bizimhesap") {
        const rawCat = (raw["category"] as string) ?? ""
        if (rawCat) {
          supplierCategoryKey = rawCat
          hedefSlug = config[rawCat] as string | undefined ?? null
        }
      }

      // ---------------------------------------------------------------
      // b2bdepo: ustKategoriAdi > altKategoriAdi > enAltKategoriAdi
      // ---------------------------------------------------------------
      else if (supplierCode === "b2bdepo") {
        const ust = (raw["ustKategoriAdi"] as string) ?? ""
        const alt = (raw["altKategoriAdi"] as string) ?? ""
        const enAlt = (raw["enAltKategoriAdi"] as string) ?? ""

        if (ust) {
          hedefSlug = matchB2bdepoCategory(ust, alt, enAlt, config)
          supplierCategoryKey = [ust, alt, enAlt].filter(Boolean).join(" > ")
        }
      }

      // ---------------------------------------------------------------
      // Hedef kategori cozumle
      // ---------------------------------------------------------------
      istatistik.tedarikciBazli[supplierCode].toplam++

      if (!supplierCategoryKey || !hedefSlug) {
        istatistik.eslesmeBulunamayan++
        istatistik.tedarikciBazli[supplierCode].bulunamayan++
        eslesmemisler.push(`${sp.product.name} (supplierCat=${supplierCategoryKey ?? "yok"})`)
        continue
      }

      const resolved = resolveCategoryId(hedefSlug, slugMap)
      if (!resolved) {
        istatistik.gecersizSlug++
        istatistik.tedarikciBazli[supplierCode].bulunamayan++
        eslesmemisler.push(`${sp.product.name} → "${hedefSlug}" (SLUG BULUNAMADI)`)
        continue
      }

      istatistik.eslesmeBulunan++
      istatistik.tedarikciBazli[supplierCode].eslesen++

      // Zaten dogru kategoride mi?
      if (sp.product.categoryId === resolved.id) {
        istatistik.ayniKategoridekiler++
        continue
      }

      const key = resolved.id
      if (!eslesmeMap.has(key)) {
        eslesmeMap.set(key, {
          supplierKey: supplierCode,
          supplierCategory: supplierCategoryKey,
          hedefSlug,
          hedefCategoryId: resolved.id,
          hedefCategoryName: resolved.name,
          hedefCategoryPath: resolved.path,
          productIds: [],
          productCount: 0,
        })
      }
      eslesmeMap.get(key)!.productIds.push(sp.productId)
      eslesmeMap.get(key)!.productCount++
    }

    // Bu tedarikci icin eslesmeleri ekle
    for (const es of eslesmeMap.values()) {
      tumEslesmeler.push(es)
    }

    // Eslesmemis urunleri logla (ilk 5)
    if (eslesmemisler.length > 0) {
      console.log(`    Eşleştirilemeyen: ${eslesmemisler.length} ürün`)
      for (const m of eslesmemisler.slice(0, 5)) {
        console.log(`      - ${m}`)
      }
      if (eslesmemisler.length > 5) {
        console.log(`      ... ve ${eslesmemisler.length - 5} ürün daha`)
      }
    }
    console.log()
  }

  // --------------------------------------------------------------------------
  // FAZE 4: Ozet
  // --------------------------------------------------------------------------
  const toplamTasinacak = tumEslesmeler.reduce((t, e) => t + e.productCount, 0)
  const toplamFarkliHedef = tumEslesmeler.length

  console.log("=".repeat(70))
  console.log("  ANALİZ ÖZETİ")
  console.log("=".repeat(70))
  console.log(`  Toplam analiz edilen ürün:        ${istatistik.toplamUrun}`)
  console.log(`  Eşleşme bulunan:               ${istatistik.eslesmeBulunan}`)
  console.log(`  Eşleşme bulunamayan:             ${istatistik.eslesmeBulunamayan}`)
  console.log(`  Geçersiz slug (esleme hatası):   ${istatistik.gecersizSlug}`)
  console.log(`  Zaten doğru kategoride:            ${istatistik.ayniKategoridekiler}`)
  console.log(`  Taşınacak ürün:                   ${toplamTasinacak}`)
  console.log(`  Toplam farklı hedef kategori:      ${toplamFarkliHedef}`)
  console.log()
  console.log("  Tedarikçi bazlı:")
  for (const [code, stats] of Object.entries(istatistik.tedarikciBazli)) {
    console.log(
      `    ${code.padEnd(12)}: ${stats.toplam} ürün | ${stats.eslesen} eşleşen | ${stats.bulunamayan} bulunamayan`,
    )
  }
  console.log()

  if (toplamTasinacak === 0) {
    console.log("  Taşınacak ürün yok. Çıkılıyor.")
    await prisma.$disconnect()
    await pool.end()
    return
  }

  // En cok urun tasiyacak hedef kategoriler
  const sorted = [...tumEslesmeler].sort((a, b) => b.productCount - a.productCount)
  console.log("  En çok taşınacak hedef kategoriler (top 15):")
  for (const es of sorted.slice(0, 15)) {
    console.log(`    ${es.hedefCategoryName.padEnd(35)} (${es.hedefSlug}): ${es.productCount} ürün`)
  }
  console.log()

  if (DRY_RUN) {
    console.log("  DRY-RUN modu: Veritabanına HİÇBİR ŞEYE YAZILMADI.")
    console.log("  Çalıştırmak için: npx tsx scripts/reassign-products-by-supplier.ts --execute")
    await prisma.$disconnect()
    await pool.end()
    return
  }

  // --------------------------------------------------------------------------
  // FAZE 5: Transaction içinde ürünleri taşı
  // --------------------------------------------------------------------------
  console.log("[FAZE 5] Ürünler taşınıyor...")

  let toplamGuncellenen = 0
  const BATCH_SIZE = 100

  try {
    await prisma.$transaction(async (tx) => {
      for (const es of tumEslesmeler) {
        if (es.productIds.length === 0) continue

        // Batch update
        for (let i = 0; i < es.productIds.length; i += BATCH_SIZE) {
          const batch = es.productIds.slice(i, i + BATCH_SIZE)
          const sonuc = await tx.product.updateMany({
            where: { id: { in: batch }, deletedAt: null },
            data: { categoryId: es.hedefCategoryId! },
          })
          toplamGuncellenen += sonuc.count
        }

        console.log(
          `  [TAŞI] ${es.supplierKey} → ${es.hedefCategoryName} (${es.hedefSlug}): ${es.productCount} ürün`,
        )
      }
    })

    console.log()
    console.log("  Transaction başarıyla tamamlandı.")
  } catch (hata) {
    console.error()
    console.error("  [HATA] Transaction başarısız:", hata instanceof Error ? hata.message : hata)
    console.error("  Hiçbir değişiklik uygulanmadı (rollback).")
    process.exit(1)
  }

  // --------------------------------------------------------------------------
  // FAZE 6: Sonuç raporu
  // --------------------------------------------------------------------------
  const sure = ((Date.now() - baslangic) / 1000).toFixed(1)

  console.log()
  console.log("=".repeat(70))
  console.log("  SONUÇ RAPORU")
  console.log("=".repeat(70))
  console.log(`  Mod:                      ${EXECUTE ? "GERÇEK ÇALIŞTIRMA" : "DRY-RUN"}`)
  console.log(`  Süre:                     ${sure}s`)
  console.log(`  Güncellenen ürün:            ${toplamGuncellenen}`)
  console.log(`  Eşleştirme bulunamayan:       ${istatistik.eslesmeBulunamayan}`)
  console.log(`  Geçersiz slug:              ${istatistik.gecersizSlug}`)
  console.log(`  Zaten doğru kategoride:       ${istatistik.ayniKategoridekiler}`)
  console.log("=".repeat(70))
}

// ============================================================================
// ÇALIŞTIR
// ============================================================================

main()
  .catch((hata) => {
    console.error("\n[KRİTİK HATA]", hata)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
