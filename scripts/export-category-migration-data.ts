/**
 * Export Category Migration Data
 *
 * A) Full category tree under the 12 legitimate root categories
 * B) All products from the 29 "saçma" (wrong) root categories
 *
 * Outputs:
 *   data/legitimate-category-tree.json
 *   data/misplaced-products.json
 *
 * Usage:
 *   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nextai \
 *     npx tsx scripts/export-category-migration-data.ts
 */

import "dotenv/config"
import { Pool } from "pg"
import * as fs from "fs"
import * as path from "path"

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/nextai"

const pool = new Pool({ connectionString: DATABASE_URL })

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LEGITIMATE_ROOT_SLUGS = [
  "cctv",
  "bilgisayar-sunucu",
  "network-fiber",
  "pc-bilesenleri",
  "yazici-tarayici",
  "gecis-kontrol-alarm",
  "guc-elektronigi",
  "kablo-aksesuar",
  "cevre-birimleri-aksesuar",
  "yazilim-lisans",
  "pos-barkod",
  "akilli-sistemler",
]

const WRONG_ROOT_SLUGS = [
  "dahua",
  "tiandy",
  "cnb",
  "hikvision",
  "hdcvi-kamera",
  "hdcvi-urunler",
  "ip-urunler",
  "akilli-ev-otomasyon",
  "ex-proof-ve-anti-korozyon",
  "fiber-optik-sistemler",
  "diger-urunler",
  "mobil-urunler",
  "2-megapixel",
  "eaton-yangin",
  "4-megapixel",
  "5-megapixel",
  "monitor-ve-videowall",
  "goruntuleme-ve-kontrol",
  "covid-19-tespit-urunleri",
  "transmisyon",
  "8-megapixel",
  "trafik-cozumleri",
  "4k-serisi",
  "3-megapiksel",
  "access-switchler",
  "lazer-termal-urunler",
  "vth",
  "12-megapixel",
  "acik-i-stasyon",
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CategoryNode {
  id: string
  name: string
  slug: string
  parentId: string | null
  depth: number
  path: string | null
  productCount: number
}

interface MisplacedProduct {
  id: string
  name: string
  currentCategoryId: string | null
  currentCategorySlug: string | null
  currentCategoryName: string | null
}

// ---------------------------------------------------------------------------
// Part A: Legitimate category tree
// ---------------------------------------------------------------------------

async function exportLegitimateCategories(): Promise<CategoryNode[]> {
  console.log("\n[A] Exporting legitimate category tree...")

  // Get the root category IDs for the 12 legitimate slugs
  const slugPlaceholders = LEGITIMATE_ROOT_SLUGS.map((_, i) => `$${i + 1}`).join(", ")
  const { rows: rootRows } = await pool.query(
    `SELECT id, slug FROM categories WHERE slug IN (${slugPlaceholders}) AND deleted_at IS NULL`,
    LEGITIMATE_ROOT_SLUGS
  )

  console.log(`  Found ${rootRows.length}/${LEGITIMATE_ROOT_SLUGS.length} legitimate root categories`)

  const missingRoots = LEGITIMATE_ROOT_SLUGS.filter(
    (slug) => !rootRows.some((r) => r.slug === slug)
  )
  if (missingRoots.length > 0) {
    console.warn(`  WARNING: Missing root slugs: ${missingRoots.join(", ")}`)
  }

  const rootIds = rootRows.map((r: { id: string }) => r.id)

  if (rootIds.length === 0) {
    console.warn("  No legitimate root categories found.")
    return []
  }

  // Use a recursive CTE to fetch all descendants of the legitimate roots,
  // plus product counts per category.
  const rootIdPlaceholders = rootIds.map((_, i) => `$${i + 1}`).join(", ")

  const { rows } = await pool.query(
    `WITH RECURSIVE cat_tree AS (
       -- Anchor: the 12 legitimate root categories
       SELECT
         c.id,
         c.name,
         c.slug,
         c.parent_id AS "parentId",
         c.depth,
         c.path
       FROM categories c
       WHERE c.id IN (${rootIdPlaceholders})
         AND c.deleted_at IS NULL

       UNION ALL

       -- Recursive: all descendants
       SELECT
         c.id,
         c.name,
         c.slug,
         c.parent_id AS "parentId",
         c.depth,
         c.path
       FROM categories c
       INNER JOIN cat_tree ct ON c.parent_id = ct.id
       WHERE c.deleted_at IS NULL
     ),
     product_counts AS (
       SELECT
         p.category_id,
         COUNT(*) AS cnt
       FROM products p
       WHERE p.deleted_at IS NULL
       GROUP BY p.category_id
     )
     SELECT
       ct.id,
       ct.name,
       ct.slug,
       ct."parentId",
       ct.depth,
       ct.path,
       COALESCE(pc.cnt, 0)::int AS "productCount"
     FROM cat_tree ct
     LEFT JOIN product_counts pc ON pc.category_id = ct.id
     ORDER BY ct.depth, ct.name`,
    rootIds
  )

  console.log(`  Total categories in legitimate tree: ${rows.length}`)

  const byDepth: Record<number, number> = {}
  for (const row of rows) {
    byDepth[row.depth] = (byDepth[row.depth] ?? 0) + 1
  }
  for (const [depth, count] of Object.entries(byDepth).sort()) {
    console.log(`    depth=${depth}: ${count} categories`)
  }

  const totalProducts = rows.reduce((sum, r) => sum + r.productCount, 0)
  console.log(`  Total products directly assigned: ${totalProducts}`)

  return rows as CategoryNode[]
}

// ---------------------------------------------------------------------------
// Part B: Misplaced products (from wrong root categories)
// ---------------------------------------------------------------------------

async function exportMisplacedProducts(): Promise<MisplacedProduct[]> {
  console.log("\n[B] Exporting misplaced products from wrong root categories...")

  // Resolve wrong root category IDs
  const slugPlaceholders = WRONG_ROOT_SLUGS.map((_, i) => `$${i + 1}`).join(", ")
  const { rows: wrongRoots } = await pool.query(
    `SELECT id, slug FROM categories WHERE slug IN (${slugPlaceholders}) AND deleted_at IS NULL`,
    WRONG_ROOT_SLUGS
  )

  console.log(`  Found ${wrongRoots.length}/${WRONG_ROOT_SLUGS.length} wrong root categories in DB`)

  const missingWrong = WRONG_ROOT_SLUGS.filter(
    (slug) => !wrongRoots.some((r) => r.slug === slug)
  )
  if (missingWrong.length > 0) {
    console.warn(`  WARNING: Wrong slugs not found in DB: ${missingWrong.join(", ")}`)
  }

  const wrongRootIds = wrongRoots.map((r: { id: string }) => r.id)

  if (wrongRootIds.length === 0) {
    console.warn("  No wrong root categories found in DB.")
    return []
  }

  // Recursively collect ALL category IDs under the wrong roots (including the roots themselves),
  // then fetch all products in those categories.
  const rootIdPlaceholders = wrongRootIds.map((_, i) => `$${i + 1}`).join(", ")

  const { rows: products } = await pool.query(
    `WITH RECURSIVE wrong_cats AS (
       -- Anchor: the 29 wrong root categories
       SELECT id FROM categories
       WHERE id IN (${rootIdPlaceholders})
         AND deleted_at IS NULL

       UNION ALL

       -- Recursive: all descendants
       SELECT c.id
       FROM categories c
       INNER JOIN wrong_cats wc ON c.parent_id = wc.id
       WHERE c.deleted_at IS NULL
     )
     SELECT
       p.id,
       p.name,
       p.category_id   AS "currentCategoryId",
       cat.slug        AS "currentCategorySlug",
       cat.name        AS "currentCategoryName"
     FROM products p
     INNER JOIN wrong_cats wc ON wc.id = p.category_id
     LEFT JOIN categories cat ON cat.id = p.category_id
     WHERE p.deleted_at IS NULL
     ORDER BY cat.name, p.name`,
    wrongRootIds
  )

  console.log(`  Total misplaced products: ${products.length}`)

  // Summarize by current category
  const byCat: Record<string, number> = {}
  for (const p of products) {
    const key = p.currentCategorySlug ?? "(no category)"
    byCat[key] = (byCat[key] ?? 0) + 1
  }
  const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1])
  console.log(`  Breakdown by category (top 20):`)
  for (const [slug, count] of sorted.slice(0, 20)) {
    console.log(`    ${slug}: ${count}`)
  }
  if (sorted.length > 20) {
    console.log(`    ... and ${sorted.length - 20} more categories`)
  }

  return products as MisplacedProduct[]
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Category Migration Data Export ===")
  console.log(`DB: ${DATABASE_URL.replace(/:([^:@]+)@/, ":***@")}`)

  const outputDir = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    "..",
    "data"
  )

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
    console.log(`Created output dir: ${outputDir}`)
  }

  try {
    // A) Legitimate category tree
    const legitimateTree = await exportLegitimateCategories()
    const treeOutputPath = path.join(outputDir, "legitimate-category-tree.json")
    fs.writeFileSync(treeOutputPath, JSON.stringify(legitimateTree, null, 2), "utf-8")
    console.log(`\n  Saved: ${treeOutputPath} (${legitimateTree.length} entries)`)

    // B) Misplaced products
    const misplacedProducts = await exportMisplacedProducts()
    const productsOutputPath = path.join(outputDir, "misplaced-products.json")
    fs.writeFileSync(productsOutputPath, JSON.stringify(misplacedProducts, null, 2), "utf-8")
    console.log(`\n  Saved: ${productsOutputPath} (${misplacedProducts.length} entries)`)

    console.log("\n=== Export complete ===")
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error("Fatal error:", err)
  pool.end()
  process.exit(1)
})
