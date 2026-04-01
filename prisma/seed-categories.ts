// ============================================================================
// Next AI Teknoloji - Category Seed Script v2 (TSV-driven)
// ============================================================================
// Reads categories from /home/tolgabrk/kategori-agaci.tsv
// Parses 5-level hierarchy, deduplicates, generates slugs, creates in DB.
//
// DANGER: With --force flag, DELETES all existing categories and re-creates.
//
// Usage:
//   npx tsx prisma/seed-categories.ts              # safe (fails if categories exist)
//   npx tsx prisma/seed-categories.ts --force       # delete + re-seed
//   npm run db:seed:categories                       # same as above
// ============================================================================

import "dotenv/config"
import { readFileSync } from "fs"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const TSV_PATH = "/home/tolgabrk/kategori-agaci.tsv"
const FORCE_RESET = process.argv.includes("--force")

// ---------------------------------------------------------------------------
// Slug generation (Turkish chars -> ASCII)
// ---------------------------------------------------------------------------
const TURKISH_CHAR_MAP: Record<string, string> = {
  "\u00e7": "c", "\u00c7": "c",
  "\u011f": "g", "\u011e": "g",
  "\u0131": "i", "\u0130": "i",
  "\u00f6": "o", "\u00d6": "o",
  "\u015f": "s", "\u015e": "s",
  "\u00fc": "u", "\u00dc": "u",
}

function generateSlug(text: string): string {
  // Remove wrapping double quotes (e.g. '"19"" Monitör"' -> '19" Monitör')
  let cleaned = text.replace(/^"|"$/g, "")

  // Lowercase
  cleaned = cleaned.toLowerCase()

  // Replace Turkish characters
  for (const [tr, replacement] of Object.entries(TURKISH_CHAR_MAP)) {
    cleaned = cleaned.replaceAll(tr, replacement)
  }

  // Replace special characters
  cleaned = cleaned.replace(/&/g, "ve")
  cleaned = cleaned.replace(/[/()"]/g, "")
  cleaned = cleaned.replace(/[^a-z0-9]+/g, "-")
  cleaned = cleaned.replace(/^-+|-+$/g, "")
  cleaned = cleaned.replace(/-+/g, "-")

  return cleaned
}

// ---------------------------------------------------------------------------
// TSV Row interface
// ---------------------------------------------------------------------------
interface TsvRow {
  level1: string
  level2: string
  level3: string
  level4: string
  level5: string
}

function parseTsv(filePath: string): TsvRow[] {
  const content = readFileSync(filePath, "utf-8")
  const lines = content.split("\n")
  const rows: TsvRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const columns = line.split("\t")
    rows.push({
      level1: columns[0]?.trim() || "",
      level2: columns[1]?.trim() || "",
      level3: columns[2]?.trim() || "",
      level4: columns[3]?.trim() || "",
      level5: columns[4]?.trim() || "",
    })
  }

  return rows
}

// ---------------------------------------------------------------------------
// Database setup
// ---------------------------------------------------------------------------
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ---------------------------------------------------------------------------
// Cache: "parentKey|name" -> category ID
// Slug usage counter for uniqueness enforcement
// ---------------------------------------------------------------------------
const categoryCache = new Map<string, string>() // key -> id
const slugUsageCount = new Map<string, number>() // slug -> count of times used globally

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------
interface SeedStats {
  created: number
  skipped: number
  errors: number
  slugCollisions: number
  byDepth: Record<number, number>
}

// ---------------------------------------------------------------------------
// Get or create a category
// ---------------------------------------------------------------------------
async function getOrCreateCategory(
  name: string,
  depth: number,
  parentId: string | null,
  parentPath: string | null,
  sortOrder: number,
  stats: SeedStats
): Promise<string> {
  // Deduplication key: parentId + name combination
  const parentKey = parentId || "__root__"
  const dedupKey = `${parentKey}|${name}`

  // Check cache
  const cached = categoryCache.get(dedupKey)
  if (cached) {
    stats.skipped++
    return cached
  }

  // Generate base slug
  const baseSlug = generateSlug(name)

  // Ensure global slug uniqueness
  const usage = slugUsageCount.get(baseSlug) || 0
  slugUsageCount.set(baseSlug, usage + 1)

  let finalSlug = baseSlug
  if (usage > 0) {
    finalSlug = `${baseSlug}-${usage + 1}`
    stats.slugCollisions++
  }

  // Calculate materialized path
  const path = parentPath ? `${parentPath}/${finalSlug}` : finalSlug

  // Create in database
  try {
    const category = await prisma.category.create({
      data: {
        name,
        slug: finalSlug,
        parentId,
        depth,
        path,
        isActive: true,
        sortOrder,
      },
    })

    stats.created++
    stats.byDepth[depth] = (stats.byDepth[depth] || 0) + 1

    categoryCache.set(dedupKey, category.id)
    return category.id
  } catch (error: any) {
    stats.errors++
    console.error(`  [ERROR] "${name}" (slug: ${finalSlug}, depth: ${depth}):`, error)
    throw error
  }
}

// ---------------------------------------------------------------------------
// Print tree for verification
// ---------------------------------------------------------------------------
async function printCategoryTree(): Promise<void> {
  const roots = await prisma.category.findMany({
    where: { parentId: null, deletedAt: null },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, depth: true, sortOrder: true },
  })

  async function printNode(
    cat: { id: string; name: string; slug: string; depth: number; sortOrder: number },
    indent: number
  ): Promise<void> {
    const prefix = "  ".repeat(indent)
    console.log(`${prefix}- ${cat.name} [${cat.slug}] (d:${cat.depth}, s:${cat.sortOrder})`)
    const children = await prisma.category.findMany({
      where: { parentId: cat.id, deletedAt: null },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, depth: true, sortOrder: true },
    })
    for (const child of children) {
      await printNode(child, indent + 1)
    }
  }

  console.log("\nCategory Tree:")
  for (const root of roots) {
    await printNode(root, 0)
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log("=== Category Seed Script v2 (TSV-driven) ===")
  console.log(`Timestamp: ${new Date().toISOString()}`)
  console.log(`Mode: ${FORCE_RESET ? "[FORCE - delete + re-seed]" : "[SAFE - fail if exists]"}`)
  console.log()

  // Step 1: Parse TSV
  console.log("[1/5] Parsing TSV file...")
  const tsvRows = parseTsv(TSV_PATH)
  console.log(`  Parsed ${tsvRows.length} rows from TSV.`)
  console.log()

  // Step 2: Handle existing data
  console.log("[2/5] Checking existing categories...")
  if (FORCE_RESET) {
    // Detach products from categories
    const productUpdateResult = await prisma.product.updateMany({
      where: { categoryId: { not: null } },
      data: { categoryId: null },
    })
    console.log(`  Detached ${productUpdateResult.count} products from categories.`)

    // Delete all categories
    const deleteResult = await prisma.category.deleteMany({})
    console.log(`  Deleted ${deleteResult.count} existing categories.`)
    // Clear caches
    categoryCache.clear()
    slugUsageCount.clear()
  } else {
    const existingCount = await prisma.category.count({ where: { deletedAt: null } })
    if (existingCount > 0) {
      console.log(`  [ABORT] Found ${existingCount} existing categories. Use --force to re-seed.`)
      await prisma.$disconnect()
      await pool.end()
      process.exit(1)
    }
    console.log("  No existing categories. Safe to proceed.")
  }
  console.log()

  // Step 3: Build hierarchy from TSV
  console.log("[3/5] Building category hierarchy from TSV...")

  const stats: SeedStats = {
    created: 0,
    skipped: 0,
    errors: 0,
    slugCollisions: 0,
    byDepth: {},
  }

  // Sort order trackers per parent
  const sortOrderTracker = new Map<string, number>()

  // Path tracker: category ID -> materialized path
  const pathTracker = new Map<string, string>()

  for (let rowIdx = 0; rowIdx < tsvRows.length; rowIdx++) {
    const row = tsvRows[rowIdx]
    const levels = [row.level1, row.level2, row.level3, row.level4, row.level5]

    let currentParentId: string | null = null
    let currentParentPath: string | null = null

    for (let depth = 0; depth < 5; depth++) {
      const name = levels[depth]
      if (!name) break // No more levels for this row

      // Get sort order for this parent
      const parentKey = currentParentId || "__root__"
      const so = sortOrderTracker.get(parentKey) || 0
      sortOrderTracker.set(parentKey, so + 1)

      // Create/get category
      const categoryId = await getOrCreateCategory(
        name,
        depth,
        currentParentId,
        currentParentPath,
        so,
        stats
      )

      // Update trackers for next level
      currentParentId = categoryId
      // Reconstruct path for this category
      const slug = generateSlug(name)
      currentParentPath = currentParentPath ? `${currentParentPath}/${slug}` : slug
    }
  }

  console.log()

  // Step 4: Summary
  console.log("[4/5] Seed complete.")
  console.log()
  console.log("--- Summary ---")
  console.log(`  Created        : ${stats.created}`)
  console.log(`  Skipped        : ${stats.skipped} (duplicates)`)
  console.log(`  Errors         : ${stats.errors}`)
  console.log(`  Slug collisions: ${stats.slugCollisions} (resolved with suffix)`)
  console.log(`  By depth:`)
  for (const [depth, cnt] of Object.entries(stats.byDepth).sort(
    (a, b) => Number(a[0]) - Number(b[0])
  )) {
    console.log(`    Depth ${depth}: ${cnt} created`)
  }
  console.log()

  const finalCount = await prisma.category.count({ where: { deletedAt: null } })
  console.log(`  Total categories in DB: ${finalCount}`)
  console.log()

  // Step 5: Print tree
  console.log("[5/5] Verifying category tree...")
  await printCategoryTree()
  console.log()
  console.log("=== Done ===")
}

main()
  .catch((e) => {
    console.error("FATAL: Category seed failed.", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
