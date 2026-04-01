/**
 * Tedarikçi Kategori Eşleştirici
 *
 * Kullanım:
 *   npx tsx scripts/map-supplier-categories.ts
 *   npx tsx scripts/map-supplier-categories.ts --supplier indexgrup
 *   npx tsx scripts/map-supplier-categories.ts --supplier netex
 *   npx tsx scripts/map-supplier-categories.ts --dry-run
 *   npx tsx scripts/map-supplier-categories.ts --min-confidence 0.7
 *
 * Strateji:
 *   1. Exact match (normalize + compare)              → confidence 1.0
 *   2. Fuzzy match (Levenshtein similarity)           → confidence 0.6-0.99
 *   3. Keyword overlap scoring                        → confidence 0.4-0.75
 *   4. OpenAI (OPENAI_API_KEY varsa)                  → confidence 0.8+
 *   5. < MIN_CONFIDENCE → "manual_review" olarak işaretle
 */

import "dotenv/config"
import { Pool } from "pg"
import { existsSync, mkdirSync } from "fs"
import { resolve } from "path"
import { saveMappings, loadMappings } from "../src/lib/category-mapping"
import type { CategoryMappingEntry, CategoryMappingsFile } from "../src/lib/category-mapping"
import { IndexGrupXmlClient } from "../workers/scraper/suppliers/indexgrup-xml-v2"
import { NetexXmlClient } from "../workers/scraper/suppliers/netex-xml-v2"

// -----------------------------------------------------------------------
// Config
// -----------------------------------------------------------------------

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/nextai"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? ""
const MIN_CONFIDENCE = parseFloat(process.env.MIN_CONFIDENCE ?? "0.6")
const DATA_DIR = resolve(process.cwd(), "data")

// CLI args
const args = process.argv.slice(2)
const SUPPLIER_FILTER = args.includes("--supplier")
  ? args[args.indexOf("--supplier") + 1]
  : null
const DRY_RUN = args.includes("--dry-run")
const CUSTOM_MIN_CONF = args.includes("--min-confidence")
  ? parseFloat(args[args.indexOf("--min-confidence") + 1])
  : MIN_CONFIDENCE

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

interface OurCategory {
  id: string
  name: string
  slug: string
  path: string | null
  depth: number
}

interface SupplierCategoryEntry {
  key: string        // "CategoryName > GroupName"
  category: string
  group: string
}

interface MatchResult {
  key: string
  entry: CategoryMappingEntry | null
  isUnmapped: boolean
}

// -----------------------------------------------------------------------
// Database
// -----------------------------------------------------------------------

const pool = new Pool({ connectionString: DATABASE_URL })

async function getOurCategories(): Promise<OurCategory[]> {
  const result = await pool.query<OurCategory>(
    `SELECT id, name, slug, path, depth
     FROM categories
     WHERE deleted_at IS NULL AND is_active = true
     ORDER BY depth ASC, path ASC`
  )
  return result.rows
}

// -----------------------------------------------------------------------
// Supplier Category Extraction
// -----------------------------------------------------------------------

/**
 * Benzersiz kategori çiftlerini döner: "KATEGORI > GRUP"
 * getAllProducts() çağrısı maliyetli olduğundan kategoriyi ilk üründen çekeriz.
 */
async function extractIndexGrupCategories(): Promise<SupplierCategoryEntry[]> {
  console.log("  Index Grup XML'den katalog çekiliyor (op=k)...")

  // Sadece catalog endpoint — stok/fiyat gerekmez
  const client = new IndexGrupXmlClient()
  const products = await client.getCatalog()

  const seen = new Set<string>()
  const entries: SupplierCategoryEntry[] = []

  for (const p of products) {
    if (!p.categoryName && !p.groupName) continue
    const cat = p.categoryName ?? ""
    const grp = p.groupName ?? ""
    const key = `${cat} > ${grp}`
    if (!seen.has(key)) {
      seen.add(key)
      entries.push({ key, category: cat, group: grp })
    }
  }

  return entries
}

async function extractNetexCategories(): Promise<SupplierCategoryEntry[]> {
  console.log("  Netex XML'den katalog çekiliyor (op=k)...")

  const client = new NetexXmlClient()
  const products = await client.getCatalog()

  const seen = new Set<string>()
  const entries: SupplierCategoryEntry[] = []

  for (const p of products) {
    if (!p.categoryName && !p.groupName) continue
    const cat = p.categoryName ?? ""
    const grp = p.groupName ?? ""
    const key = `${cat} > ${grp}`
    if (!seen.has(key)) {
      seen.add(key)
      entries.push({ key, category: cat, group: grp })
    }
  }

  return entries
}

// -----------------------------------------------------------------------
// Text Normalization
// -----------------------------------------------------------------------

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ğ]/g, "g")
    .replace(/[ü]/g, "u")
    .replace(/[ş]/g, "s")
    .replace(/[ı]/g, "i")
    .replace(/[ö]/g, "o")
    .replace(/[ç]/g, "c")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((w) => w.length > 2)
}

// -----------------------------------------------------------------------
// Levenshtein Distance
// -----------------------------------------------------------------------

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }

  return dp[m][n]
}

function similarityScore(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 1.0
  const maxLen = Math.max(na.length, nb.length)
  if (maxLen === 0) return 1.0
  return 1 - levenshtein(na, nb) / maxLen
}

// -----------------------------------------------------------------------
// Keyword Overlap Score
// -----------------------------------------------------------------------

function keywordOverlapScore(supplierTokens: string[], catTokens: string[]): number {
  if (supplierTokens.length === 0 || catTokens.length === 0) return 0

  const catSet = new Set(catTokens)
  const matches = supplierTokens.filter((t) => catSet.has(t)).length

  // Precision: matches / supplier tokens
  // Recall: matches / cat tokens (capped)
  const precision = matches / supplierTokens.length
  const recall = matches / Math.min(catTokens.length, supplierTokens.length + 2)

  return (precision + recall) / 2
}

// -----------------------------------------------------------------------
// Local Matching Logic
// -----------------------------------------------------------------------

function matchLocal(
  entry: SupplierCategoryEntry,
  categories: OurCategory[]
): { category: OurCategory; confidence: number; method: CategoryMappingEntry["method"] } | null {
  const combinedText = `${entry.category} ${entry.group}`
  const supplierTokens = tokenize(combinedText)

  let bestCategory: OurCategory | null = null
  let bestScore = 0
  let bestMethod: CategoryMappingEntry["method"] = "fuzzy_match"

  for (const cat of categories) {
    const catText = `${cat.name} ${cat.slug.replace(/-/g, " ")} ${cat.path ?? ""}`
    const catTokens = tokenize(catText)

    // 1. Exact match on normalized name
    if (normalize(entry.group) === normalize(cat.name) ||
        normalize(entry.category) === normalize(cat.name)) {
      return { category: cat, confidence: 1.0, method: "exact_match" }
    }

    // 2. Levenshtein similarity on group name vs category name
    const levScore = similarityScore(entry.group, cat.name)
    if (levScore > bestScore) {
      bestScore = levScore
      bestCategory = cat
      bestMethod = "fuzzy_match"
    }

    // 3. Keyword overlap (weighted higher for leaf categories)
    const kwScore = keywordOverlapScore(supplierTokens, catTokens)
    const depthBonus = cat.depth > 0 ? 0.05 * Math.min(cat.depth, 3) : 0
    const adjustedKw = kwScore + depthBonus

    if (adjustedKw > bestScore) {
      bestScore = adjustedKw
      bestCategory = cat
      bestMethod = "keyword_match"
    }
  }

  if (!bestCategory || bestScore < 0.3) return null

  return { category: bestCategory, confidence: Math.min(bestScore, 0.99), method: bestMethod }
}

// -----------------------------------------------------------------------
// OpenAI Batch Matching
// -----------------------------------------------------------------------

async function matchWithOpenAI(
  entries: SupplierCategoryEntry[],
  categories: OurCategory[]
): Promise<Map<string, { categoryId: string; categoryPath: string; confidence: number }>> {
  const results = new Map<string, { categoryId: string; categoryPath: string; confidence: number }>()

  if (!OPENAI_API_KEY || entries.length === 0) return results

  // Numbered category list for the prompt
  const catList = categories
    .map((c, i) => `${i + 1}. ${c.name} (slug: ${c.slug})`)
    .join("\n")

  const supplierLines = entries.map((e) => e.key).join("\n")

  const prompt =
    `Aşağıdaki tedarikçi kategorilerini bizim kategori listesine eşleştir.\n\n` +
    `Kategorilerimiz:\n${catList}\n\n` +
    `Tedarikçi kategorileri (satır satır):\n${supplierLines}\n\n` +
    `Her satır için en uygun kategori numarasını (1-${categories.length}) ver, uygun yoksa null.\n` +
    `JSON formatında döndür: {"matches": [{"key": "...", "num": 5, "confidence": 0.9}]}`

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        response_format: { type: "json_object" },
        max_tokens: 4096,
      }),
    })

    if (!res.ok) {
      console.warn(`  [OpenAI] HTTP ${res.status} — local matching'e geçiliyor`)
      return results
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>
    }

    const content = data.choices?.[0]?.message?.content ?? ""
    const parsed = JSON.parse(content) as {
      matches: Array<{ key: string; num: number | null; confidence: number }>
    }

    for (const m of parsed.matches) {
      if (m.num === null || m.num < 1 || m.num > categories.length) continue
      const cat = categories[m.num - 1]
      results.set(m.key, {
        categoryId: cat.id,
        categoryPath: cat.path ?? cat.slug,
        confidence: m.confidence ?? 0.8,
      })
    }
  } catch (err) {
    console.warn(`  [OpenAI] Hata: ${(err as Error).message} — local matching'e geçiliyor`)
  }

  return results
}

// -----------------------------------------------------------------------
// Main Matching Orchestrator
// -----------------------------------------------------------------------

async function matchSupplierCategories(
  supplierName: string,
  entries: SupplierCategoryEntry[],
  ourCategories: OurCategory[]
): Promise<{ matched: Record<string, CategoryMappingEntry>; unmapped: string[] }> {
  const matched: Record<string, CategoryMappingEntry> = {}
  const unmapped: string[] = []

  // --- OpenAI pass (if key available) ---
  const openAiResults = await matchWithOpenAI(entries, ourCategories)

  for (const entry of entries) {
    // 1. OpenAI result
    const ai = openAiResults.get(entry.key)
    if (ai && ai.confidence >= CUSTOM_MIN_CONF) {
      matched[entry.key] = {
        categoryId: ai.categoryId,
        categoryPath: ai.categoryPath,
        confidence: ai.confidence,
        method: "fuzzy_match", // OpenAI used as fuzzy
      }
      continue
    }

    // 2. Local match
    const local = matchLocal(entry, ourCategories)
    if (local && local.confidence >= CUSTOM_MIN_CONF) {
      matched[entry.key] = {
        categoryId: local.category.id,
        categoryPath: local.category.path ?? local.category.slug,
        confidence: parseFloat(local.confidence.toFixed(3)),
        method: local.method,
      }
      continue
    }

    // 3. Low confidence — mark for manual review
    if (local) {
      matched[entry.key] = {
        categoryId: local.category.id,
        categoryPath: local.category.path ?? local.category.slug,
        confidence: parseFloat(local.confidence.toFixed(3)),
        method: "manual_review",
      }
    } else {
      unmapped.push(entry.key)
    }
  }

  return { matched, unmapped }
}

// -----------------------------------------------------------------------
// Partial Save (on interrupt / error)
// -----------------------------------------------------------------------

let currentState: CategoryMappingsFile | null = null

function installSignalHandlers() {
  const flush = (signal: string) => () => {
    if (currentState) {
      console.log(`\n[${signal}] Kısmi kayıt yapılıyor...`)
      saveMappings(currentState)
      console.log("Kaydedildi. Çıkılıyor.")
    }
    process.exit(0)
  }
  process.on("SIGINT", flush("SIGINT"))
  process.on("SIGTERM", flush("SIGTERM"))
}

// -----------------------------------------------------------------------
// Entry Point
// -----------------------------------------------------------------------

async function main() {
  console.log("=== Tedarikçi Kategori Eşleştirici ===\n")
  if (DRY_RUN) console.log("  [DRY RUN] Hiçbir şey kaydedilmeyecek\n")
  if (SUPPLIER_FILTER) console.log(`  Yalnızca: ${SUPPLIER_FILTER}\n`)

  // Ensure data/ directory
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
    console.log(`  data/ klasörü oluşturuldu: ${DATA_DIR}\n`)
  }

  installSignalHandlers()

  // Load existing mappings (merge-friendly)
  const state: CategoryMappingsFile = loadMappings()
  currentState = state

  // 1. Fetch our categories from DB
  console.log("Kategoriler veritabanından çekiliyor...")
  let ourCategories: OurCategory[]
  try {
    ourCategories = await getOurCategories()
  } catch (err) {
    console.error(`Veritabanı hatası: ${(err as Error).message}`)
    await pool.end()
    process.exit(1)
  }

  if (ourCategories.length === 0) {
    console.error("Veritabanında aktif kategori bulunamadı. Önce kategori ağacını seed edin.")
    await pool.end()
    process.exit(1)
  }

  console.log(`  ${ourCategories.length} kategori yüklendi\n`)

  // 2. Process each supplier
  const suppliers: Array<{
    name: "indexgrup" | "netex"
    fetchFn: () => Promise<SupplierCategoryEntry[]>
  }> = [
    { name: "indexgrup", fetchFn: extractIndexGrupCategories },
    { name: "netex", fetchFn: extractNetexCategories },
  ]

  for (const supplier of suppliers) {
    if (SUPPLIER_FILTER && SUPPLIER_FILTER !== supplier.name) continue

    console.log(`\n--- ${supplier.name.toUpperCase()} ---`)

    let entries: SupplierCategoryEntry[]
    try {
      entries = await supplier.fetchFn()
    } catch (err) {
      const msg = (err as Error).message
      console.error(`  [${supplier.name}] Kategori çekme hatası: ${msg}`)
      console.warn(`  [${supplier.name}] Atlanıyor.`)
      continue
    }

    // Deduplicate against already-mapped entries
    const alreadyMapped = state.mappings[supplier.name]
    const newEntries = entries.filter((e) => !(e.key in alreadyMapped))

    console.log(
      `  ${entries.length} benzersiz kategori çifti | ` +
      `${Object.keys(alreadyMapped).length} zaten eşleştirilmiş | ` +
      `${newEntries.length} yeni`
    )

    if (newEntries.length === 0) {
      console.log("  Tüm kategoriler zaten eşleştirilmiş, atlanıyor.")
      continue
    }

    // Match
    console.log(`  ${OPENAI_API_KEY ? "OpenAI + local" : "Local"} eşleştirme başlıyor...`)
    const { matched, unmapped } = await matchSupplierCategories(
      supplier.name,
      newEntries,
      ourCategories
    )

    // Merge into state
    state.mappings[supplier.name] = { ...alreadyMapped, ...matched }

    // Rebuild unmapped: remove newly-matched, keep previous unmapped
    const prevUnmapped = new Set(state.unmapped[supplier.name])
    for (const k of Object.keys(matched)) prevUnmapped.delete(k)
    for (const k of unmapped) prevUnmapped.add(k)
    state.unmapped[supplier.name] = Array.from(prevUnmapped)

    // Stats
    const methods = Object.values(matched).reduce(
      (acc, v) => {
        acc[v.method] = (acc[v.method] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const manualCount = methods["manual_review"] ?? 0
    const highConf = Object.values(matched).filter((v) => v.confidence >= 0.8).length

    console.log(`  Eşleştirilen : ${Object.keys(matched).length}/${newEntries.length}`)
    console.log(`  Eşleştirilemeyen: ${unmapped.length}`)
    console.log(`  Yüksek güven (≥0.8): ${highConf}`)
    console.log(`  Manuel review gerekli: ${manualCount}`)
    console.log(`  Yöntemler: ${JSON.stringify(methods)}`)

    // Partial save after each supplier
    currentState = state
    if (!DRY_RUN) {
      saveMappings(state)
      console.log(`  Kaydedildi.`)
    }
  }

  // 3. Summary
  console.log("\n" + "=".repeat(60))
  console.log("OZET")
  console.log("=".repeat(60))
  for (const sup of ["indexgrup", "netex"] as const) {
    const total = Object.keys(state.mappings[sup]).length
    const manualReview = Object.values(state.mappings[sup]).filter(
      (v) => v.method === "manual_review"
    ).length
    const unm = state.unmapped[sup].length
    console.log(`${sup.padEnd(12)}: ${total} eşleştirildi | ${manualReview} manuel review | ${unm} eşleştirilemeyen`)
  }
  console.log("=".repeat(60))

  if (!DRY_RUN) {
    const outPath = resolve(process.cwd(), "data/category-mappings.json")
    console.log(`\nCache: ${outPath}`)
  }

  // Print manual review items
  const allManual = [
    ...Object.entries(state.mappings.indexgrup)
      .filter(([, v]) => v.method === "manual_review")
      .map(([k]) => `  [indexgrup] ${k}`),
    ...Object.entries(state.mappings.netex)
      .filter(([, v]) => v.method === "manual_review")
      .map(([k]) => `  [netex] ${k}`),
    ...state.unmapped.indexgrup.map((k) => `  [indexgrup][unmapped] ${k}`),
    ...state.unmapped.netex.map((k) => `  [netex][unmapped] ${k}`),
  ]

  if (allManual.length > 0) {
    console.log(`\nManuel inceleme gereken (${allManual.length} adet):`)
    allManual.forEach((l) => console.log(l))
  }

  await pool.end()
}

main().catch((err) => {
  console.error("Kritik hata:", err)
  if (currentState) {
    console.log("Kısmi kayıt yapılıyor...")
    saveMappings(currentState)
  }
  process.exit(1)
})
