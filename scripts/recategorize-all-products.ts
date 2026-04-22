/**
 * Toplu Kategori Yeniden Atama v3
 *
 * Strateji: Her ürünü tüm kategori ağacına karşı skorla, en derin ve en yüksek
 * skorlu eşleşmeyi bul. Mevcut kategori branch'ine bonus ver (false positive azaltmak için).
 *
 * Kullanım: npx tsx scripts/recategorize-all-products.ts [--dry-run] [--live]
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

interface CatNode {
  id: string; name: string; slug: string; depth: number
  parentId: string | null; children: CatNode[]; fullPath: string
  keywords: string[] // extracted from name, slug, path
}

// -------------------------------------------------------------------
// Build tree + extract keywords
// -------------------------------------------------------------------

async function buildCategoryTree(): Promise<{ roots: CatNode[]; flat: Map<string, CatNode> }> {
  const cats = await prisma.$queryRaw<Array<{
    id: string; name: string; slug: string; depth: number; parent_id: string | null
  }>>`SELECT id, name, slug, depth, parent_id FROM categories WHERE deleted_at IS NULL AND is_active = true ORDER BY depth, sort_order, name`

  const nodeMap = new Map<string, CatNode>()
  for (const c of cats) {
    const keywords = extractKeywords(c.name, c.slug)
    nodeMap.set(c.id, {
      id: c.id, name: c.name, slug: c.slug, depth: c.depth,
      parentId: c.parent_id, children: [], fullPath: "", keywords
    })
  }

  const roots: CatNode[] = []
  for (const c of cats) {
    const node = nodeMap.get(c.id)!
    if (c.parent_id && nodeMap.has(c.parent_id)) {
      nodeMap.get(c.parent_id)!.children.push(node)
    } else if (!c.parent_id) {
      roots.push(node)
    }
  }

  function setPath(n: CatNode, prefix: string) {
    n.fullPath = prefix ? `${prefix} > ${n.name}` : n.name
    // Do NOT add path keywords — only use category's own name/slug keywords
    n.children.forEach(ch => setPath(ch, n.fullPath))
  }
  roots.forEach(r => setPath(r, ""))

  console.log(`📂 ${cats.length} kategori (${roots.length} kök)`)
  return { roots, flat: nodeMap }
}

function extractKeywords(name: string, slug: string): string[] {
  const kws = new Set<string>()
  const stopWords = new Set(['ve', 'için', 'ile', 'bir', 'the', 'and', 'for', 'ile', 'ürün', 'cihaz', 'sistem', 'sistemleri', 'tipi', 'tip', 'grubu', 'genel', 'diger', 'other'])
  // From name only (NOT path - that causes false positives)
  name.toLowerCase().replace(/[()\/&\-.,]/g, " ").split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w)).forEach(w => kws.add(w))
  // From slug
  slug.toLowerCase().split(/-/).filter(w => w.length > 2 && !stopWords.has(w)).forEach(w => kws.add(w))
  return [...kws]
}

// -------------------------------------------------------------------
// Scoring: match product name against category
// -------------------------------------------------------------------

function scoreProductVsCategory(name: string, specs: string, cat: CatNode): number {
  const n = name.toLowerCase()
  const catName = cat.name.toLowerCase()
  const slug = cat.slug

  // Exact match
  if (n === catName) return 100

  // Name contains full category name
  if (catName.length > 4 && n.includes(catName)) return 80 + Math.min(catName.length, 15)

  // Special pattern matching FIRST — these are reliable, explicit matches
  const special = specialScore(n, specs, slug, catName, cat)
  if (special > 0) return special

  // Keyword matching — ONLY gives low scores (capped at 45)
  // Too loose for cross-category moves but ok for same-branch deepening
  const nameWords = n.replace(/[()\/\-.,&]/g, " ").split(/\s+/).filter(w => w.length > 2)
  const genericWords = new Set(['kablo', 'cable', 'adaptör', 'adapter', 'set', 'ürün', 'cihaz', 'sistem',
    'panel', 'modül', 'modul', 'sensor', 'sensör', 'güç', 'power', 'kabinet', 'rack', 'data', 'plus',
    'pro', 'kit', 'yedek', 'aksesuar', 'sarj', 'dolmu', 'dolum'])
  const meaningfulKws = cat.keywords.filter(kw => !genericWords.has(kw) && kw.length > 3)
  let keywordHits = 0
  for (const kw of meaningfulKws) {
    if (nameWords.some(w => w === kw) || n.includes(kw)) {
      keywordHits++
    }
  }
  if (meaningfulKws.length > 0 && keywordHits >= 1) {
    const ratio = keywordHits / meaningfulKws.length
    if (ratio >= 0.3 && keywordHits >= 2) {
      return Math.round(ratio * 45) // capped low — below cross-category threshold of 70
    } else if (keywordHits >= 1 && meaningfulKws.length <= 2) {
      return 25 // very low — only for same-branch
    }
  }

  return 0
}

function specialScore(n: string, _specs: string, slug: string, catName: string, cat: CatNode): number {
  // NOTE: Intentionally NOT using specs parameter — specs JSON causes false positives.
  // All matching is done against product name ONLY.
  // ---- IP Kamera tipleri ----
  if (slug === "bullet-kamera" || slug === "bullet-kamera-1") {
    if (n.includes("bullet")) return 95
    if (n.match(/\bipc-hfw/i)) return 90
    if (n.match(/\bipc-hbw/i)) return 85
    // Hikvision bullet: DS-2CD1x, DS-2CD2x (not dome/turret)
    if (n.match(/\bds-2cd/i) && !n.includes("dome") && !n.includes("turret")) return 55
  }
  if (slug === "dome-kamera" || slug === "dome-kamera-1") {
    if (n.includes("dome")) return 95
    if (n.match(/\bipc-hdw/i)) return 90
    if (n.match(/\bipc-hdbw/i)) return 85
  }
  if (slug === "ptz-kamera") {
    if (n.includes("ptz") || n.includes("speed dome") || n.includes("speed")) return 95
    if (n.match(/\bds-2de/i)) return 85
    if (n.match(/\bipc-sd/i)) return 90
    if (n.match(/\btc-h/i)) return 80
  }
  if (slug === "turret-kamera") {
    if (n.includes("turret") || n.includes("eyeball")) return 95
    if (n.match(/\bipc-ebw/i)) return 90
  }
  if (slug === "special-kamera") {
    if (n.includes("lpr") || n.includes("plaka") || n.includes("termal") || n.includes("thermal") || n.includes("fisheye") || n.includes("panoramik") || n.match(/\b360\b/)) return 95
    if (n.match(/\bipc-cb/i)) return 90
    if (n.match(/\bipc-ct/i)) return 85
  }

  // ---- IP Kamera üst ----
  if (slug === "ip-kamera") {
    if (n.includes("ip kamera") || n.includes("ip camera") || n.includes("ip kam")) return 95
    if (n.match(/\bipc-/) || n.match(/\bih-\d/)) return 70
    if (n.match(/\bik-/) || n.match(/\biv-\d/)) return 65
  }
  if (slug === "ahd-hd-tvi-kameralar" || slug.includes("hdtvi")) {
    if (n.includes("ahd") || n.includes("hd-tvi") || n.includes("hdtvi") || n.includes("hd tvi") || n.includes("turbo hd")) return 95
    if (n.match(/\bds-2ce/i)) return 85
  }
  if (slug === "hdcvi-kamera") {
    if (n.includes("hdcvi") || n.includes("hd cvi")) return 95
  }

  // ---- MP seviyeleri ----
  const mpPatterns: Array<{ slugs: string[]; keywords: string[]; digits: string[] }> = [
    { slugs: ["2mp-bullet", "2mp-dome", "2mp-ptz", "2mp-turret", "2mp-kamera"], keywords: ["2mp", "2 mp", "1080p", "full hd"], digits: ["12", "22", "23", "02"] },
    { slugs: ["4mp-bullet", "4mp-dome", "4mp-ptz", "4mp-turret", "4mp-kamera"], keywords: ["4mp", "4 mp", "1440p", "2k"], digits: ["14", "24", "44", "43"] },
    { slugs: ["5mp-bullet", "5mp-dome", "5mp-turret", "5mp-kamera"], keywords: ["5mp", "5 mp"], digits: ["15", "25", "54"] },
    { slugs: ["8mp-bullet", "8mp-dome", "8mp-kamera"], keywords: ["8mp", "8 mp", "4k", "uhd"], digits: ["48", "28", "49", "38"] },
  ]
  for (const mp of mpPatterns) {
    if (mp.slugs.includes(slug)) {
      for (const kw of mp.keywords) {
        if (n.includes(kw)) return 90
      }
      const dahuaMatch = n.match(/\bipc-[eh][fdb]w?(\d{2})/i)
      if (dahuaMatch && mp.digits.includes(dahuaMatch[1])) return 85
      const hikMatch = n.match(/\bds-2c[dex](\d{2})/i)
      if (hikMatch && mp.digits.includes(hikMatch[1])) return 80
    }
  }

  // ---- DVR / NVR ----
  if (slug === "dvr") {
    if (n.includes("dvr") || n.match(/\bxvr/i)) return 95
    if (n.match(/\bds-71/i) || n.match(/\bds-72/i)) return 90
  }
  if (slug === "nvr-cihazlar-1") {
    if (n.includes("nvr")) return 95
    if (n.match(/\bds-76/i) || n.match(/\bds-77/i) || n.match(/\bdhi-nvr/i)) return 90
  }

  // ---- Switch ----
  if (slug === "poe-switchler") {
    if (n.includes("poe") && n.includes("switch")) return 95
  }
  if (slug === "data-non-poe-switchler") {
    if (n.includes("switch") && !n.includes("poe") && !n.includes("fiber") && !n.includes("endüstriyel") && !n.includes("industrial")) return 55
  }
  if (slug.includes("endustriyel") && slug.includes("switch")) {
    if (n.includes("endüstriyel") || n.includes("industrial")) return 90
  }
  if (slug.includes("fiber") && slug.includes("omurga")) {
    if ((n.includes("fiber") || n.includes("omurga")) && n.includes("switch")) return 85
  }

  // ---- GPU ----
  if (slug.includes("nvidia") && slug.includes("gpu")) {
    if (n.includes("nvidia") || n.includes("geforce") || n.includes("rtx") || n.includes("gtx") || n.includes("quadro")) return 95
    if (n.match(/\brtx\b|\bgtx\b|\bgt\s?\d/) && !n.includes("radeon")) return 90
  }
  if (slug.includes("amd") && slug.includes("gpu")) {
    if (n.includes("radeon") || n.includes("rx5") || n.includes("rx9") || n.match(/\brx\s?\d{3,4}/)) return 95
  }
  if (slug.includes("is-istasyonu") && slug.includes("gpu")) {
    if (n.includes("quadro") || n.includes("rtx a") || n.includes("firepro")) return 90
  }

  // ---- Bellek ----
  if (slug === "masaustu-bellekler" || slug === "masaustu-bellekler-1") {
    if ((n.includes("ram") || n.includes("bellek") || n.includes("ddr4") || n.includes("ddr5")) && !n.includes("laptop") && !n.includes("notebook") && !n.includes("sunucu") && !n.includes("ecc") && !n.includes("so-dimm") && !n.includes("sodimm") && !n.includes("usb")) return 70
  }
  if (slug === "notebook-bellekler") {
    if ((n.includes("ram") || n.includes("bellek")) && (n.includes("laptop") || n.includes("notebook") || n.includes("so-dimm") || n.includes("sodimm"))) return 90
  }
  if (slug === "usb-bellekler") {
    if (n.includes("usb bellek") || n.includes("usb flash") || n.includes("flash drive") || n.includes("pendrive") || n.includes("usb stick")) return 95
  }
  if (slug.includes("sunucu") && slug.includes("ram")) {
    if ((n.includes("ram") || n.includes("bellek")) && (n.includes("ecc") || n.includes("sunucu") || n.includes("server"))) return 90
  }

  // ---- SSD / HDD ----
  if (slug === "ssd-diskler" || slug === "ssd-diskler-1") {
    // Must be a standalone SSD product, not a computer with SSD storage
    const isComputer = n.match(/\bi[3579]-\d/i) || n.match(/\b(ryz|athlon|xeon|epyc)\b/i) ||
        n.match(/\b(fhd|qhd|uhd|oled|wuxga)\b/i) ||
        n.includes("notebook") || n.includes("laptop") || n.includes("dizüstü") ||
        n.includes("server") || n.includes("sunucu") || n.includes("all-in-one") ||
        n.includes("monitör") || n.includes("monitor") || n.includes("masaüstü") ||
        n.includes("taşınabilir") || n.includes("desktop") || n.includes("workstation") ||
        n.match(/\b(pc|tower)\b/i) || n.match(/\b(win\d+|freedos|dos)\b/i) ||
        n.match(/\b\d+(\.\d+)?\s*[''"]+/) // display size like 15.6" or 24"
    if (isComputer) return 0
    if (n.includes("ssd") || n.includes("nvme") || n.match(/\bm\.?2\b/) || n.includes("sata ssd") || n.includes("m.2 ssd")) return 85
  }
  if (slug === "tasinabilir-ssd") {
    if ((n.includes("ssd") || n.includes("nvme")) && (n.includes("dış") || n.includes("portable") || n.includes("taşınabilir") || n.includes("harici"))) return 90
  }
  if (slug.includes("sata-harddisk") || slug.includes("sata-harddiskler")) {
    if ((n.includes("hdd") || n.includes("hard disk") || n.includes("harddisk")) && !n.includes("ssd")) return 80
  }

  // ---- Notebook ----
  if (slug.includes("gaming") && slug.includes("notebook")) {
    if (n.includes("gaming") || n.includes("oyun") || n.includes("rog ") || n.includes("legion") || n.includes("predator") || n.includes("nitro")) return 90
  }

  // ---- Fiber ----
  if (slug.includes("fiber-patch-kablo") && !slug.includes("pigtail")) {
    if ((n.includes("patch kablo") || n.includes("patch cord")) && (n.includes("fiber") || n.includes("lc") || n.includes("sc") || n.includes("st"))) return 90
    if (n.includes("patch cord") && !n.includes("pigtail")) return 88
  }
  if (slug.includes("fiber-pigtail")) {
    if (n.includes("pigtail")) return 95
  }
  if (slug.includes("fiber-kablo") && !slug.includes("patch")) {
    if (n.includes("fiber kablo") && !n.includes("patch")) return 85
  }
  if (slug.includes("fiber-adaptor")) {
    if (n.includes("fiber adaptör") || n.includes("fiber coupler") || n.includes("flange")) return 90
  }
  if (slug.includes("fiber-konnektor") || slug.includes("fiber-konnektorler")) {
    if (n.includes("fiber konnektör") || n.includes("fiber connector") || n.includes("fast connector") || n.includes("fusion")) return 85
  }
  if (slug.includes("fiber-converter") || slug.includes("media-converter")) {
    if (n.includes("media converter") || n.includes("fiber converter") || n.includes("dönüştürücü") || n.includes("gbic") || n.includes("sfp")) return 85
  }
  if (slug.includes("fiber-patch-panel")) {
    if (n.includes("patch panel") && n.includes("fiber")) return 90
  }

  // ---- Alarm ----
  if (slug === "hirsiz-alarm-sistemleri") {
    if ((n.includes("alarm") || n.includes("pir") || n.includes("dedektör") || n.includes("sensör")) && !n.includes("yangın") && !n.includes("fire") && !n.includes("duman")) return 70
  }
  if (slug === "yangin-alarm-sistemleri") {
    if (n.includes("yangın") || n.includes("fire") || n.includes("duman") || n.includes("smoke")) return 85
  }

  // ---- UPS ----
  if (slug.includes("online") && slug.includes("ups")) {
    if (n.includes("online ups") || n.includes("double conversion")) return 90
  }
  if (slug.includes("line-interactive") && slug.includes("ups")) {
    if (n.includes("line interactive") || n.includes("line-interactive") || (n.includes("ups") && !n.includes("online"))) return 75
  }

  // ---- Monitör ----
  if (slug.includes("gaming") && slug.includes("monitor")) {
    if (n.includes("gaming") && (n.includes("monitör") || n.includes("monitor"))) return 90
  }
  if (slug.includes("ofis") && slug.includes("monitor")) {
    if (!n.includes("gaming") && (n.includes("monitör") || n.includes("monitor"))) return 60
  }

  // ---- Kabin ----
  if (slug.includes("dikili") && slug.includes("kabinet")) {
    if (n.includes("dikili") || n.includes("floor standing") || n.match(/\b(42u|22u|32u)\b/i)) return 80
  }
  if (slug.includes("duvar") && slug.includes("kabinet")) {
    if (n.includes("duvar tipi") || n.includes("wall mount") || n.match(/\b(6u|9u|12u|15u)\b/i)) return 80
  }

  // ---- İşlemci ----
  if (slug.includes("amd") && slug.includes("islemci")) {
    if (n.includes("amd") && (n.includes("işlemci") || n.includes("processor") || n.includes("ryzen") || n.includes("athlon") || n.includes("epyc"))) return 90
  }
  if (slug.includes("intel") && slug.includes("islemci")) {
    if (n.includes("intel") && (n.includes("işlemci") || n.includes("processor") || n.includes("core i") || n.includes("xeon"))) return 90
  }

  // ---- Barkod / PDKS ----
  if (slug.includes("el-tipi") && slug.includes("barkod")) {
    if (n.includes("el tipi") || n.includes("handheld barcode") || n.includes("cordless")) return 90
  }
  if (slug.includes("parmak-izi") || slug.includes("fingerprint")) {
    if (n.includes("parmak izi") || n.includes("fingerprint") || n.includes("biyometrik")) return 90
  }
  if (slug.includes("yuz-tanima") || slug.includes("face")) {
    if (n.includes("yüz tanıma") || n.includes("face recognition")) return 90
  }
  if (slug.includes("turnike")) {
    if (n.includes("turnike") || n.includes("turnstile") || n.includes("tripod")) return 90
  }

  // ---- CAT kablo ----
  if (slug === "cat6" || slug === "cat6-1") {
    if (n.includes("cat6") && !n.includes("cat6a")) return 90
  }
  if (slug === "cat6a") {
    if (n.includes("cat6a")) return 95
  }

  // ---- Yazıcı ----
  if (slug.includes("lazer") && slug.includes("yazici")) {
    if (n.includes("lazer yazıcı") || n.includes("laser") || n.includes("laserjet")) return 85
  }
  if (slug.includes("toner")) {
    if (n.includes("toner") || n.includes("cartridge")) return 85
  }

  // ---- Sarf / Aksesuar ----
  if (slug.includes("sarf-malzeme") || slug.includes("yazici-sarf")) {
    if (n.includes("sarf") || n.includes("drum") || n.includes("transfer") || n.includes("fuser")) return 80
  }
  if (slug.includes("lens")) {
    if (n.includes("lens")) return 85
  }
  if (slug.includes("montaj") || slug.includes("bracket")) {
    if (n.includes("montaj") || n.includes("bracket") || n.includes("mount") || n.includes("housing")) return 80
  }

  // ---- Patch Kablolar alt kırılımları ----
  if (slug.includes("cat5e") && slug.includes("patch")) {
    if (n.includes("cat5e") || n.includes("cat 5e") || n.includes("cat5")) return 90
  }
  if (slug.includes("cat6") && slug.includes("patch") && !slug.includes("cat6a")) {
    if (n.includes("cat6") && !n.includes("cat6a") && (n.includes("patch") || n.includes("kablo"))) return 85
  }
  if (slug.includes("cat6a") && slug.includes("patch")) {
    if (n.includes("cat6a") && (n.includes("patch") || n.includes("kablo"))) return 90
  }

  // ---- NEGATIVE: Prevent known false positives ----
  // "Kablosuz" should NOT steal alarm/wireless alarm products
  if (slug === "kablosuz" || (slug.includes("kablosuz") && !slug.includes("alarm"))) {
    if (n.includes("alarm") || n.includes("dedektör") || n.includes("ajax") || n.includes("gsm")) return 0
  }
  // "Klavye & Mouse Setleri" should NOT steal standalone mice
  if (slug.includes("klavye") && slug.includes("mouse") && slug.includes("set")) {
    // Must have BOTH keyboard AND mouse in name
    const hasKlavye = n.includes("klavye") || n.includes("keyboard")
    const hasMouse = n.includes("mouse") || n.includes("fare")
    if (!hasKlavye || !hasMouse) return 0
  }
  // "Special Kamera" should NOT steal non-special cameras
  if (slug === "special-kamera") {
    if (!n.includes("lpr") && !n.includes("plaka") && !n.includes("termal") && !n.includes("thermal") &&
        !n.includes("fisheye") && !n.includes("panoramik") && !n.match(/\b360\b/) &&
        !n.match(/\bipc-c[bdt]/i)) return 0
  }
  // "Media Converter" should NOT steal switches
  if (slug.includes("media-converter")) {
    if (n.includes("switch") && !n.includes("converter") && !n.includes("dönüştürücü")) return 0
  }
  // "Sonlandırma" should NOT steal fiber patch cables
  if (slug.includes("sonlandir")) {
    if (n.includes("patch kablo") || n.includes("patch cord")) return 0
  }

  // ---- Access Point ----
  if (slug.includes("indoor") && (slug.includes("ap") || slug.includes("access"))) {
    if (n.includes("indoor") && (n.includes("ap") || n.includes("access point"))) return 90
  }
  if (slug.includes("outdoor") && (slug.includes("ap") || slug.includes("access"))) {
    if (n.includes("outdoor") && (n.includes("ap") || n.includes("access point"))) return 90
  }

  // ---- Kablosuz alt kırılımları ----
  if (slug.includes("anten")) {
    if (n.includes("anten") || n.includes("antenna")) return 90
  }
  if (slug.includes("bridge")) {
    if (n.includes("bridge") || n.includes("köprü")) return 85
  }
  if (slug.includes("pci") && slug.includes("kart")) {
    if (n.includes("pci") && (n.includes("kart") || n.includes("card"))) return 90
  }

  // ---- Router alt kırılımları ----
  if (slug.includes("vpn") && slug.includes("router")) {
    if (n.includes("vpn") && n.includes("router")) return 95
    if (n.includes("vpn") || n.includes("ipsec") || n.includes("site to site")) return 85
  }
  if (slug.includes("enterprise") && slug.includes("router")) {
    if (n.includes("enterprise") || n.includes("iş") || n.includes("kurumsal")) return 85
  }
  if (slug.includes("home") && slug.includes("router")) {
    if (n.includes("home") || n.includes("ev") || n.includes("adsl") || n.includes("vdsl") || n.includes("gpon")) return 85
  }

  // ---- Fiber Patch Kablo → Fiber Pigtail split ----
  if (slug.includes("fiber-pigtail")) {
    if (n.includes("pigtail")) return 95
  }

  // ---- Sarf Malzeme alt kırılımları ----
  if (slug.includes("dolmu") || slug.includes("dolum")) {
    if (n.includes("dolmu") || n.includes("dolum") || n.includes("toner") && n.includes("dolum")) return 85
  }

  // ---- Sunucu alt kırılımları ----
  if (slug.includes("rack") && slug.includes("sunucu")) {
    if (n.includes("rack") && (n.includes("sunucu") || n.includes("server"))) return 90
  }
  if (slug.includes("tower") && slug.includes("sunucu")) {
    if (n.includes("tower") && (n.includes("sunucu") || n.includes("server"))) return 90
  }
  if (slug.includes("sunucu") && slug.includes("aksam")) {
    if (n.includes("sunucu") && (n.includes("rak ray") || n.includes("rail") || n.includes("kabin") || n.includes("soğutma") || n.includes("fan") || n.includes("psu") || n.includes("güç"))) return 70
  }

  // ---- Güvenlik kabloları ----
  if (slug.includes("kablo") && slug.includes("güvenlik")) {
    if (n.includes("bnc") || n.includes("rg6") || n.includes("kombi kablo") || n.includes("video kablo")) return 75
  }

  // ---- Network sonlandırma ----
  if (slug.includes("sonlandir") || slug.includes("keystone")) {
    if (n.includes("sonlandırma") || n.includes("keystone") || n.includes("rj45") || n.includes("plug") || n.includes("jack")) return 75
  }

  // ---- Mouse / Klavye ----
  if (slug.includes("mouse") || slug.includes("mous")) {
    if (n.includes("mouse") || n.includes("fare")) return 85
  }
  if (slug.includes("klavye") || slug.includes("keyboard")) {
    if (n.includes("klavye") || n.includes("keyboard")) return 85
  }
  if (slug.includes("klavye") && slug.includes("mouse") && slug.includes("set")) {
    if ((n.includes("klavye") || n.includes("keyboard")) && (n.includes("mouse") || n.includes("fare"))) return 90
  }

  // ---- Hoparlör / Ses ----
  if (slug.includes("hoparlör") || slug.includes("speaker")) {
    if (n.includes("hoparlör") || n.includes("speaker")) return 85
  }

  // ---- Web Kamerası ----
  if (slug.includes("web") && slug.includes("kamera")) {
    if (n.includes("webcam") || n.includes("web kamera") || n.includes("web camera")) return 90
  }

  // ---- Solar ----
  if (slug.includes("solar") || slug.includes("gunes")) {
    if (n.includes("solar") || n.includes("güneş") || n.includes("panel")) return 85
  }

  return 0
}

// -------------------------------------------------------------------
// Find best category for a product across the entire tree
// -------------------------------------------------------------------

interface ScoredCat {
  node: CatNode
  score: number
  sameBranch: boolean // is it in the same branch as current category?
}

function findBestCategory(
  name: string, specs: string, roots: CatNode[], flat: Map<string, CatNode>,
  currentCatId: string | null
): ScoredCat | null {
  const currentBranch = new Set<string>()
  if (currentCatId) {
    // Walk up from current to find root of branch
    let cur = flat.get(currentCatId)
    while (cur?.parentId) cur = flat.get(cur.parentId)
    if (cur) collectDescendants(cur, currentBranch)
  }

  // Use mutable object to properly track best across recursion
  const best = { value: null as ScoredCat | null }

  function walk(node: CatNode) {
    const score = scoreProductVsCategory(name, specs, node)
    const sameBranch = currentBranch.has(node.id)

    if (score > 0) {
      const adjustedScore = sameBranch ? score + 15 : score
      if (!best.value ||
          adjustedScore > best.value.score ||
          (adjustedScore === best.value.score && node.depth > best.value.node.depth)) {
        best.value = { node, score: adjustedScore, sameBranch }
      }
    }

    node.children.forEach(walk)
  }

  roots.forEach(walk)
  return best.value
}

function collectDescendants(node: CatNode, set: Set<string>) {
  set.add(node.id)
  node.children.forEach(c => collectDescendants(c, set))
}

// -------------------------------------------------------------------
// Main
// -------------------------------------------------------------------

async function main() {
  const dryRun = !process.argv.includes("--live")
  console.log(`🏷️  Toplu Kategori Yeniden Atama v3 — ${dryRun ? "DRY RUN (--live ile uygulayın)" : "LIVE"}\n`)

  const { roots, flat } = await buildCategoryTree()

  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: {
      id: true, name: true, slug: true, categoryId: true,
      specs: true, brand: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  })

  console.log(`📦 ${products.length} ürün\n`)

  const stats = {
    total: products.length,
    unchanged: 0,
    movedDeeper: 0,      // same branch, deeper
    reassigned: 0,        // different branch
    orphanMatched: 0,
    noMatch: 0,
  }
  const changes: Array<{
    productId: string; productName: string
    oldCatName: string; newFullPath: string
    newCatId: string; confidence: number; type: string
  }> = []

  for (let i = 0; i < products.length; i++) {
    const p = products[i]
    const specsStr = p.specs ? JSON.stringify(p.specs).toLowerCase() : ""

    const best = findBestCategory(p.name, specsStr, roots, flat, p.categoryId)

    if (!best || best.score < 30) {
      stats.noMatch++
      if ((i + 1) % 500 === 0) process.stdout.write(`\r  İşlenen: ${i + 1}/${products.length}`)
      continue
    }

    const targetCat = best.node

    if (p.categoryId === targetCat.id) {
      stats.unchanged++
      if ((i + 1) % 500 === 0) process.stdout.write(`\r  İşlenen: ${i + 1}/${products.length}`)
      continue
    }

    const oldCat = p.categoryId ? flat.get(p.categoryId) : null
    const oldName = oldCat?.fullPath ?? (p.categoryId ? "[DELETED]" : "[ORPHAN]")
    const type = !p.categoryId ? "orphan" : best.sameBranch ? "deeper" : "reassign"

    changes.push({
      productId: p.id, productName: p.name,
      oldCatName: oldName, newFullPath: targetCat.fullPath,
      newCatId: targetCat.id,
      confidence: best.score - (best.sameBranch ? 15 : 0), // raw score without bonus
      type,
    })

    if (!p.categoryId) stats.orphanMatched++
    else if (best.sameBranch) stats.movedDeeper++
    else stats.reassigned++

    if ((i + 1) % 500 === 0) process.stdout.write(`\r  İşlenen: ${i + 1}/${products.length}`)
  }
  console.log(`\r  İşlenen: ${products.length}/${products.length}\n`)

  console.log("📊 Sonuçlar:")
  console.log(`   Değişmedi:        ${stats.unchanged}`)
  console.log(`   Daha derine indi: ${stats.movedDeeper}`)
  console.log(`   Yeniden atanan:   ${stats.reassigned}`)
  console.log(`   Orphan eşleşen:   ${stats.orphanMatched}`)
  console.log(`   Eşleşmeyen:       ${stats.noMatch}`)
  console.log(`   Toplam değişiklik: ${changes.length}`)
  console.log()

  // Summary by target category
  const byCat = new Map<string, number>()
  for (const ch of changes) byCat.set(ch.newFullPath, (byCat.get(ch.newFullPath) ?? 0) + 1)
  console.log("📋 Hedef kategori bazlı (top 30):")
  for (const [path, count] of [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30)) {
    console.log(`   ${count.toString().padStart(4)} → ${path}`)
  }
  console.log()

  // Summary by source category
  const bySrc = new Map<string, number>()
  for (const ch of changes) {
    const src = ch.oldCatName.split(" > ")[0]
    bySrc.set(src, (bySrc.get(src) ?? 0) + 1)
  }
  console.log("📋 Kaynak kategori bazlı (top 15):")
  for (const [path, count] of [...bySrc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
    console.log(`   ${count.toString().padStart(4)} ← ${path}`)
  }
  console.log()

  // Show reassignments (cross-category moves)
  const reassignments = changes.filter(c => c.type === "reassign")
  if (reassignments.length > 0) {
    console.log(`⚠️  Yeniden atanan ürünler (${reassignments.length} adet, ilk 30):`)
    for (const ch of reassignments.slice(0, 30)) {
      const icon = ch.confidence >= 70 ? "🟢" : ch.confidence >= 50 ? "🟡" : "🔴"
      console.log(`  ${icon} [${ch.confidence}%] ${ch.productName}`)
      console.log(`     ${ch.oldCatName}`)
      console.log(`     → ${ch.newFullPath}`)
    }
    console.log()
  }

  // Show sample deeper moves
  const deeperMoves = changes.filter(c => c.type === "deeper")
  if (deeperMoves.length > 0) {
    console.log(`📝 Daha derine inen ürünler (ilk 20):`)
    for (const ch of deeperMoves.slice(0, 20)) {
      console.log(`  [${ch.confidence}%] ${ch.productName}`)
      console.log(`     ${ch.oldCatName}`)
      console.log(`     → ${ch.newFullPath}`)
    }
    console.log()
  }

  // Apply
  if (!dryRun) {
    // Different thresholds: same branch moves are safer, cross-category needs higher confidence
    const safe = changes.filter(ch => {
      if (ch.type === "reassign") return ch.confidence >= 70
      if (ch.type === "orphan") return ch.confidence >= 50
      return ch.confidence >= 40 // deeper moves in same branch
    })
    console.log(`💾 ${safe.length} değişiklik uygulanıyor...`)

    const byId = new Map<string, string[]>()
    for (const ch of safe) {
      if (!byId.has(ch.newCatId)) byId.set(ch.newCatId, [])
      byId.get(ch.newCatId)!.push(ch.productId)
    }

    let updated = 0
    for (const [catId, ids] of byId) {
      const r = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { categoryId: catId } })
      updated += r.count
      process.stdout.write(`\r  ${updated}/${safe.length}`)
    }
    console.log(`\n✅ ${updated} ürün güncellendi`)
  } else {
    const safeCount = changes.filter(ch => {
      if (ch.type === "reassign") return ch.confidence >= 70
      if (ch.type === "orphan") return ch.confidence >= 50
      return ch.confidence >= 40
    }).length
    console.log(`🔍 DRY RUN — ${safeCount} değişiklik uygulanacak (--live ile çalıştırın)`)
  }

  await prisma.$disconnect()
}

main().catch(console.error)
