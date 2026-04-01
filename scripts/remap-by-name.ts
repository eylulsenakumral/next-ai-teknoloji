/**
 * Kategorisiz ürünleri ürün ADI bazlı eşleştir
 *
 * Ürün adındaki anahtar kelimeleri kullanarak en uygun kategoriye atar.
 * Hem supplier_products._mappedCategoryId hem de products.category_id günceller.
 *
 * Kullanım:
 *   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nextai \
 *     npx tsx scripts/remap-by-name.ts [--dry-run]
 */

import "dotenv/config"
import { Pool } from "pg"

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/nextai"

const pool = new Pool({ connectionString: DATABASE_URL })

const DRY_RUN = process.argv.slice(2).includes("--dry-run")

interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
  depth: number
  path: string
}

// Ürün adı → kategori anahtar kelime eşleştirmeleri
// Format: [pattern, category_slug]
// Önce spesifik olanlar gelmeli (sıra önemli)
const NAME_RULES: [RegExp, string][] = [
  // CCTV - Kameralar
  [/ip\s*kamera/i, "cctv-ip-kameralar"],
  [/ptz.*kamera|kamera.*ptz/i, "cctv"],
  [/dahua.*(kamera|ipc)/i, "cctv"],
  [/hikvision.*(kamera|ds-2cd)/i, "cctv"],
  [/full\s*color.*kamera|kamera.*full\s*color/i, "cctv"],
  [/ip\s*kamera|network\s*kamera/i, "cctv-ip-kameralar"],
  [/kamera/i, "cctv"],

  // CCTV - Kayıt cihazları
  [/nvr|xvr|dvr|kayit\s*cihaz/i, "cctv-kayit-cihazi"],

  // Hareket Sensörü / Dedektör / Alarm
  [/pir.*sens[oö]r|sens[oö]r.*pir|hareket\s*sens/i, "gecis-kontrol-alarm-hirsiz-alarm"],
  [/dedekt[oö]r|yang[iı]n.*alarm|alarm.*yang/i, "gecis-kontrol-alarm-hirsiz-alarm"],
  [/alarm/i, "gecis-kontrol-alarm-hirsiz-alarm"],

  // Switch (Network)
  [/poe.*switch|switch.*poe/i, "network-fiber-poe-switchler"],
  [/fiber.*switch|switch.*fiber/i, "network-fiber-switch"],
  [/managed.*switch|switch.*managed/i, "network-fiber-switch"],
  [/gigabit.*switch|switch.*gigabit/i, "network-fiber-switch"],
  [/switch/i, "network-fiber-switch"],

  // Router / Yönlendirici
  [/y[oö]nel|router|vpn.*gateway|gateway/i, "network-fiber"],

  // Access Point
  [/access\s*point|uap|uniFi.*ap|wifi.*ap/i, "network-fiber-kablosuz-ag"],

  // Network Kabin
  [/kabin.*network|network.*kabin|\d+u.*kabin|kabin.*\d+u/i, "network-fiber-network-kabin"],

  // Fiber
  [/fiber.*optik|optik.*fiber|patch.*panel.*fiber|pigtail|sc\s*sm|fc\s*switch/i, "network-fiber-fiber-optik"],
  [/patch\s*panel(?!.*cat)/i, "network-fiber"],

  // Notebook / Laptop
  [/notebook|laptop|vivobook|expertbook|thinkpad|ideapad|macbook/i, "bilgisayar-sunucu-notebook"],

  // Masaüstü PC
  [/optiplex|desktop\s*pc|tower\s*pc|masa[uu]st[uu]/i, "bilgisayar-sunucu-masaustu-bilgisayar"],
  [/pc\b/i, "bilgisayar-sunucu-masaustu-bilgisayar"],

  // Sunucu
  [/poweredge|sunucu|server|proliant/i, "bilgisayar-sunucu-sunucu"],

  // Monitör
  [/monitor|zensuscreen|uni.?screen/i, "bilgisayar-sunucu-monitor"],

  // Anakart
  [/anakart|motherboard|b760|z790|b660|h610/i, "pc-bilesenleri-anakart"],

  // RAM / Bellek
  [/ddr[345]|ram\b|bellek|fury.*beast|kingston.*ram|corsair.*ram/i, "pc-bilesenleri-bellek-ram"],

  // SSD
  [/ssd|nvme|m\.2.*pcie|a2000|970\s*evo|980\s*pro/i, "pc-bilesenleri-depolama"],

  // HDD
  [/hdd|harddisk|hard\s*disk|skyhawk|seagate.*(tb|disk)/i, "pc-bilesenleri-depolama"],

  // Ekran Kartı
  [/rtx|gtx|geforce|rx\s*\d|radeon|ekran\s*kart/i, "pc-bilesenleri-ekran-karti"],

  // Kasa
  [/kasa.*pc|pc.*kasa|atx.*kasa/i, "pc-bilesenleri-kasa"],

  // PSU / Güç Kaynağı
  [/psu|g[uu]c.?kaynak|power.?supply/i, "pc-bilesenleri-guc-kaynagi-psu"],

  // Soğutma
  [/fan|cooler|so[gq]utma|aio.*cool|liquid.*cool/i, "pc-bilesenleri-sogutma"],

  // Klavye & Mouse
  [/klavye.*mouse|mouse.*klavye|mk\d+\s*slim|mx\s*master|ergonomik.*mouse/i, "cevre-birimleri-aksesuar-klavye-mouse"],
  [/mouse\b/i, "cevre-birimleri-aksesuar-klavye-mouse"],
  [/klavye/i, "cevre-birimleri-aksesuar-klavye-mouse"],

  // Kulaklık
  [/kulakl[iı]k|headset|headphone/i, "cevre-birimleri-aksesuar-kulaklik-mikrofon"],

  // UPS / Güç Elektroniği
  [/ups\b|kesintisiz/i, "guc-elektronigi"],
  [/adapt[oö]r|şarj|pil|ak[uu]/i, "guc-elektronigi"],

  // POS / Barkod
  [/barkod|pos\s*terminal|fi[sş].*yaz[iı]c/i, "pos-barkod"],
  [/el\s*terminal/i, "pos-barkod-pos-terminal"],

  // Yazıcı / Tarayıcı
  [/yaz[iı]c[iı]|printer|taray[iı]c[iı]|scanner/i, "yazici-tarayici"],

  // USB Bellek / Flash
  [/usb.*flash|flash.*bellek|datatraveler|flash.?drive/i, "pc-bilesenleri-depolama"],

  // Antivirüs / Yazılım
  [/antiv[ii]r[uu]s|kaspersky|norton|eset|bitdefender|windows.*pro|office.*lisans/i, "yazilim-lisans"],

  // Kablo
  [/kablo|cat[56]|utp|patch.?cord|hdmi.?kablo|vga.?kablo/i, "kablo-aksesuar"],

  // Flash Bellek / USB
  [/flash\s*bellek|usb\s*3/i, "pc-bilesenleri-depolama"],

  // Telefon Paneli
  [/telefon.*panel|panel.*telefon|isdn/i, "gecis-kontrol-alarm"],

  // Video Intercom / Kapı
  [/intercom|zil.*panel|kap[iı].*istasyon/i, "gecis-kontrol-alarm"],

  // Depolama - generic
  [/tb\s*(ssd|hdd|disk)|disk/i, "pc-bilesenleri-depolama"],
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()
}

async function main() {
  console.log("=== Ürün Adı Bazlı Kategori Eşleştirme ===\n")
  if (DRY_RUN) console.log("[DRY RUN] Hiçbir şey kaydedilmeyecek\n")

  // Kategorileri yükle
  const { rows: catRows } = await pool.query(
    `SELECT id, name, slug, parent_id as "parentId", depth, path
     FROM categories WHERE deleted_at IS NULL AND is_active = true`
  )

  const catMap = new Map<string, Category>()
  for (const c of catRows) {
    catMap.set(c.slug, c)
    catMap.set(c.name.toLowerCase(), c)
  }

  console.log(`✅ ${catRows.length} kategori yüklendi`)

  // Kategorisiz ürünleri al
  const { rows: products } = await pool.query(`
    SELECT p.id, p.name,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object('sp_id', sp.id, 'supplier', s.code))
        FILTER (WHERE sp.id IS NOT NULL),
        '[]'::json
      ) as supplier_links
    FROM products p
    LEFT JOIN supplier_products sp ON sp.product_id = p.id AND sp.deleted_at IS NULL
    LEFT JOIN suppliers s ON s.id = sp.supplier_id
    WHERE p.deleted_at IS NULL AND p.category_id IS NULL
    GROUP BY p.id, p.name
    ORDER BY p.name
  `)

  console.log(`📋 ${products.length} kategorisiz ürün bulundu\n`)

  let matched = 0
  let unmatched = 0
  const unmatchedNames: string[] = []

  for (const product of products) {
    const name = product.name

    // Atlanacak ürünler (depoizto, kurulum, hizmet vs.)
    const lowerName = name.toLowerCase()
    if (
      lowerName.includes("depozito") ||
      lowerName.includes("kurulum") ||
      lowerName.includes("devreye") ||
      lowerName.includes("işçilik") ||
      lowerName.includes("hizmet") ||
      lowerName.includes("bedel") ||
      lowerName.includes("bİLİŞİM") ||
      lowerName.includes("taşıma") ||
      lowerName.includes("nakliye")
    ) {
      unmatchedNames.push(`  [SKIP] ${name}`)
      unmatched++
      continue
    }

    // İsim bazlı eşleştirme
    let bestSlug: string | null = null

    for (const [pattern, slug] of NAME_RULES) {
      if (pattern.test(name)) {
        bestSlug = slug
        break
      }
    }

    if (!bestSlug) {
      // Fallback: normalize edilmiş isimde kategori keywords ara
      const norm = normalize(name)
      const words = norm.split(/\s+/).filter((w) => w.length > 2)

      for (const [key, cat] of catMap.entries()) {
        for (const word of words) {
          if (cat.name.toLowerCase().includes(word) && word.length >= 4) {
            bestSlug = cat.slug
            break
          }
        }
        if (bestSlug) break
      }
    }

    if (!bestSlug) {
      unmatchedNames.push(`  ❌ ${name}`)
      unmatched++
      continue
    }

    const category = catMap.get(bestSlug)
    if (!category) {
      unmatchedNames.push(`  ⚠️ Slug bulunamadı: ${bestSlug} — ${name}`)
      unmatched++
      continue
    }

    matched++

    if (DRY_RUN) {
      console.log(`  ✅ "${name}" → ${category.name}`)
      continue
    }

    // products.category_id güncelle
    await pool.query(
      `UPDATE products SET category_id = $1, updated_at = NOW() WHERE id = $2`,
      [category.id, product.id]
    )

    // supplier_products._mappedCategoryId güncelle
    const links = product.supplier_links as Array<{ sp_id: string; supplier: string }>
    for (const link of links) {
      if (link.sp_id) {
        await pool.query(
          `UPDATE supplier_products
           SET raw_data = COALESCE(raw_data, '{}'::jsonb)
             || jsonb_build_object('_mappedCategoryId', $1::text),
               updated_at = NOW()
           WHERE id = $2`,
          [category.id, link.sp_id]
        )
      }
    }
  }

  console.log(`\n=== ÖZET ===`)
  console.log(`Eşleşen: ${matched}`)
  console.log(`Eşleşmeyen: ${unmatched}`)

  if (unmatchedNames.length > 0 && unmatchedNames.length <= 30) {
    console.log(`\nEşleşmeyen ürünler:`)
    unmatchedNames.forEach((n) => console.log(n))
  } else if (unmatchedNames.length > 30) {
    console.log(`\nEşleşmeyen ürünler (ilk 30/${unmatchedNames.length}):`)
    unmatchedNames.slice(0, 30).forEach((n) => console.log(n))
  }

  if (DRY_RUN) console.log(`\n[DRY RUN] Hiçbir değişiklik yapılmadı`)

  await pool.end()
}

main().catch((err) => {
  console.error("Kritik hata:", err)
  pool.end()
  process.exit(1)
})
