/**
 * Kategori Eşleştirme Utility
 * Tedarikçi kategorilerini bizim kategori ağacına eşleştirir
 * Eşleşme bulunamazsa otomatik kategori oluşturur
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface CategoryMapping {
  supplierCategory: string
  supplierGroup: string
  ourCategoryId: string
  ourCategoryName: string
  confidence: number
}

interface CachedCategory {
  id: string
  name: string
  slug: string
  path: string
  parentId: string | null
  depth: number
}

// Manuel mapping tablosu (hızlı eşleştirme için)
const MANUAL_MAPPINGS: Record<string, Record<string, string>> = {
  indexgrup: {
    "Bilgisayar > Masaüstü PC": "masaustu-bilgisayar",
    "Bilgisayar > Notebook": "notebook",
    "Bilgisayar > Monitör": "monitor",
    "Bilgisayar > Tablet": "tablet",
    "Bilgisayar > İş İstasyonu": "masaustu-bilgisayar",
    "Bilgisayar > Mini PC": "mini-pc",
    "Bilgisayar Bileşenleri > İşlemci": "islemci",
    "Bilgisayar Bileşenleri > Anakart": "anakart",
    "Bilgisayar Bileşenleri > Bellek": "bellek-ram",
    "Bilgisayar Bileşenleri > Ekran Kartı": "ekran-karti",
    "Bilgisayar Bileşenleri > Kasa": "kasa",
    "Bilgisayar Bileşenleri > Güç Kaynağı": "guc-kaynagi-psu",
    "Bilgisayar Bileşenleri > Soğutma": "sogutma",
    "Bilgisayar Bileşenleri > SSD": "nvme-m-2",
    "Bilgisayar Bileşenleri > HDD": "hdd-masaustu",
  },
  netex: {
    "Bilgisayar > Sunucu": "sunucu",
    "Bilgisayar > Tower Sunucu": "tower-sunucu",
    "Bilgisayar > Rack Sunucu": "rack-sunucu",
    "Bilgisayar > NAS": "nas-depolama-sunucusu",
  },
}

// Tedarikçi kategori yolu → ana kategori eşleştirme (keyword bazlı)
const ROOT_CATEGORY_KEYWORDS: Record<string, string[]> = {
  "cctv": ["kamera", "cctv", "ip kamera", "dvr", "nvr", "xvr", "hdcvı", "ahd", "analog kamera", "termal", "panomorfik", "lpr", "plaka", "ptz", "fisheye", "bullet", "dome", "turret", "kayıt cihazı", "video surve"],
  "bilgisayar-sunucu": ["bilgisayar", "notebook", "laptop", "masaüstü", "pc", "sunucu", "server", "monitör", "tablet", "all-in-one", "mini pc", "barebone", "tower pc", "chromebook", "gaming notebook", "iş notebooku", "ultrabook", "aıo", "aio", "iş istasyonu"],
  "pc-bilesenleri": ["bileşen", "işlemci", "anakart", "bellek", "ram", "ekran kartı", "kasa", "güç kaynağı", "psu", "soğutma", "ssd", "hdd", "nvme", "depolama", "disk", "kart okuyucu", "hafıza kartı", "usb bellek", "taşınabilir disk", "genişleme kartı"],
  "network-fiber": ["ağ", "network", "switch", "router", "fiber", "kablosuz", "access point", "kablolama", "patch", "sfp", "rj45", "cat5", "cat6", "media converter", "kabin", "firewall", "vpn", "poE", "endüstriyel switch", "ups", "circuit", "ethernet", "ucs server"],
  "yazici-tarayici": ["yazıcı", "tarayıcı", "printer", "scanner", "lazer", "mürekkep", "toner", "kartuş", "drum", "projeksiyon", "baskı", "fiş okuyucu", "3d tarayıcı", "pos yazıcı", "etiket yazıcı", "barkod yazıcı", "sarfiyat"],
  "gecis-kontrol-alarm": ["geçiş", "kontrol", "alarm", "hırsız", "yangın", "turnike", "bariyer", "kart okuyucu", "biyometrik", "parmak izi", "yüz tanıma", "interkom", "kilit", "dedektör", "siren", "pır", "manyetik", "duman", "otopark", "kapı istasyonu", "access control"],
  "guc-elektronigi": ["güç", "ups", "regülatör", "adaptör", "şarj", "pil", "akü", "güneş", "solar", "voltaj", "powerbank", "kesintisiz", "invertör"],
  "kablo-aksesuar": ["kablo", "hdmi", "displayport", "usb", "vga", "dvi", "ses kablosu", "dönüştürücü", "kvm", "splitter", "hub", "dongle", "converter", "priz", "uzatma", "ieC"],
  "cevre-birimleri-aksesuar": ["çevre birim", "klavye", "mouse", "kulaklık", "webcam", "hoparlör", "monitör a", "notebook çanta", "dock", "akıllı ev", "akıllı priz", "akıllı ampul", "stand", "soundbar", "mikrofon", "speaker", "mic"],
  "yazilim-lisans": ["yazılım", "lisans", "windows", "office", "antivirüs", "vms", "grafik", "autocad", "adobe", "linux", "işletim", "yedekleme", "corel"],
  "pos-barkod": ["pos", "barkod", "okuyucu", "para kasası", "fiş yazıcı", "müşteri ekranı", "ödeme terminali", "datakart", "mobil pos", "tablet pos", "termal"],
  "akilli-sistemler": ["akıllı", "iot", "nesne tanıma", "hareket analizi", "insan sayma", "sensör", "görüntü analizi", "plaka tanıma", "yüz tanıma terminali", "görüntü işleme"],
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 200)
}

export class CategoryMatcher {
  private categoryCache: Map<string, CachedCategory> = new Map()
  private rootCategories: CachedCategory[] = []
  private autoCreateCount = 0

  async init() {
    const categories = await prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, name: true, slug: true, path: true, parentId: true, depth: true },
    })

    this.categoryCache.clear()
    this.rootCategories = []

    for (const cat of categories) {
      const cached: CachedCategory = {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        path: cat.path ?? "",
        parentId: cat.parentId,
        depth: cat.depth,
      }
      this.categoryCache.set(cat.slug, cached)
      this.categoryCache.set(cat.name.toLowerCase(), cached)
      if (cat.depth === 0) {
        this.rootCategories.push(cached)
      }
    }

    console.log(`✅ ${categories.length} kategori cache'e yüklendi (${this.rootCategories.length} root)`)
  }

  /**
   * Tedarikçi kategorisini bizim kategoriye eşleştir
   * Eşleşme yoksa otomatik kategori oluşturur
   */
  async match(
    supplierCode: string,
    supplierCategory: string,
    supplierGroup: string
  ): Promise<string | null> {
    const key = `${supplierCategory} > ${supplierGroup}`

    // 1. Manuel mapping'den bak
    const manualSlug = MANUAL_MAPPINGS[supplierCode.toLowerCase()]?.[key]
    if (manualSlug) {
      const category = this.categoryCache.get(manualSlug)
      if (category) {
        return category.id
      }
    }

    // 2. Fuzzy match
    const fuzzyId = this.fuzzyMatch(supplierCategory, supplierGroup)
    if (fuzzyId) {
      return fuzzyId
    }

    // 3. Eşleşme bulunamadı → otomatik kategori oluştur
    console.log(`🔄 Eşleşme yok, otomatik kategori oluşturuluyor: "${key}"`)
    return this.autoCreateCategory(supplierCategory, supplierGroup)
  }

  /**
   * En uygun ana kategoriyi bul (keyword matching)
   */
  private findBestParent(supplierCategory: string, supplierGroup: string): CachedCategory | null {
    const searchText = `${supplierCategory} ${supplierGroup}`.toLowerCase()

    let bestMatch: CachedCategory | null = null
    let bestScore = 0

    for (const [rootSlug, keywords] of Object.entries(ROOT_CATEGORY_KEYWORDS)) {
      let score = 0
      for (const keyword of keywords) {
        if (searchText.includes(keyword)) {
          score += keyword.length // daha uzun keyword = daha spesifik
        }
      }
      if (score > bestScore) {
        bestScore = score
        bestMatch = this.categoryCache.get(rootSlug) ?? null
      }
    }

    return bestMatch
  }

  /**
   * Parent altında yeni kategori oluştur
   */
  private async autoCreateCategory(
    supplierCategory: string,
    supplierGroup: string
  ): Promise<string | null> {
    // En uygun ana kategoriyi bul
    const parentCategory = this.findBestParent(supplierCategory, supplierGroup)

    if (!parentCategory) {
      // SAFETY: parent bulunamadıysa root kategori oluşturma — sadece seed script yapabilir
      console.warn(`⚠️  Ana kategori bulunamadı, root kategori oluşturulmayacak: "${supplierCategory} > ${supplierGroup}"`)
      return null
    }

    // Grup adından kategori oluştur
    const groupName = supplierGroup.trim()
    const groupSlug = generateSlug(groupName)
    const existingSlug = `${parentCategory.slug}-${groupSlug}`

    // Zaten var mı kontrol et
    const existing = this.categoryCache.get(existingSlug)
    if (existing) {
      return existing.id
    }

    // Name-based kontrol
    const existingByName = this.categoryCache.get(groupName.toLowerCase())
    if (existingByName && existingByName.parentId === parentCategory.id) {
      return existingByName.id
    }

    // Yeni kategori oluştur
    const parentPath = parentCategory.path ? `${parentCategory.path}/${parentCategory.slug}` : parentCategory.slug
    const newPath = `${parentPath}/${groupSlug}`
    const newDepth = parentCategory.depth + 1

    // SAFETY: depth=0 root kategoriler asla otomatik oluşturulmamalı
    if (newDepth === 0) {
      console.warn(`⛔ Root kategori (depth=0) oluşturma engellendi: "${groupName}" — yalnızca seed script root kategori ekleyebilir`)
      return null
    }

    try {
      const newCat = await prisma.category.create({
        data: {
          name: groupName,
          slug: existingSlug,
          parentId: parentCategory.id,
          depth: newDepth,
          path: newPath,
          isActive: true,
          sortOrder: 999,
        },
        select: { id: true, name: true, slug: true, path: true, parentId: true, depth: true },
      })

      const cached: CachedCategory = {
        id: newCat.id,
        name: newCat.name,
        slug: newCat.slug,
        path: newCat.path ?? "",
        parentId: newCat.parentId,
        depth: newCat.depth,
      }

      // Cache'e ekle
      this.categoryCache.set(newCat.slug, cached)
      this.categoryCache.set(newCat.name.toLowerCase(), cached)

      this.autoCreateCount++
      console.log(`  ✨ Yeni kategori: "${groupName}" → ${parentCategory.name} altında (depth=${newDepth})`)

      return newCat.id
    } catch (err) {
      console.error(`  ❌ Kategori oluşturma hatası: "${groupName}"`, err instanceof Error ? err.message : err)
      return null
    }
  }

  /**
   * Fuzzy matching (kelime bazlı eşleştirme)
   */
  private fuzzyMatch(category: string, group: string): string | null {
    const searchTerms = [
      category.toLowerCase(),
      group.toLowerCase(),
      `${category} ${group}`.toLowerCase(),
    ]

    for (const term of searchTerms) {
      // Tam eşleşme dene
      for (const [key, cat] of this.categoryCache.entries()) {
        if (key === term || cat.name.toLowerCase() === term) {
          return cat.id
        }
      }
    }

    // Kısmi eşleşme (kelime bazlı, en az 4 karakter)
    const keywords = searchTerms
      .join(" ")
      .split(/[\s\-\_]+/)
      .filter((w) => w.length > 3)

    let bestMatch: { id: string; name: string; score: number } | null = null

    for (const keyword of keywords) {
      for (const [key, cat] of this.categoryCache.entries()) {
        if (key.includes(keyword) || cat.name.toLowerCase().includes(keyword) || cat.slug.includes(keyword)) {
          const score = keyword.length
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { id: cat.id, name: cat.name, score }
          }
        }
      }
    }

    if (bestMatch) {
      return bestMatch.id
    }

    return null
  }

  getAutoCreateCount(): number {
    return this.autoCreateCount
  }

  async disconnect() {
    await prisma.$disconnect()
  }
}
