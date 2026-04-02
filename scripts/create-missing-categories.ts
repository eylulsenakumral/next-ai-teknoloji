/**
 * Missing Category Creation Script
 *
 * Creates:
 *   A) Analog Kameralar subtypes (Bullet, Dome, Box, PTZ) under cctv-analog-kameralar
 *   B) 49" and 55" Monitor categories under bilgisayar-sunucu-monitor
 *   C) Moves cctv-trafik-dsp-kameralari parent to akilli-sistemler
 *
 * Usage: npx tsx scripts/create-missing-categories.ts
 */

import "dotenv/config"
import pg from "pg"
import { randomUUID } from "crypto"

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})

// ─── Known parent data (verified by query) ────────────────────────────────────
const PARENTS = {
  "cctv-analog-kameralar": {
    id: "a2786431-fada-4145-8d4d-4f10dd406271",
    depth: 1,
    path: "cctv/analog-kameralar",
  },
  "bilgisayar-sunucu-monitor": {
    id: "91144e1e-f2d9-4c54-8606-7244b05dca55",
    depth: 1,
    path: "bilgisayar-sunucu/monitor",
  },
  "akilli-sistemler": {
    id: "5184c209-411b-4b05-b51d-0e452498f10c",
    depth: 0,
    path: "akilli-sistemler",
  },
}

// ─── Categories to create ─────────────────────────────────────────────────────

interface NewCategory {
  id: string
  parent_id: string
  name: string
  slug: string
  depth: number
  path: string
  sort_order: number
  is_active: boolean
}

function buildChildren(
  parentKey: keyof typeof PARENTS,
  children: Array<{ name: string; slug: string; sortOrder: number }>
): NewCategory[] {
  const parent = PARENTS[parentKey]
  return children.map(({ name, slug, sortOrder }) => ({
    id: randomUUID(),
    parent_id: parent.id,
    name,
    slug,
    depth: parent.depth + 1,
    path: `${parent.path}/${slug}`,
    sort_order: sortOrder,
    is_active: true,
  }))
}

// A) Analog Kameralar alt kategorileri
const analogChildren = buildChildren("cctv-analog-kameralar", [
  { name: "Analog Bullet", slug: "analog-kameralar-analog-bullet", sortOrder: 1 },
  { name: "Analog Dome",   slug: "analog-kameralar-analog-dome",   sortOrder: 2 },
  { name: "Analog Box",    slug: "analog-kameralar-analog-box",    sortOrder: 3 },
  { name: "Analog PTZ",    slug: "analog-kameralar-analog-ptz",    sortOrder: 4 },
])

// B) Monitör alt kategorileri (49" and 55")
const monitorChildren = buildChildren("bilgisayar-sunucu-monitor", [
  { name: '49" Monitör', slug: "monitorler-49-monitor", sortOrder: 6 },
  { name: '55" Monitör', slug: "monitorler-55-monitor", sortOrder: 7 },
])

const ALL_NEW_CATEGORIES: NewCategory[] = [...analogChildren, ...monitorChildren]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // ── Step 1: Insert new categories (skip if slug already exists) ────────
    let inserted = 0
    let skipped = 0

    for (const cat of ALL_NEW_CATEGORIES) {
      const exists = await client.query(
        "SELECT id FROM categories WHERE slug = $1",
        [cat.slug]
      )
      if (exists.rows.length > 0) {
        console.log(`  SKIP (already exists): ${cat.slug}`)
        skipped++
        continue
      }

      await client.query(
        `INSERT INTO categories
           (id, parent_id, name, slug, depth, path, sort_order, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          cat.id,
          cat.parent_id,
          cat.name,
          cat.slug,
          cat.depth,
          cat.path,
          cat.sort_order,
          cat.is_active,
        ]
      )
      console.log(`  INSERT: ${cat.slug} (depth=${cat.depth}, path=${cat.path})`)
      inserted++
    }

    // ── Step 2: Move cctv-trafik-dsp-kameralari under akilli-sistemler ────
    const trafikId = "b4c90adf-89b2-43ce-bd21-a1764ed84ec6"
    const akilli   = PARENTS["akilli-sistemler"]
    const trafikNewPath = `${akilli.path}/trafik-dsp-kameralari`
    const trafikNewDepth = akilli.depth + 1

    await client.query(
      `UPDATE categories
         SET parent_id  = $1,
             depth      = $2,
             path       = $3,
             updated_at = NOW()
       WHERE id = $4`,
      [akilli.id, trafikNewDepth, trafikNewPath, trafikId]
    )
    console.log(
      `  UPDATE cctv-trafik-dsp-kameralari → parent=akilli-sistemler, depth=${trafikNewDepth}, path=${trafikNewPath}`
    )

    await client.query("COMMIT")
    console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}, Updated: 1 (trafik)`)
  } catch (err) {
    await client.query("ROLLBACK")
    console.error("Transaction rolled back:", err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

main()
