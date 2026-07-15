import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'

// ---------- Config ----------
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nextai'
const Z_API_KEY = process.env.Z_AI_API_KEY
const Z_API_URL = process.env.Z_AI_API_URL || 'https://api.z.ai/api/coding/paas/v4/chat/completions'
const Z_MODEL = process.env.Z_AI_MODEL || process.env.WHATSAPP_AI_MODEL || 'glm-5.2'

if (!Z_API_KEY) {
  throw new Error('Z_AI_API_KEY environment variable is required. Set it in your .env file.')
}

const pool = new Pool({ connectionString: DATABASE_URL })

// ---------- Types ----------
interface OrphanProduct {
  id: string
  name: string
  description: string | null
  sku: string | null
  supplier_category: string | null
  brand_name: string | null
}

interface SystemCategory {
  id: string
  name: string
  path: string
  parent_name: string | null
  depth: number
}

interface MatchResult {
  productId: string
  productName: string
  matchedCategoryName: string
  matchedCategoryId: string | null
  confidence: number
  reason: string
  supplier: string | null
}

// ---------- DB Queries ----------
async function getOrphanProducts(): Promise<OrphanProduct[]> {
  const result = await pool.query<OrphanProduct>(`
    SELECT
      p.id,
      p.name,
      p.description,
      p.sku,
      b.name as brand_name,
      (
        SELECT string_agg(
          COALESCE(
            sp.raw_data->>'ustKategoriAdi',
            sp.raw_data->>'altKategoriAdi',
            sp.raw_data->>'enAltKategoriAdi',
            sp.raw_data->>'categoryName',
            sp.raw_data->>'groupName',
            sp.raw_data->>'category'
          ), ' > '
        )
        FROM supplier_products sp
        WHERE sp.product_id = p.id AND sp.deleted_at IS NULL
        LIMIT 1
      ) as supplier_category
    FROM products p
    LEFT JOIN brands b ON b.id = p.brand_id
    WHERE p.category_id IS NULL
      AND p.deleted_at IS NULL
      AND p.is_active = true
    ORDER BY p.name
    LIMIT 600
  `)
  console.log(`\nKategorisiz urun: ${result.rows.length}`)
  console.log('\nOrnekler (ilk 10):')
  result.rows.slice(0, 10).forEach(p => {
    console.log(`  - ${p.name} (supplier_cat: ${p.supplier_category || 'N/A'}, brand: ${p.brand_name || 'N/A'})`)
  })
  return result.rows
}

async function getSystemCategories(): Promise<SystemCategory[]> {
  const result = await pool.query<SystemCategory>(`
    SELECT
      c.id,
      c.name,
      c.path,
      c.depth,
      p.name as parent_name
    FROM categories c
    LEFT JOIN categories p ON c.parent_id = p.id
    WHERE c.deleted_at IS NULL
    ORDER BY c.depth, c.name
  `)
  console.log(`\nSistem kategorileri: ${result.rows.length}`)
  return result.rows
}

// ---------- LLM Matching ----------
async function callLLM(prompt: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(Z_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Z_API_KEY}`,
        },
        body: JSON.stringify({
          model: Z_MODEL,
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errText}`)
      }

      const data = await response.json() as any
      const content = data.choices?.[0]?.message?.content || data.content?.[0]?.text || ''
      if (!content) throw new Error('Empty response from LLM')
      return content
    } catch (err) {
      console.error(`  LLM attempt ${attempt}/${retries} failed:`, (err as Error).message)
      if (attempt === retries) throw err
      await new Promise(r => setTimeout(r, 2000 * attempt))
    }
  }
  throw new Error('LLM call failed after all retries')
}

async function matchBatch(
  products: OrphanProduct[],
  categories: SystemCategory[],
  batchIdx: number,
  totalBatches: number
): Promise<MatchResult[]> {
  // Build compact category list (name + path)
  const catList = categories
    .map(c => `${c.name} (path: ${c.path || c.name})`)
    .join('\n')

  const productList = products.map((p, idx) => {
    const parts = [`${idx + 1}. Name: ${p.name}`]
    if (p.description) parts.push(`   Description: ${p.description.substring(0, 150)}`)
    if (p.supplier_category) parts.push(`   Supplier Category: ${p.supplier_category}`)
    if (p.brand_name) parts.push(`   Brand: ${p.brand_name}`)
    if (p.sku) parts.push(`   SKU: ${p.sku}`)
    return parts.join('\n')
  }).join('\n\n')

  const prompt = `You are an e-commerce category matcher for a Turkish B2B electronics/security systems store.
Match each product to the most appropriate system category.

SYSTEM CATEGORIES (use exact name from this list):
${catList}

PRODUCTS TO MATCH:
${productList}

INSTRUCTIONS:
- Use supplier category hints when available
- For each product return exactly one JSON object
- Use confidence 80-100 only if very certain
- If no good match exists, use confidence 0-30
- Respond with a valid JSON array only, no extra text

JSON FORMAT:
[
  {
    "index": 1,
    "matched_category": "exact category name from list above",
    "confidence": 85,
    "reason": "brief reason"
  },
  ...
]`

  const responseText = await callLLM(prompt)

  // Extract JSON array from response (handle markdown code blocks)
  // Strip ```json ... ``` or ``` ... ``` wrappers first
  const stripped = responseText
    .replace(/```(?:json)?\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  const jsonMatch = stripped.match(/\[\s*\{[\s\S]*\}\s*\]/)?.[0]
    || responseText.match(/\[\s*\{[\s\S]*\}\s*\]/)?.[0]
  if (!jsonMatch) {
    console.error(`  Batch ${batchIdx + 1}: Could not parse JSON from LLM response`)
    console.error('  Response preview:', responseText.substring(0, 300))
    // Return low-confidence unknowns for this batch
    return products.map(p => ({
      productId: p.id,
      productName: p.name,
      matchedCategoryName: '',
      matchedCategoryId: null,
      confidence: 0,
      reason: 'LLM parsing failed',
      supplier: p.supplier_category,
    }))
  }

  let llmMatches: Array<{ index: number; matched_category: string; confidence: number; reason: string }>
  try {
    llmMatches = JSON.parse(jsonMatch)
  } catch {
    console.error(`  Batch ${batchIdx + 1}: JSON parse error`)
    return products.map(p => ({
      productId: p.id,
      productName: p.name,
      matchedCategoryName: '',
      matchedCategoryId: null,
      confidence: 0,
      reason: 'JSON parse failed',
      supplier: p.supplier_category,
    }))
  }

  // Build category name -> id map (case-insensitive)
  const catNameMap = new Map<string, SystemCategory>()
  for (const cat of categories) {
    catNameMap.set(cat.name.toLowerCase().trim(), cat)
  }

  const results: MatchResult[] = []
  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const llmMatch = llmMatches.find(m => m.index === i + 1) || llmMatches[i]

    if (!llmMatch) {
      results.push({
        productId: product.id,
        productName: product.name,
        matchedCategoryName: '',
        matchedCategoryId: null,
        confidence: 0,
        reason: 'No LLM match returned',
        supplier: product.supplier_category,
      })
      continue
    }

    const matchedCat = catNameMap.get(llmMatch.matched_category?.toLowerCase().trim() || '')
    results.push({
      productId: product.id,
      productName: product.name,
      matchedCategoryName: llmMatch.matched_category || '',
      matchedCategoryId: matchedCat?.id || null,
      confidence: llmMatch.confidence || 0,
      reason: llmMatch.reason || '',
      supplier: product.supplier_category,
    })
  }

  console.log(`  Batch ${batchIdx + 1}/${totalBatches} done: ${results.filter(r => r.matchedCategoryId).length}/${results.length} matched`)
  return results
}

// ---------- DB Update ----------
async function assignCategories(assignments: MatchResult[]): Promise<number> {
  const valid = assignments.filter(a => a.matchedCategoryId !== null)
  if (valid.length === 0) return 0

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    let updated = 0
    for (const a of valid) {
      await client.query(
        'UPDATE products SET category_id = $1, updated_at = NOW() WHERE id = $2 AND category_id IS NULL',
        [a.matchedCategoryId, a.productId]
      )
      updated++
    }
    await client.query('COMMIT')
    return updated
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ---------- Reports ----------
function buildCSV(products: MatchResult[]): string {
  const header = 'productId,productName,matchedCategory,confidence,reason,supplierCategory'
  const rows = products.map(p =>
    [
      p.productId,
      `"${(p.productName || '').replace(/"/g, '""')}"`,
      `"${(p.matchedCategoryName || '').replace(/"/g, '""')}"`,
      p.confidence,
      `"${(p.reason || '').replace(/"/g, '""')}"`,
      `"${(p.supplier || '').replace(/"/g, '""')}"`,
    ].join(',')
  )
  return [header, ...rows].join('\n')
}

async function getVerificationStats(): Promise<{ remaining: number; distribution: Array<{ name: string; count: number }> }> {
  const remaining = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM products WHERE category_id IS NULL AND deleted_at IS NULL AND is_active = true`
  )

  const dist = await pool.query<{ name: string; count: string }>(`
    SELECT c.name, COUNT(p.id) as count
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.deleted_at IS NULL AND p.is_active = true
    GROUP BY c.id, c.name
    ORDER BY count DESC
    LIMIT 15
  `)

  return {
    remaining: parseInt(remaining.rows[0].count),
    distribution: dist.rows.map(r => ({ name: r.name, count: parseInt(r.count) })),
  }
}

// ---------- Main ----------
async function main() {
  console.log('=== Kategorisiz Urun Atama Scripti ===')
  console.log(`Zaman: ${new Date().toISOString()}`)
  console.log(`Model: ${Z_MODEL}`)

  // Phase 1: Veri Toplama
  console.log('\n--- Phase 1: Veri Toplama ---')
  const [orphanProducts, systemCategories] = await Promise.all([
    getOrphanProducts(),
    getSystemCategories(),
  ])

  if (orphanProducts.length === 0) {
    console.log('\nKategorisiz urun yok. Cikiliyor.')
    await pool.end()
    return
  }

  // Phase 2: LLM Semantic Matching (batch 50)
  console.log('\n--- Phase 2: LLM Semantic Matching ---')
  const BATCH_SIZE = 50
  const batches: OrphanProduct[][] = []
  for (let i = 0; i < orphanProducts.length; i += BATCH_SIZE) {
    batches.push(orphanProducts.slice(i, i + BATCH_SIZE))
  }

  console.log(`${orphanProducts.length} urun, ${batches.length} batch (${BATCH_SIZE}/batch)`)

  const allMatches: MatchResult[] = []
  for (let i = 0; i < batches.length; i++) {
    allMatches.push(...await matchBatch(batches[i], systemCategories, i, batches.length))
    // Rate limit pause between batches
    if (i < batches.length - 1) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  // Phase 3: Grupla
  console.log('\n--- Phase 3: Confidence Analizi ---')
  const highConf = allMatches.filter(m => m.confidence >= 80 && m.matchedCategoryId)
  const mediumConf = allMatches.filter(m => m.confidence >= 50 && m.confidence < 80 && m.matchedCategoryId)
  const lowConf = allMatches.filter(m => m.confidence < 50 || !m.matchedCategoryId)
  const unmatched = allMatches.filter(m => !m.matchedCategoryId)

  console.log(`
Matching Sonuclari:
  Yuksek confidence (80+): ${highConf.length} urun
  Orta confidence (50-79): ${mediumConf.length} urun
  Dusuk confidence (<50):  ${lowConf.length} urun
  Kategori bulunamadi:     ${unmatched.length} urun
  `)

  // Phase 4: Otomatik atama (high confidence)
  console.log('--- Phase 4: Otomatik Atama (80+) ---')
  let autoAssigned = 0
  if (highConf.length > 0) {
    console.log(`${highConf.length} urun otomatik ataniyor...`)
    autoAssigned = await assignCategories(highConf)
    console.log(`Atama tamamlandi: ${autoAssigned} urun`)
  } else {
    console.log('Yuksek confidence eslesmesi yok.')
  }

  // Phase 5: CSV raporu (medium + low confidence -> manual review)
  console.log('\n--- Phase 5: Raporlama ---')
  const dataDir = path.join('/home/tolgabrk/projects/next-ai-teknoloji/data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

  const manualReviewProducts = [...mediumConf, ...lowConf.filter(m => !m.matchedCategoryId)]
  const csvPath = path.join(dataDir, 'manual-review-products.csv')
  fs.writeFileSync(csvPath, buildCSV(manualReviewProducts), 'utf-8')
  console.log(`Manual review CSV: ${csvPath} (${manualReviewProducts.length} urun)`)

  // Tam sonuc JSON
  const fullResultPath = path.join(dataDir, 'categorization-results.json')
  fs.writeFileSync(fullResultPath, JSON.stringify({
    runAt: new Date().toISOString(),
    total: allMatches.length,
    highConf: highConf.length,
    mediumConf: mediumConf.length,
    lowConf: lowConf.length - unmatched.length,
    unmatched: unmatched.length,
    autoAssigned,
    matches: allMatches,
  }, null, 2), 'utf-8')
  console.log(`Tam sonuc JSON: ${fullResultPath}`)

  // Dogrulama
  const stats = await getVerificationStats()
  const categorized = orphanProducts.length - stats.remaining
  const successRate = ((categorized / orphanProducts.length) * 100).toFixed(1)

  console.log(`
=== DOGRULAMA ===
  Baslangic kategorisiz: ${orphanProducts.length}
  Simdi kategorisiz:     ${stats.remaining}
  Kategorize edilen:     ${categorized}
  Basari orani:          %${successRate}

Top 15 Kategori (urun sayisina gore):
`)
  stats.distribution.forEach((cat, idx) => {
    console.log(`  ${idx + 1}. ${cat.name}: ${cat.count} urun`)
  })

  console.log(`
=== OZET RAPOR ===
  Baslangic: ${orphanProducts.length} kategorisiz urun
  Otomatik atanan (80+): ${autoAssigned}
  Manual review (50-79): ${mediumConf.length} urun
  Basarisiz (<50): ${lowConf.filter(m => !m.matchedCategoryId).length} urun
  Sonuc: ${stats.remaining} kategorisiz urun kaldi
  Basari: %${successRate}

Dosyalar:
  Tam sonuclar: ${fullResultPath}
  Manual review: ${csvPath}

Sonraki adimlar:
  - ${mediumConf.length} orta confidence urunu admin panelinden kontrol et
  - ${stats.remaining} kalan urunu manuel ata
`)

  await pool.end()
}

main().catch(async err => {
  console.error('Script hatasi:', err)
  await pool.end()
  process.exit(1)
})
