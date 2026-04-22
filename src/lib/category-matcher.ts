/**
 * Kategori Eşleştirme Utility
 * Tedarikçi kategorilerini bizim kategori ağacına eşleştirir
 * Eşleşme bulunamazsa null döner (otomatik kategori oluşturmaz)
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

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
    "Bilgisayar Bileşenleri > Anakart": "anakartlar-1",
    "Bilgisayar Bileşenleri > Bellek": "bellek-ram",
    "Bilgisayar Bileşenleri > Ekran Kartı": "ekran-kartlari-1",
    "Bilgisayar Bileşenleri > Kasa": "bilgisayar-kasalari",
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

export class CategoryMatcher {
  private categoryCache: Map<string, CachedCategory> = new Map()

  async init(): Promise<void> {
    // Her çağrıda cache'i temizle (stale data'yı önle)
    this.categoryCache.clear()

    const categories = await prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, name: true, slug: true, path: true, parentId: true, depth: true },
    })

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
    }

    console.log(`✅ ${categories.length} kategori cache'e yüklendi`)
  }

  /**
   * Tedarikçi kategorisini bizim kategoriye eşleştir
   * Eşleşme bulunamazsa null döner (otomatik kategori oluşturmaz)
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

    // 3. Eşleşme bulunamadı → null döndür (otomatik kategori oluşturulmaz)
    return null
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

  async disconnect() {
    await prisma.$disconnect()
  }
}
