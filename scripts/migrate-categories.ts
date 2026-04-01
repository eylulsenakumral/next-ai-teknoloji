/**
 * Kategori Migration Scripti - Derinleştirilmiş Hiyerarşi (4-5 Seviye)
 *
 * Tüm ana kategoriler 4-5 seviye derinlikte tanımlanmıştır.
 * Örnek: CCTV > Kayıt Cihazı > NVR > 16 Kanal NVR
 *
 * Eski kategorileri soft-delete yapar, yeni kategori agacini olusturur,
 * urunleri yeni kategorilere eslestirir.
 *
 * Kullanim: npx tsx scripts/migrate-categories.ts
 * Dry-run:  npx tsx scripts/migrate-categories.ts --dry-run
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

// ============================================================================
// TYPES
// ============================================================================

interface CategoryNode {
  name: string
  slug: string
  keywords: string[]
  children?: CategoryNode[]
}

// ============================================================================
// DB CONNECTION (seed.ts pattern)
// ============================================================================

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ============================================================================
// CLI FLAGS
// ============================================================================

const DRY_RUN = process.argv.includes("--dry-run")

// ============================================================================
// NEW CATEGORY TREE
// ============================================================================

const NEW_CATEGORY_TREE: CategoryNode[] = [
  // -------------------------------------------------------------------------
  // 1. Guvenlik Sistemleri
  // -------------------------------------------------------------------------
  {
    name: "Guvenlik Sistemleri",
    slug: "guvenlik-sistemleri",
    keywords: ["guvenlik", "güvenlik"],
    children: [
      {
        name: "Kameralar",
        slug: "kameralar",
        keywords: ["kamera"],
        children: [
          {
            name: "IP Kameralar",
            slug: "ip-kameralar",
            keywords: ["ip kamera", "network kamera", "ağ kamerası"],
            children: [
              { name: "IP Dome Kamera", slug: "ip-dome-kamera", keywords: ["dome", "dome kamera", "tavan kamera"] },
              { name: "IP Bullet Kamera", slug: "ip-bullet-kamera", keywords: ["bullet", "bullet kamera", "duvar kamera"] },
              { name: "IP PTZ Kamera", slug: "ip-ptz-kamera", keywords: ["ptz", "speed dome", "motorlu"] },
              { name: "IP Turret Kamera", slug: "ip-turret-kamera", keywords: ["turret", "pigtail", "kovan"] },
              { name: "IP Fisheye Kamera", slug: "ip-fisheye-kamera", keywords: ["fisheye", "balık gözü", "360"] },
              { name: "IP Box Kamera", slug: "ip-box-kamera", keywords: ["box", "kutu kamera", "cs-mount"] },
            ],
          },
          {
            name: "HDCVI Kameralar",
            slug: "hdcvi-kameralar",
            keywords: ["hdcvi", "hd-cvi", "turbo hd"],
            children: [
              { name: "HDCVI Dome Kamera", slug: "hdcvi-dome-kamera", keywords: ["hdcvi dome", "turbo dome"] },
              { name: "HDCVI Bullet Kamera", slug: "hdcvi-bullet-kamera", keywords: ["hdcvi bullet", "turbo bullet"] },
              { name: "HDCVI PTZ Kamera", slug: "hdcvi-ptz-kamera", keywords: ["hdcvi ptz", "turbo ptz"] },
            ],
          },
          {
            name: "AHD Kameralar",
            slug: "ahd-kameralar",
            keywords: ["ahd"],
            children: [
              { name: "AHD Dome Kamera", slug: "ahd-dome-kamera", keywords: ["ahd dome"] },
              { name: "AHD Bullet Kamera", slug: "ahd-bullet-kamera", keywords: ["ahd bullet"] },
            ],
          },
          {
            name: "Termal Kameralar",
            slug: "termal-kameralar",
            keywords: ["termal", "thermal"],
            children: [
              { name: "Handheld Termal Kamera", slug: "handheld-termal", keywords: ["handheld termal", "el tipi termal", "taşınabilir termal"] },
              { name: "Sabit Termal Kamera", slug: "sabit-termal", keywords: ["sabit termal", "fixed thermal"] },
            ],
          },
          { name: "Plaka Tanıma Kameraları", slug: "plaka-tanima-kameralari", keywords: ["plaka tanıma", "anpr", "lpr", "plaka okuma"] },
        ],
      },
      {
        name: "Kayıt Cihazları",
        slug: "kayit-cihazlari",
        keywords: ["kayıt", "nvr", "dvr", "xvr", "kayit cihazi"],
        children: [
          { name: "NVR", slug: "nvr", keywords: ["nvr", "network video recorder"] },
          { name: "DVR", slug: "dvr", keywords: ["dvr", "digital video recorder"] },
          { name: "XVR", slug: "xvr", keywords: ["xvr", "tribrid", "pentabrid"] },
        ],
      },
      {
        name: "Hırsız Alarm Sistemleri",
        slug: "hirsiz-alarm-sistemleri",
        keywords: ["alarm", "hırsız alarm", "hirsiz alarm", "yangın alarm"],
        children: [
          { name: "Alarm Panelleri", slug: "alarm-panelleri", keywords: ["alarm panel", "alarm merkezi", "kontrol paneli"] },
          { name: "Alarm Dedektörleri", slug: "alarm-dedektorleri", keywords: ["dedektor", "pir", "manyetik kontak", "duman dedektor", "cam kırma", "titreşim"] },
          { name: "Siren ve Flaş", slug: "siren-ve-flas", keywords: ["siren", "flaş", "flare"] },
          { name: "Alarm Kumanda ve Tuş Takımı", slug: "alarm-kumanda-tus-takimi", keywords: ["kumanda", "tuş takımı", "keypad"] },
        ],
      },
      {
        name: "Geçiş Kontrol Sistemleri",
        slug: "gecis-kontrol-sistemleri",
        keywords: ["geçiş kontrol", "acces kontrol", "turnike", "kart okuyucu"],
        children: [
          { name: "Geçiş Kontrol Panelleri", slug: "gecis-kontrol-panelleri", keywords: ["geçiş kontrol panel", "access control panel"] },
          { name: "Kart Okuyucular", slug: "kart-okuyucular", keywords: ["kart okuyucu", "proximity", "mifare", "rfid okuyucu"] },
          { name: "Biyometrik Cihazlar", slug: "biyometrik-cihazlar", keywords: ["biyometrik", "parmak izi", "yüz tanıma", "face recognition"] },
          { name: "Turnikeler", slug: "turnikeler", keywords: ["turnike", "turnstile", "bariyer"] },
          { name: "Elektrikli Kilitler", slug: "elektrikli-kilitler", keywords: ["elektrikli kilit", "elektromanyetik kilit", "magnetic lock", "sürgülü kilit"] },
          { name: "Geçiş Kartları ve Anahtarlıklar", slug: "gecis-kartlari-ve-anahtarliklar", keywords: ["geçiş kartı", "anahtarlık", "proximity kart", "mifare kart"] },
        ],
      },
      {
        name: "Interkom ve Video Interkom",
        slug: "interkom-ve-video-interkom",
        keywords: ["interkom", "video interkom", "kapı telefonu", "door phone"],
        children: [
          { name: "IP Video Interkom", slug: "ip-video-interkom", keywords: ["ip interkom", "ip video interkom", "akıllı kapı telefonu"] },
          { name: "Analog Interkom", slug: "analog-interkom", keywords: ["analog interkom", "analog kapı telefonu"] },
          { name: "Interkom Aksesuarları", slug: "interkom-aksesuarlari", keywords: ["interkom aksesuar"] },
        ],
      },
      {
        name: "CCTV Aksesuarları",
        slug: "cctv-aksesuarlari",
        keywords: ["cctv aksesuar", "kamera aksesuar"],
        children: [
          { name: "Kamera Montaj Aparatları", slug: "kamera-montaj-aparatlari", keywords: ["montaj aparatı", "duvar braketi", "tavan braketi", "direk", "junction box"] },
          { name: "Kamera Muhafazaları", slug: "kamera-muhafazalari", keywords: ["kamera muhafaza", "housing", "koruyucu"] },
          { name: "Kamera Lensleri", slug: "kamera-lensleri", keywords: ["kamera lens", "objektif", "lens"] },
          { name: "CCTV Kabloları", slug: "cctv-kablolari", keywords: ["kombine kablo", "siyah kablo", "bnc konektor", "koaksiyel", "rg59"] },
          { name: "Video Balunlar", slug: "video-balunlar", keywords: ["balun", "video balun", "utp balun"] },
          { name: "CCTV Hard Diskler", slug: "cctv-hard-diskler", keywords: ["surveillance hdd", "cctv disk", "güvenlik disk", "wd purple", "seagate skyhawk"] },
          { name: "CCTV Monitörler", slug: "cctv-monitorler", keywords: ["cctv monitör", "güvenlik monitör", "gözetleme monitör"] },
        ],
      },
      {
        name: "Güç Kaynakları ve PoE",
        slug: "guvenlik-guc-kaynaklari",
        keywords: ["cctv güç", "kamera adaptör", "poe"],
        children: [
          { name: "CCTV Adaptörler", slug: "cctv-adaptorler", keywords: ["cctv adaptör", "kamera adaptör", "12v adaptör"] },
          { name: "CCTV Güç Dağıtım Kutuları", slug: "cctv-guc-dagitim-kutulari", keywords: ["güç dağıtım", "power distribution", "pdu"] },
          { name: "PoE İnjektörler", slug: "poe-injektorler", keywords: ["poe injektor", "poe injector"] },
          { name: "PoE Extender", slug: "poe-extender", keywords: ["poe extender", "poe uzatıcı"] },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 2. Network ve Iletisim
  // -------------------------------------------------------------------------
  {
    name: "Network ve Iletisim",
    slug: "network-ve-iletisim",
    keywords: ["network", "ağ", "iletişim"],
    children: [
      {
        name: "Switch",
        slug: "switch",
        keywords: ["switch", "anahtar"],
        children: [
          { name: "PoE Switch", slug: "poe-switch", keywords: ["poe switch", "poe anahtar", "power over ethernet"] },
          { name: "Unmanaged Switch", slug: "unmanaged-switch", keywords: ["unmanaged switch", "yönetilemez switch", "plug and play switch"] },
          { name: "Managed Switch", slug: "managed-switch", keywords: ["managed switch", "yönetilebilir switch", "l2 switch", "l3 switch"] },
          { name: "SFP Uplink Switch", slug: "sfp-uplink-switch", keywords: ["sfp switch", "fiber switch", "sfp uplink"] },
          { name: "Endustriyel Switch", slug: "endustriyel-switch", keywords: ["endüstriyel switch", "industrial switch", "din rail switch"] },
        ],
      },
      {
        name: "Kablosuz Ağlar",
        slug: "kablosuz-aglar",
        keywords: ["kablosuz", "wifi", "wireless", "wi-fi"],
        children: [
          { name: "Access Pointler", slug: "access-pointler", keywords: ["access point", "ap", "wifi ap", "kablosuz erişim noktası"] },
          { name: "Kablosuz Router", slug: "kablosuz-router", keywords: ["kablosuz router", "wifi router", "wifi router"] },
          { name: "Mesh Sistemler", slug: "mesh-sistemler", keywords: ["mesh", "mesh wifi", "mesh sistem"] },
          { name: "Kablosuz Controller", slug: "kablosuz-controller", keywords: ["wireless controller", "kablosuz kontrolcü", "wlc"] },
        ],
      },
      { name: "Router ve Gateway", slug: "router-ve-gateway", keywords: ["router", "gateway", "vpn router", "load balance", "hotspot"] },
      {
        name: "Fiber Optik Sistemler",
        slug: "fiber-optik-sistemler",
        keywords: ["fiber", "fiber optik", "fiber optic"],
        children: [
          { name: "Fiber Optik Kablolar", slug: "fiber-optik-kablolar", keywords: ["fiber kablo", "single mode", "multi mode", "sm fiber", "mm fiber"] },
          { name: "Fiber Patch Kablolar", slug: "fiber-patch-kablolar", keywords: ["fiber patch", "patch cord", "sc-sc", "sc-lc", "lc-lc"] },
          { name: "SFP Modüller", slug: "sfp-moduller", keywords: ["sfp", "sfp+", "sfp modül", "transceiver", "fiber modül"] },
          { name: "Media Converter", slug: "media-converter", keywords: ["media converter", "fiber dönüştürücü"] },
          { name: "Fiber Paneller ve Aksesuarlar", slug: "fiber-optik-paneller-aksesuarlar", keywords: ["odf", "fiber panel", "fiber kaseti", "fiber adaptör", "patch panel"] },
        ],
      },
      { name: "Yapısal Kablolama", slug: "yapisal-kablolama", keywords: ["yapısal kablo", "cat5e", "cat6", "cat6a", "patch kablo", "patch panel", "keystone", "rj45", "krimp"] },
      { name: "Network Kabinler", slug: "network-kabinler", keywords: ["network kabin", "rack", "server kabin", "duvar tipi kabin", "yer tipi kabin", "19 rack"] },
      { name: "Ağ Güvenliği", slug: "ag-guvenligi", keywords: ["firewall", "utm", "ağ güvenliği", "vpn firewall", "ids", "ips"] },
    ],
  },

  // -------------------------------------------------------------------------
  // 3. Bilgisayar Sistemleri
  // -------------------------------------------------------------------------
  {
    name: "Bilgisayar Sistemleri",
    slug: "bilgisayar-sistemleri",
    keywords: ["bilgisayar", "pc", "masaüstü", "dizüstü", "notebook", "sunucu", "laptop"],
    children: [
      { name: "Masaüstü Bilgisayarlar", slug: "masaustu-bilgisayarlar", keywords: ["masaüstü", "desktop", "tower pc", "masaustu bilgisayar", "all-in-one", "mini pc"] },
      { name: "Dizüstü Bilgisayarlar", slug: "dizustu-bilgisayarlar", keywords: ["notebook", "dizüstü", "laptop", "ultrabook"] },
      { name: "Sunucular", slug: "sunucular", keywords: ["sunucu", "server", "tower sunucu", "rack sunucu", "nas", "depolama sunucu"] },
      { name: "Monitörler", slug: "monitorler", keywords: ["monitör", "monitor", "ekran"] },
    ],
  },

  // -------------------------------------------------------------------------
  // 4. Bilgisayar Bilesenleri
  // -------------------------------------------------------------------------
  {
    name: "Bilgisayar Bilesenleri",
    slug: "bilgisayar-bilesenleri",
    keywords: ["bileşen", "bilesen", "donanım", "pc parça"],
    children: [
      { name: "İşlemciler", slug: "islemciler", keywords: ["işlemci", "cpu", "processor", "intel", "amd ryzen"] },
      { name: "Anakartlar", slug: "anakartlar", keywords: ["anakart", "motherboard", "mainboard"] },
      { name: "Bellek RAM", slug: "bellek-ram", keywords: ["ram", "bellek", "ddr4", "ddr5", "memory", "so-dimm"] },
      { name: "Depolama", slug: "depolama", keywords: ["ssd", "hdd", "depolama", "disk", "nvme", "sata", "usb bellek", "flash bellek", "hafıza kartı", "microsd", "taşınabilir disk"] },
      { name: "Ekran Kartları", slug: "ekran-kartlari", keywords: ["ekran kartı", "vga", "gpu", "nvidia", "geforce", "amd radeon", "grafik kartı"] },
      { name: "Kasalar", slug: "kasalar", keywords: ["kasa", "case", "mid tower", "mini tower", "micro atx"] },
      { name: "Güç Kaynakları PSU", slug: "guc-kaynaklari-psu", keywords: ["güç kaynağı", "psu", "power supply"] },
      { name: "Soğutma", slug: "sogutma", keywords: ["soğutma", "işlemci fanı", "kasa fanı", "termal macun", "cooling", "fan"] },
    ],
  },

  // -------------------------------------------------------------------------
  // 5. Yazicilar ve Tarayicilar
  // -------------------------------------------------------------------------
  {
    name: "Yazicilar ve Tarayicilar",
    slug: "yazicilar-ve-tarayicilar",
    keywords: ["yazıcı", "tarayıcı", "printer", "scanner"],
    children: [
      { name: "Yazıcılar", slug: "yazicilar", keywords: ["yazıcı", "printer", "lazer yazıcı", "mürekkep yazıcı", "tanklı", "kartuşlu", "çok fonksiyonlu", "etiket yazıcı", "pos yazıcı"] },
      { name: "Tarayıcılar", slug: "tarayicilar", keywords: ["tarayıcı", "scanner", "doküman tarayıcı"] },
      { name: "Yazıcı Sarfları", slug: "yazici-sarflari", keywords: ["toner", "kartuş", "mürekkep", "drum", "yazıcı sarf", "toner dolum"] },
      { name: "Projeksiyon", slug: "projeksiyon", keywords: ["projeksiyon", "projector", "projeksiyon cihazı"] },
    ],
  },

  // -------------------------------------------------------------------------
  // 6. Cevre Birimleri ve Aksesuarlar
  // -------------------------------------------------------------------------
  {
    name: "Cevre Birimleri ve Aksesuarlar",
    slug: "cevre-birimleri-ve-aksesuarlar",
    keywords: ["çevre birimi", "aksesuar", "peripheral"],
    children: [
      { name: "Klavye ve Mouse", slug: "klavye-ve-mouse", keywords: ["klavye", "mouse", "fare", "mouse set", "klavye mouse seti", "mouse pad"] },
      { name: "Kulaklık ve Mikrofon", slug: "kulaklik-ve-mikrofon", keywords: ["kulaklık", "mikrofon", "headset", "headphone", "masaüstü mikrofon"] },
      { name: "Webcam ve Kamera", slug: "webcam-ve-kamera", keywords: ["webcam", "web kamera"] },
      { name: "Hoparlörler", slug: "hoparlorler", keywords: ["hoparlör", "speaker", "ses sistemi"] },
      { name: "USB Hub ve Dongle", slug: "usb-hub-ve-dongle", keywords: ["usb hub", "usb ethernet", "usb wifi", "usb bluetooth", "dongle", "usb adaptör"] },
      { name: "Monitör Aparatları", slug: "monitor-aparatlari", keywords: ["monitör kol", "monitor stand", "vesa", "monitor kolu", "dual monitor"] },
      { name: "Notebook Aksesuarları", slug: "notebook-aksesuarlari", keywords: ["notebook çanta", "notebook soğutucu", "notebook stand", "docking station", "port replicator"] },
    ],
  },

  // -------------------------------------------------------------------------
  // 7. Kablo ve Konnektorler
  // -------------------------------------------------------------------------
  {
    name: "Kablo ve Konnektorler",
    slug: "kablo-ve-konnektorler",
    keywords: ["kablo", "konnektör", "connector", "kablo adaptör"],
    children: [
      { name: "Görüntü Kabloları", slug: "goruntu-kablolari", keywords: ["hdmi kablo", "displayport kablo", "vga kablo", "dvi kablo", "görüntü kablo"] },
      { name: "USB Kablolar", slug: "usb-kablolar", keywords: ["usb kablo", "usb-c", "usb-a", "usb uzatma"] },
      { name: "Dönüştürücüler", slug: "donusturuculer", keywords: ["dönüştürücü", "adaptör", "hubs", "usb-c multiport", "displayport adaptör", "hdmi adaptör"] },
      { name: "Ses Kabloları", slug: "ses-kablolari", keywords: ["ses kablo", "audio kablo", "aux", "jack kablo", "3.5mm"] },
      { name: "Güç Kabloları", slug: "guc-kablolari", keywords: ["güç kablo", "power kablo", "priz", "uzatma", "grup priz", "ups kablo"] },
      { name: "KVM Switch", slug: "kvm-switch", keywords: ["kvm", "kvm switch"] },
      { name: "HDMI Splitter ve Switch", slug: "hdmi-splitter-ve-switch", keywords: ["hdmi splitter", "hdmi switch", "hdmi extender", "hdmi dağıtıcı"] },
    ],
  },

  // -------------------------------------------------------------------------
  // 8. Guc ve Enerji
  // -------------------------------------------------------------------------
  {
    name: "Guc ve Enerji",
    slug: "guc-ve-enerji",
    keywords: ["güç", "ups", "voltaj", "enerji", "şarj"],
    children: [
      { name: "UPS", slug: "ups", keywords: ["ups", "kesintisiz güç", "uninterruptible", "ups akü"] },
      { name: "Voltaj Regülatörü", slug: "voltaj-regulatoru", keywords: ["voltaj regülatör", "regülatör", "stabilizatör", "avr"] },
      { name: "Adaptörler", slug: "adaptorler", keywords: ["adaptör", "notebook adaptör", "universal adaptör", "şarj adaptör"] },
      { name: "Şarj Cihazları", slug: "sarj-cihazlari", keywords: ["şarj", "şarj cihaz", "usb şarj", "powerbank", "güç bank"] },
    ],
  },

  // -------------------------------------------------------------------------
  // 9. Yazilim ve Lisans
  // -------------------------------------------------------------------------
  {
    name: "Yazilim ve Lisans",
    slug: "yazilim-ve-lisans",
    keywords: ["yazılım", "lisans", "software", "license"],
    children: [
      { name: "İşletim Sistemleri", slug: "isletim-sistemleri", keywords: ["windows", "işletim sistemi", "operating system", "windows server", "linux"] },
      { name: "Ofis Yazılımları", slug: "ofis-yazilimlari", keywords: ["office", "microsoft 365", "ofis yazılım"] },
      { name: "Güvenlik Yazılımları", slug: "guvenlik-yazilimlari", keywords: ["antivirüs", "endpoint", "virüs", "kaspersky", "security yazılım"] },
      { name: "VMS Yazılımları", slug: "vms-yazilimlari", keywords: ["vms", "video management", "kamera yazılım", "nvr yazılım", "gvms", "ivms"] },
    ],
  },

  // -------------------------------------------------------------------------
  // 10. POS ve Barkod Sistemleri
  // -------------------------------------------------------------------------
  {
    name: "POS ve Barkod Sistemleri",
    slug: "pos-ve-barkod-sistemleri",
    keywords: ["pos", "barkod", "fiş", "ödeme"],
    children: [
      { name: "Barkod Okuyucular", slug: "barkod-okuyucular", keywords: ["barkod okuyucu", "barkod tarayıcı", "barkod reader", "2d barkod"] },
      { name: "Barkod Yazıcılar", slug: "barkod-yazicilar", keywords: ["barkod yazıcı", "etiket yazıcı", "label printer"] },
      { name: "POS Terminalleri", slug: "pos-terminalleri", keywords: ["pos terminal", "ödeme terminal", "pos cihaz"] },
      { name: "Para Kasaları", slug: "para-kasalari", keywords: ["para kasası", "kasa", "cash drawer", "nakit kasa"] },
      { name: "Müşteri Ekranları", slug: "musteri-ekranlari", keywords: ["müşteri ekranı", "pole display", "customer display"] },
    ],
  },
]

// ============================================================================
// HELPERS
// ============================================================================

/** Flatten category tree into flat list with full path/depth info */
function flattenTree(
  nodes: CategoryNode[],
  parentPath: string = "",
  depth: number = 0,
  parentId: string | null = null,
  sortOrderBase: number = 0,
): Array<{
  node: CategoryNode
  parentPath: string
  fullPath: string
  depth: number
  parentId: string | null
  sortOrder: number
}> {
  const result: Array<{
    node: CategoryNode
    parentPath: string
    fullPath: string
    depth: number
    parentId: string | null
    sortOrder: number
  }> = []

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const fullPath = parentPath ? `${parentPath}/${node.slug}` : node.slug

    result.push({
      node,
      parentPath,
      fullPath,
      depth,
      parentId,
      sortOrder: sortOrderBase + i,
    })

    if (node.children?.length) {
      const childItems = flattenTree(node.children, fullPath, depth + 1, null, 0)
      result.push(...childItems)
    }
  }

  return result
}

/** Extract all keywords from all leaf-to-root paths for matching */
function buildKeywordMap(
  nodes: CategoryNode[],
  parentPath: string = "",
  depth: number = 0,
): Map<string, { slug: string; depth: number; fullPath: string }> {
  const map = new Map<string, { slug: string; depth: number; fullPath: string }>()

  for (const node of nodes) {
    const fullPath = parentPath ? `${parentPath}/${node.slug}` : node.slug

    for (const kw of node.keywords) {
      const normalizedKw = kw.toLowerCase()
      const existing = map.get(normalizedKw)
      // Prefer deeper (more specific) category
      if (!existing || depth > existing.depth) {
        map.set(normalizedKw, { slug: node.slug, depth, fullPath })
      }
    }

    if (node.children?.length) {
      const childMap = buildKeywordMap(node.children, fullPath, depth + 1)
      for (const [kw, data] of childMap) {
        const existing = map.get(kw)
        if (!existing || data.depth > existing.depth) {
          map.set(kw, data)
        }
      }
    }
  }

  return map
}

/** Match a product name to the best category */
function matchProductToCategory(
  productName: string,
  keywordMap: Map<string, { slug: string; depth: number; fullPath: string }>,
): { slug: string; confidence: number } | null {
  const normalized = productName.toLowerCase()
  let bestMatch: { slug: string; depth: number; confidence: number } | null = null

  for (const [keyword, data] of keywordMap) {
    if (normalized.includes(keyword)) {
      // Score based on keyword length (longer = more specific) and depth
      const confidence = keyword.length * 10 + data.depth * 5

      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { slug: data.slug, depth: data.depth, confidence }
      }
    }
  }

  return bestMatch ? { slug: bestMatch.slug, confidence: bestMatch.confidence } : null
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("=".repeat(70))
  console.log("  KATEGORI MIGRATION SCRIPT")
  console.log("=".repeat(70))
  console.log(`  Mode: ${DRY_RUN ? "DRY RUN (no changes)" : "LIVE"}`)
  console.log("=".repeat(70))

  const startTime = Date.now()

  // -------------------------------------------------------------------------
  // PHASE 0: Collect stats before migration
  // -------------------------------------------------------------------------
  console.log("\n[PHASE 0] Mevcut durum analiz ediliyor...")

  const existingCategories = await prisma.category.count({
    where: { deletedAt: null },
  })
  const existingProducts = await prisma.product.count({
    where: { deletedAt: null },
  })
  const productsWithCategory = await prisma.product.count({
    where: { deletedAt: null, categoryId: { not: null } },
  })

  console.log(`  Mevcut kategoriler (active): ${existingCategories}`)
  console.log(`  Mevcut urunler (active):    ${existingProducts}`)
  console.log(`  Kategorili urunler:          ${productsWithCategory}`)

  // -------------------------------------------------------------------------
  // PHASE 1: Soft-delete old categories
  // -------------------------------------------------------------------------
  console.log("\n[PHASE 1] Eski kategoriler soft-delete yapiliyor...")

  if (!DRY_RUN) {
    const softDeleteResult = await prisma.category.updateMany({
      where: {
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    })
    console.log(`  ${softDeleteResult.count} kategori soft-delete yapildi.`)
  } else {
    console.log(`  [DRY RUN] ${existingCategories} kategori soft-delete yapilacak.`)
  }

  // -------------------------------------------------------------------------
  // PHASE 2: Create new category tree
  // -------------------------------------------------------------------------
  console.log("\n[PHASE 2] Yeni kategori agaci olusturuluyor...")

  const flatCategories = flattenTree(NEW_CATEGORY_TREE)
  const slugToIdMap = new Map<string, string>()
  let createdCount = 0
  let updatedCount = 0

  for (const item of flatCategories) {
    // For top-level items, parentId is null
    // For child items, parentId comes from the parent's slug (resolved from fullPath)
    let actualParentId: string | null = null
    if (item.depth > 0) {
      // Get parent slug from fullPath
      const pathParts = item.fullPath.split("/")
      const parentSlug = pathParts[pathParts.length - 2]
      actualParentId = slugToIdMap.get(parentSlug) ?? null
    }

    if (DRY_RUN) {
      console.log(`  [DRY RUN] ${"  ".repeat(item.depth)}${item.node.name} (${item.node.slug}) depth=${item.depth}`)
      slugToIdMap.set(item.node.slug, `dry-run-id-${item.node.slug}`)
      createdCount++
      continue
    }

    // Check if category exists (not soft-deleted) before upsert
    const existingCat = await prisma.category.findFirst({
      where: { slug: item.node.slug },
    })

    const category = await prisma.category.upsert({
      where: { slug: item.node.slug },
      update: {
        name: item.node.name,
        parentId: actualParentId,
        depth: item.depth,
        path: item.fullPath,
        isActive: true,
        sortOrder: item.sortOrder,
        deletedAt: null,
      },
      create: {
        name: item.node.name,
        slug: item.node.slug,
        parentId: actualParentId,
        depth: item.depth,
        path: item.fullPath,
        isActive: true,
        sortOrder: item.sortOrder,
      },
    })

    slugToIdMap.set(item.node.slug, category.id)

    if (!existingCat || existingCat.deletedAt) {
      createdCount++
    } else {
      updatedCount++
    }

    console.log(`  ${"  ".repeat(item.depth)}${item.node.name} (${item.node.slug}) depth=${item.depth}`)
  }

  console.log(`  Olusturulan: ${createdCount}, Guncellenen: ${updatedCount}`)

  // -------------------------------------------------------------------------
  // PHASE 2.5: Create "Diger Urunler" fallback category
  // -------------------------------------------------------------------------
  console.log("\n[PHASE 2.5] Diger Urunler kategorisi kontrol ediliyor...")

  let digerCategoryId: string | null = null

  if (!DRY_RUN) {
    const digerCategory = await prisma.category.upsert({
      where: { slug: "diger-urunler" },
      update: {
        name: "Diger Urunler",
        depth: 0,
        path: "diger-urunler",
        isActive: true,
        deletedAt: null,
      },
      create: {
        name: "Diger Urunler",
        slug: "diger-urunler",
        depth: 0,
        path: "diger-urunler",
        isActive: true,
      },
    })
    digerCategoryId = digerCategory.id
    console.log(`  Diger Urunler kategorisi: ${digerCategoryId}`)
  } else {
    digerCategoryId = "dry-run-diger"
    console.log(`  [DRY RUN] Diger Urunler kategorisi olusturulacak.`)
  }

  // -------------------------------------------------------------------------
  // PHASE 3: Match products to new categories
  // -------------------------------------------------------------------------
  console.log("\n[PHASE 3] Urunler yeni kategorilere eslestiriliyor...")

  const keywordMap = buildKeywordMap(NEW_CATEGORY_TREE)
  console.log(`  Keyword map olusturuldu: ${keywordMap.size} keyword`)

  // Fetch all active products (batched)
  const BATCH_SIZE = 500
  let totalProcessed = 0
  let matchedCount = 0
  let unmatchedCount = 0
  const unmatchedProducts: string[] = []

  let skip = 0
  let hasMore = true

  while (hasMore) {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      skip,
      take: BATCH_SIZE,
      orderBy: { createdAt: "asc" },
    })

    if (products.length === 0) {
      hasMore = false
      break
    }

    for (const product of products) {
      const match = matchProductToCategory(product.name, keywordMap)

      if (match && slugToIdMap.has(match.slug)) {
        const categoryId = slugToIdMap.get(match.slug)!

        if (!DRY_RUN) {
          await prisma.product.update({
            where: { id: product.id },
            data: { categoryId },
          })
        }

        matchedCount++
      } else if (digerCategoryId) {
        if (!DRY_RUN) {
          await prisma.product.update({
            where: { id: product.id },
            data: { categoryId: digerCategoryId },
          })
        }

        unmatchedCount++
        if (unmatchedProducts.length < 50) {
          unmatchedProducts.push(product.name)
        }
      }

      totalProcessed++
    }

    skip += BATCH_SIZE
    console.log(`  Islem tamamlandi: ${totalProcessed} / ~${existingProducts} urun...`)
  }

  console.log(`  Eslesen urunler:    ${matchedCount}`)
  console.log(`  Eslesmeyen urunler: ${unmatchedCount} (Diger Urunler kategorisine atandi)`)

  if (unmatchedProducts.length > 0) {
    console.log("\n  Eslesmeyen urun ornekleri (ilk 50):")
    for (const name of unmatchedProducts) {
      console.log(`    - ${name}`)
    }
  }

  // -------------------------------------------------------------------------
  // PHASE 4: Report empty categories
  // -------------------------------------------------------------------------
  console.log("\n[PHASE 4] Bos kategori raporu...")

  if (!DRY_RUN) {
    const allNewCategories = await prisma.category.findMany({
      where: { deletedAt: null },
      select: { id: true, slug: true, name: true, depth: true, path: true },
    })

    const categoryProductCounts = await prisma.product.groupBy({
      by: ["categoryId"],
      where: { deletedAt: null, categoryId: { not: null } },
      _count: { id: true },
    })

    const countMap = new Map<string, number>()
    for (const row of categoryProductCounts) {
      if (row.categoryId) {
        countMap.set(row.categoryId, row._count.id)
      }
    }

    const emptyCategories = allNewCategories.filter(
      (cat) => !countMap.has(cat.id) || countMap.get(cat.id) === 0
    )

    console.log(`  Bos kategoriler: ${emptyCategories.length} / ${allNewCategories.length}`)
    if (emptyCategories.length > 0) {
      for (const cat of emptyCategories) {
        console.log(`    - ${cat.name} (${cat.slug}) depth=${cat.depth}`)
      }
    }

    // -------------------------------------------------------------------------
    // PHASE 5: Per-category breakdown
    // -------------------------------------------------------------------------
    console.log("\n[PHASE 5] Kategori bazli urun dagilimi...")

    const topLevelCategories = allNewCategories.filter((c) => c.depth === 0)
    for (const topCat of topLevelCategories) {
      // Collect all descendant slugs
      const descendantSlugs = allNewCategories
        .filter((c) => c.path?.startsWith(topCat.slug))
        .map((c) => c.id)

      const total = await prisma.product.count({
        where: { deletedAt: null, categoryId: { in: descendantSlugs } },
      })

      console.log(`  ${topCat.name}: ${total} urun`)
    }
  }

  // -------------------------------------------------------------------------
  // FINAL REPORT
  // -------------------------------------------------------------------------
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log("\n" + "=".repeat(70))
  console.log("  MIGRATION RAPORU")
  console.log("=".repeat(70))
  console.log(`  Mode:            ${DRY_RUN ? "DRY RUN" : "LIVE"}`)
  console.log(`  Sure:            ${elapsed}s`)
  console.log(`  Eski kategori:   ${existingCategories} adet soft-delete`)
  console.log(`  Yeni kategori:   ${createdCount} olusturuldu, ${updatedCount} guncellendi`)
  console.log(`  Toplam urun:     ${totalProcessed}`)
  console.log(`  Eslesen:         ${matchedCount} urun yeni kategorisine atandi`)
  console.log(`  Eslesmeyen:      ${unmatchedCount} urun -> Diger Urunler`)
  console.log("=".repeat(70))

  if (DRY_RUN) {
    console.log("\n  *** DRY RUN tamamlandi. Degisiklik yapilmadi. ***")
    console.log('  Calistirmak icin: npx tsx scripts/migrate-categories.ts')
  } else {
    console.log("\n  *** Migration tamamlandi. ***")
  }
}

// ============================================================================
// RUN
// ============================================================================

main()
  .catch((e) => {
    console.error("\n[FATAL] Migration hatasi:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
