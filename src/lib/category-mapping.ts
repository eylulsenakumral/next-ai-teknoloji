/**
 * Category Mapping Utility
 * Tedarikçi kategori eşleştirmelerini JSON cache'den yükler/kaydeder
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { resolve, dirname } from "path"

// Cache dosyasının proje kökündeki yolu
const CACHE_PATH = resolve(process.cwd(), "data/category-mappings.json")

export interface CategoryMappingEntry {
  categoryId: string
  categoryPath: string
  confidence: number
  method: "exact_match" | "fuzzy_match" | "keyword_match" | "manual_review"
}

export interface CategoryMappingsFile {
  version: number
  updatedAt: string
  mappings: {
    indexgrup: Record<string, CategoryMappingEntry>
    netex: Record<string, CategoryMappingEntry>
  }
  unmapped: {
    indexgrup: string[]
    netex: string[]
  }
}

const EMPTY_MAPPINGS: CategoryMappingsFile = {
  version: 1,
  updatedAt: new Date().toISOString(),
  mappings: {
    indexgrup: {},
    netex: {},
  },
  unmapped: {
    indexgrup: [],
    netex: [],
  },
}

/**
 * JSON cache'den mapping'leri yükle.
 * Dosya yoksa ya da bozuksa boş yapıyı döner.
 */
export function loadMappings(): CategoryMappingsFile {
  if (!existsSync(CACHE_PATH)) {
    return structuredClone(EMPTY_MAPPINGS)
  }

  try {
    const raw = readFileSync(CACHE_PATH, "utf-8")
    const parsed = JSON.parse(raw) as CategoryMappingsFile

    // Temel yapı kontrolü
    if (!parsed.mappings || !parsed.unmapped) {
      console.warn("[category-mapping] Cache dosyası bozuk, sıfırlanıyor.")
      return structuredClone(EMPTY_MAPPINGS)
    }

    // Eksik supplier anahtarlarını tamamla
    parsed.mappings.indexgrup ??= {}
    parsed.mappings.netex ??= {}
    parsed.unmapped.indexgrup ??= []
    parsed.unmapped.netex ??= []

    return parsed
  } catch {
    console.warn("[category-mapping] Cache okunamadı, sıfırlanıyor.")
    return structuredClone(EMPTY_MAPPINGS)
  }
}

/**
 * Belirli bir tedarikçi kategorisi için eşleşme bul.
 * @param supplier "indexgrup" | "netex"
 * @param categoryName "Kategori > Grup" formatında
 */
export function findMapping(
  supplier: string,
  categoryName: string
): CategoryMappingEntry | null {
  const data = loadMappings()
  const supplierKey = normalizeSupplierKey(supplier)

  if (!(supplierKey in data.mappings)) {
    return null
  }

  const entry = data.mappings[supplierKey as keyof typeof data.mappings][categoryName]
  return entry ?? null
}

/**
 * Mapping'leri JSON cache'e kaydet.
 * data/ klasörü yoksa oluşturur.
 */
export function saveMappings(mappings: CategoryMappingsFile): void {
  const dir = dirname(CACHE_PATH)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const output: CategoryMappingsFile = {
    ...mappings,
    updatedAt: new Date().toISOString(),
  }

  writeFileSync(CACHE_PATH, JSON.stringify(output, null, 2), "utf-8")
}

/**
 * Mevcut mapping'e yeni girişler ekle (merge).
 * Var olan girişlerin üzerine yazar.
 */
export function mergeMappings(
  supplier: string,
  newEntries: Record<string, CategoryMappingEntry>,
  unmapped: string[]
): void {
  const data = loadMappings()
  const supplierKey = normalizeSupplierKey(supplier) as keyof typeof data.mappings

  if (!(supplierKey in data.mappings)) {
    console.warn(`[category-mapping] Bilinmeyen supplier: ${supplier}`)
    return
  }

  data.mappings[supplierKey] = {
    ...data.mappings[supplierKey],
    ...newEntries,
  }

  // unmapped'den eşleşenleri çıkar, yenileri ekle
  const existing = new Set(data.unmapped[supplierKey])
  for (const key of Object.keys(newEntries)) {
    existing.delete(key)
  }
  for (const key of unmapped) {
    if (!(key in data.mappings[supplierKey])) {
      existing.add(key)
    }
  }
  data.unmapped[supplierKey] = Array.from(existing)

  saveMappings(data)
}

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

function normalizeSupplierKey(supplier: string): string {
  return supplier.toLowerCase().replace(/[\s-]+/g, "")
}
