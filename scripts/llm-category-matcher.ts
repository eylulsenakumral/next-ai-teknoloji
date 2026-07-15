import { Pool } from 'pg'

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/nextai',
})

interface Category {
  id: string
  name: string
  parent_name: string | null
  depth: number
}

interface Product {
  id: string
  name: string
  supplier_category: string | null
  brand_name: string | null
}

type LLMMatch = { pid: string; cid: string | number | null }

const BATCH_SIZE = 20
const CONCURRENCY = 5
const RETRY_COUNT = 3

const Z_API_KEY = process.env.Z_AI_API_KEY
if (!Z_API_KEY) {
  throw new Error(
    'Z_AI_API_KEY environment variable is required but not set. ' +
      'Set it in your .env file before running this script.'
  )
}
const Z_API_URL = process.env.Z_AI_API_URL || 'https://api.z.ai/api/coding/paas/v4/chat/completions'
const Z_MODEL = process.env.Z_AI_MODEL || process.env.WHATSAPP_AI_MODEL || 'glm-5.2'

async function getAllCategories(): Promise<Category[]> {
  const result = await pool.query<Category>(
    `SELECT c.id, c.name, p.name as parent_name, c.depth
     FROM categories c LEFT JOIN categories p ON c.parent_id = p.id
     WHERE c.deleted_at IS NULL
     ORDER BY c.depth, c.name`
  )
  return result.rows
}

async function getUnmatchedProducts(): Promise<Product[]> {
  const result = await pool.query<Product>(
    `SELECT p.id, p.name,
       sp.raw_data->>'ustKategoriAdi' as b2b_ust,
       sp.raw_data->>'altKategoriAdi' as b2b_alt,
       sp.raw_data->>'enAltKategoriAdi' as b2b_enalt,
       sp.raw_data->>'categoryName' as idx_cat,
       sp.raw_data->>'groupName' as idx_grp,
       sp.raw_data->>'category' as oki_cat,
       b.name as brand_name
     FROM products p
     LEFT JOIN supplier_products sp ON sp.product_id = p.id AND sp.deleted_at IS NULL
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE p.category_id IS NULL AND p.deleted_at IS NULL AND p.is_active = true
     ORDER BY p.name`
  )

  // Build supplier category string from available fields
  return result.rows.map(r => {
    const parts: string[] = []
    if (r.b2b_ust) parts.push(r.b2b_ust)
    if (r.b2b_alt) parts.push(r.b2b_alt)
    if (r.b2b_enalt) parts.push(r.b2b_enalt)
    if (r.idx_cat) parts.push(r.idx_cat)
    if (r.idx_grp) parts.push(r.idx_grp)
    if (r.oki_cat) parts.push(r.oki_cat)

    const supplierCat = parts.length > 0 ? parts.join(' > ') : null
    return {
      id: r.id,
      name: r.name,
      supplier_category: supplierCat,
      brand_name: (r as any).brand_name || null,
    }
  })
}

function buildCategoryTreeText(categories: Category[]): { catList: string; numToUuid: Map<string, string> } {
  // Build a numbered list with full path
  const numToUuid = new Map<string, string>()
  const lines: string[] = []

  // Build parent map
  const byId = new Map(categories.map(c => [c.id, c]))
  const childrenMap = new Map<string, Category[]>()
  const roots: Category[] = []

  for (const c of categories) {
    if (!c.parent_name) {
      roots.push(c)
    } else {
      const parent = categories.find(p => p.name === c.parent_name && p.depth === c.depth - 1)
      if (parent) {
        if (!childrenMap.has(parent.id)) childrenMap.set(parent.id, [])
        childrenMap.get(parent.id)!.push(c)
      }
    }
  }

  let num = 0
  function walk(cats: Category[], indent: string) {
    for (const c of cats) {
      num++
      const path = buildPath(c, byId)
      lines.push(`${indent}${num}|${c.id}|${path}`)
      numToUuid.set(String(num), c.id)
      const children = childrenMap.get(c.id) || []
      if (children.length > 0) walk(children, indent + '  ')
    }
  }

  walk(roots, '')
  return { catList: lines.join('\n'), numToUuid }
}

function buildPath(c: Category, byId: Map<string, Category>): string {
  const parts: string[] = [c.name]
  let current = c
  while (current.parent_name) {
    parts.unshift(current.parent_name)
    const parent = Array.from(byId.values()).find(
      p => p.name === current.parent_name && p.depth === current.depth - 1
    )
    if (!parent) break
    current = parent
  }
  return parts.join(' > ')
}

async function callLLM(
  catList: string,
  products: Product[]
): Promise<{ pid: string; catId: string | null }[]> {
  const prodLines = products.map(p => {
    let line = `${p.id}|${p.name}`
    if (p.brand_name) line += ` [Marka: ${p.brand_name}]`
    if (p.supplier_category) line += ` [Tedarikçi Kategorisi: ${p.supplier_category}]`
    return line
  }).join('\n')

  const systemMsg = `Sen bir e-ticaret ürün kategorizasyon uzmanısın. Verilen ürünleri mevcut kategori ağacına göre en uygun kategoriye yerleştir.
KURALLAR:
1. Her ürün için en uygun kategori NUMARASINI ver
2. Yaprak (leaf) kategorileri tercih et ama genel kategoriler de kabul edilir
3. Tedarikçi kategorisi bilgisini ipucu olarak kullan ama bizim kategorilerimize göre eşleştir
4. Emin değilsen null ver, yanlış kategori atamaktan kaçın
5. Sadece JSON döndür`

  const userMsg = `KATEGORİ AĞACI:\n${catList}\n\nÜRÜNLER:\n${prodLines}\n\nHer ürün için en uygun kategori numarasını seç.\nJSON formatında yanıtla: {"matches":[{"pid":"ürün-id","cid":"numara-ya-da-null"}]}`

  for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000)

    try {
      const response = await fetch(Z_API_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${Z_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: Z_MODEL,
          messages: [
            { role: 'system', content: systemMsg },
            { role: 'user', content: userMsg },
          ],
          temperature: 0,
          max_tokens: 8000,
        }),
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const err = await response.text()
        console.error(`  [HTTP ${response.status}] ${err.slice(0, 150)}`)
        if (attempt < RETRY_COUNT) await sleep(5000 * attempt)
        continue
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>
        error?: { message: string }
      }

      if (data.error) {
        console.error(`  [API Error] ${data.error.message.slice(0, 150)}`)
        if (attempt < RETRY_COUNT) await sleep(5000 * attempt)
        continue
      }

      const content = data.choices?.[0]?.message?.content?.trim()
      if (!content) {
        console.error(`  [Empty response] attempt ${attempt}/${RETRY_COUNT}`)
        if (attempt < RETRY_COUNT) await sleep(3000)
        continue
      }

      let jsonStr = content
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```json?\n?/m, '').replace(/```\s*$/m, '').trim()
      }
      const match = jsonStr.match(/\{[\s\S]*\}/)
      if (match) jsonStr = match[0]

      try {
        const parsed = JSON.parse(jsonStr) as { matches: LLMMatch[] }
        return parsed.matches.map(m => ({
          pid: String(m.pid),
          catId: m.cid !== null && m.cid !== undefined ? String(m.cid) : null,
        }))
      } catch {
        console.error(`  [JSON Parse Error] raw: ${content.slice(0, 300)}`)
        if (attempt < RETRY_COUNT) await sleep(3000)
      }
    } catch (err) {
      clearTimeout(timeoutId)
      const msg = (err as Error).message
      console.error(`  [${msg.includes('abort') ? 'Timeout' : 'Error'}] attempt ${attempt}: ${msg.slice(0, 100)}`)
      if (attempt < RETRY_COUNT) await sleep(5000 * attempt)
    }
  }
  return []
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('=== LLM Ürün-Kategori Eşleştirici (Z.AI GLM-5, paralel) ===\n')

  console.log('Kategoriler yükleniyor...')
  const categories = await getAllCategories()
  const { catList, numToUuid } = buildCategoryTreeText(categories)
  console.log(`${categories.length} kategori yüklendi (${(catList.length / 1024).toFixed(0)}KB)\n`)

  console.log('Eşleştirilmemiş ürünler yükleniyor...')
  const products = await getUnmatchedProducts()
  console.log(`${products.length} ürün eşleştirilecek\n`)

  if (products.length === 0) {
    console.log('Tüm ürünlerin category_id mevcut.')
    await pool.end()
    return
  }

  const batches: Product[][] = []
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    batches.push(products.slice(i, i + BATCH_SIZE))
  }

  const totalBatches = batches.length
  const estimatedMin = Math.ceil((totalBatches / CONCURRENCY) * 3)
  console.log(`${totalBatches} batch (${BATCH_SIZE}/batch), ${CONCURRENCY} paralel`)
  console.log(`Tahmini süre: ~${estimatedMin} dakika\n`)
  console.log('-'.repeat(70))

  let totalMatched = 0
  let totalNull = 0
  let totalError = 0
  let completedBatches = 0

  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const group = batches.slice(i, i + CONCURRENCY)

    const groupResults = await Promise.all(
      group.map(async (batch, j) => {
        const batchNum = i + j + 1
        const matches = await callLLM(catList, batch)

        let matched = 0
        let nullCount = 0

        for (const m of matches) {
          if (m.catId) {
            const realUuid = numToUuid.get(m.catId)
            if (realUuid) {
              try {
                const res = await pool.query(
                  `UPDATE products SET category_id = $1, updated_at = NOW() WHERE id = $2 AND category_id IS NULL`,
                  [realUuid, m.pid]
                )
                if ((res.rowCount ?? 0) > 0) matched++
              } catch (e) {
                console.error(`  DB error: ${(e as Error).message}`)
              }
            }
          } else {
            nullCount++
          }
        }

        if (matches.length === 0) {
          return { batchNum, matched: 0, nullCount: 0, error: batch.length }
        }

        return { batchNum, matched, nullCount, error: 0 }
      })
    )

    for (const { batchNum, matched, nullCount, error } of groupResults) {
      completedBatches++
      totalMatched += matched
      totalNull += nullCount
      totalError += error

      const processed = Math.min(completedBatches * BATCH_SIZE, products.length)
      const pct = ((processed / products.length) * 100).toFixed(1)

      if (error > 0) {
        console.log(`Batch ${batchNum}/${totalBatches} HATA | ${processed}/${products.length} (%${pct})`)
      } else {
        console.log(`Batch ${batchNum}/${totalBatches} - ${matched} eşleşti, ${nullCount} null | ${processed}/${products.length} (%${pct})`)
      }
    }

    // DB status every 25 batches
    if (completedBatches % 25 === 0) {
      const s = await pool.query<{ matched: string; unmatched: string }>(
        `SELECT COUNT(*) FILTER (WHERE category_id IS NOT NULL AND deleted_at IS NULL) as matched,
                COUNT(*) FILTER (WHERE category_id IS NULL AND deleted_at IS NULL) as unmatched
         FROM products`
      )
      console.log(`\n  [DB] Eşleşmiş: ${s.rows[0].matched}, Eşleşmemiş: ${s.rows[0].unmatched}\n`)
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('ÖZET RAPOR')
  console.log('='.repeat(70))
  console.log(`Toplam işlenen  : ${products.length}`)
  console.log(`Eşleştirilen    : ${totalMatched}`)
  console.log(`Null            : ${totalNull}`)
  console.log(`Hata            : ${totalError}`)
  console.log(`Başarı oranı    : ${((totalMatched / products.length) * 100).toFixed(1)}%`)

  const fin = await pool.query<{ matched: string; unmatched: string }>(
    `SELECT COUNT(*) FILTER (WHERE category_id IS NOT NULL AND deleted_at IS NULL) as matched,
            COUNT(*) FILTER (WHERE category_id IS NULL AND deleted_at IS NULL) as unmatched
     FROM products`
  )
  console.log('\nVERİTABANI SON DURUMU:')
  console.log(`  Kategorisi olan   : ${fin.rows[0].matched}`)
  console.log(`  Kategorisi olmayan: ${fin.rows[0].unmatched}`)
  console.log('='.repeat(70))

  await pool.end()
}

main().catch(err => {
  console.error('Kritik hata:', err)
  process.exit(1)
})
