import { Pool } from 'pg'

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/nextai',
})

interface Category {
  id: string
  name: string
  path: string
}

interface Product {
  id: string
  name: string
}

type LLMMatch = { pid: string; cid: string | number | null }

const BATCH_SIZE = 15
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
const Z_MODEL = process.env.Z_AI_MODEL || 'glm-5-turbo'

async function getLeafCategories(): Promise<Array<{ num: number; id: string; name: string }>> {
  const result = await pool.query<Category>(
    `SELECT c.id, c.name, c.path
     FROM categories c
     WHERE c.deleted_at IS NULL
     AND NOT EXISTS (
       SELECT 1 FROM categories cc
       WHERE cc.parent_id = c.id AND cc.deleted_at IS NULL
     )
     ORDER BY c.path`
  )
  return result.rows.map((c, i) => ({ num: i + 1, id: c.id, name: c.name }))
}

async function getUnmatchedProducts(): Promise<Product[]> {
  const result = await pool.query<Product>(
    `SELECT id, name
     FROM products
     WHERE category_id IS NULL AND deleted_at IS NULL
     ORDER BY name`
  )
  return result.rows
}

async function callLLM(
  catList: string,
  products: Product[]
): Promise<{ pid: string; catId: string | null }[]> {
  const prodLines = products.map(p => `${p.id}|${p.name}`).join('\n')
  const userMsg =
    `Kategoriler:\n${catList}\n\nUrunler:\n${prodLines}\n\n` +
    `Her urun icin en uygun kategori numarasini sec. Kesinlikle uygun yoksa null yaz.\n` +
    `JSON: {"matches":[{"pid":"urun-id","cid":"numara-ya-da-null"}]}`

  for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2min

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
          messages: [{ role: 'user', content: userMsg }],
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
  console.log('=== LLM Urun-Kategori Eslestirici (z.ai glm-5-turbo, parallel) ===\n')

  console.log('Leaf kategoriler yukleniyor...')
  const numberedCats = await getLeafCategories()
  const catList = numberedCats.map(c => `${c.num}|${c.name}`).join('\n')
  const numToUuid = new Map(numberedCats.map(c => [String(c.num), c.id]))
  console.log(`${numberedCats.length} leaf kategori yuklendi (${Math.round(catList.length / 1024)}KB)\n`)

  console.log('Eslestirilemis urunler yukleniyor...')
  const products = await getUnmatchedProducts()
  console.log(`${products.length} urun eslestirilocek\n`)

  if (products.length === 0) {
    console.log("Tum urunlerin category_id mevcut.")
    await pool.end()
    return
  }

  const batches: Product[][] = []
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    batches.push(products.slice(i, i + BATCH_SIZE))
  }

  const totalBatches = batches.length
  const estimatedMin = Math.ceil((totalBatches / CONCURRENCY) * 60 / 60)
  console.log(`${totalBatches} batch (${BATCH_SIZE}/batch), ${CONCURRENCY} paralel`)
  console.log(`Tahmini sure: ~${estimatedMin} dakika\n`)
  console.log('-'.repeat(70))

  let totalMatched = 0
  let totalNull = 0
  let totalError = 0
  let completedBatches = 0

  // Process in groups of CONCURRENCY
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
        console.log(`Batch ${batchNum}/${totalBatches} - ${matched} eslesti, ${nullCount} null | ${processed}/${products.length} (%${pct})`)
      }
    }

    // DB status every 50 batches
    if (completedBatches % 50 === 0) {
      const s = await pool.query<{ matched: string; unmatched: string }>(
        `SELECT COUNT(*) FILTER (WHERE category_id IS NOT NULL AND deleted_at IS NULL) as matched,
                COUNT(*) FILTER (WHERE category_id IS NULL AND deleted_at IS NULL) as unmatched
         FROM products`
      )
      console.log(`\n  [DB] Eslesmis: ${s.rows[0].matched}, Eslesmemis: ${s.rows[0].unmatched}\n`)
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('OZET RAPOR')
  console.log('='.repeat(70))
  console.log(`Toplam islenen  : ${products.length}`)
  console.log(`Eslestirilen    : ${totalMatched}`)
  console.log(`Null            : ${totalNull}`)
  console.log(`Hata            : ${totalError}`)
  console.log(`Basari orani    : ${((totalMatched / products.length) * 100).toFixed(1)}%`)

  const fin = await pool.query<{ matched: string; unmatched: string }>(
    `SELECT COUNT(*) FILTER (WHERE category_id IS NOT NULL AND deleted_at IS NULL) as matched,
            COUNT(*) FILTER (WHERE category_id IS NULL AND deleted_at IS NULL) as unmatched
     FROM products`
  )
  console.log('\nVERITABANI SON DURUMU:')
  console.log(`  Kategorisi olan   : ${fin.rows[0].matched}`)
  console.log(`  Kategorisi olmayan: ${fin.rows[0].unmatched}`)
  console.log('='.repeat(70))

  await pool.end()
}

main().catch(err => {
  console.error('Kritik hata:', err)
  process.exit(1)
})
