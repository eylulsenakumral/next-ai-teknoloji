/**
 * link-supplier-products.ts
 *
 * IndexGrup ve Netex tedarikçi ürünlerini Product tablosuna bağlar.
 * B2BDepo/Okisan pattern'ini takip eder:
 *   1. Barkod ile mevcut Product ara
 *   2. Metadata ile mevcut Product ara
 *   3. Bulunamazsa yeni Product oluştur
 *   4. SupplierProduct.productId güncelle
 *
 * Kullanım:
 *   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nextai \
 *     npx tsx scripts/link-supplier-products.ts [--dry-run] [--supplier INDEXGRUP|NETEX]
 */

import "dotenv/config"

// ---- helpers (inline, b2bdepo-xml.service pattern) ----

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200)
}

function fixBigInt(o: unknown): unknown {
  if (typeof o === "bigint") return Number(o)
  if (Array.isArray(o)) return o.map(fixBigInt)
  if (o && typeof o === "object") {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      result[k] = fixBigInt(v)
    }
    return result
  }
  return o
}

// ---- main ----

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes("--dry-run")
  const supplierArg = args.find((a) => a.startsWith("--supplier"))?.split("=")[1]

  const supplierCodes = supplierArg
    ? [supplierArg.toUpperCase()]
    : ["INDEXGRUP", "NETEX"]

  console.log(`\n=== Link Supplier Products ===`)
  console.log(`Dry run: ${dryRun}`)
  console.log(`Suppliers: ${supplierCodes.join(", ")}`)

  // We need to use raw SQL since PrismaClient requires pg adapter setup
  // Use pg directly
  const { Pool } = await import("pg")
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  const stats = {
    total: 0,
    linked: 0,
    created: 0,
    matchedBarcode: 0,
    matchedMeta: 0,
    skipped: 0,
    errors: 0,
  }

  for (const code of supplierCodes) {
    console.log(`\n--- Processing ${code} ---`)

    // Get supplier ID
    const supplierRes = await pool.query(
      `SELECT id, code FROM suppliers WHERE code = $1 AND deleted_at IS NULL`,
      [code]
    )
    if (supplierRes.rows.length === 0) {
      console.log(`Supplier ${code} not found, skipping.`)
      continue
    }
    const supplierId = supplierRes.rows[0].id
    const metaKey = code.toLowerCase() === "indexgrup" ? "indexgrup_id" : "netex_id"

    // Get unlinked supplier products in batches
    const BATCH = 100
    let offset = 0
    let batchCount = 0

    while (true) {
      const { rows } = await pool.query(
        `SELECT id, external_id, external_name, external_barcode,
                purchase_price, vat_rate, stock_quantity,
                raw_data->>'_mappedCategoryId' as mapped_category_id,
                raw_data->>'_brand' as brand_name,
                raw_data->>'imageUrl' as image_url,
                raw_data->>'tax' as tax_rate_raw
         FROM supplier_products
         WHERE supplier_id = $1 AND deleted_at IS NULL AND product_id IS NULL
         ORDER BY id
         LIMIT $2 OFFSET $3`,
        [supplierId, BATCH, offset]
      )

      if (rows.length === 0) break
      batchCount++
      offset += BATCH

      for (const sp of rows) {
        stats.total++

        if (!sp.external_name || !sp.external_id) {
          stats.skipped++
          continue
        }

        try {
          let productId: string | null = null

          // 1. Try matching by barcode
          if (sp.external_barcode) {
            const { rows: barcodeMatches } = await pool.query(
              `SELECT id FROM products WHERE barcode = $1 AND deleted_at IS NULL LIMIT 1`,
              [sp.external_barcode]
            )
            if (barcodeMatches.length > 0) {
              productId = barcodeMatches[0].id
              stats.matchedBarcode++
            }
          }

          // 2. Try matching by metadata (supplier external_id)
          if (!productId) {
            const { rows: metaMatches } = await pool.query(
              `SELECT id FROM products
               WHERE metadata @> jsonb_build_object($1::text, $2::text)
                 AND deleted_at IS NULL
               LIMIT 1`,
              [metaKey, sp.external_id]
            )
            if (metaMatches.length > 0) {
              productId = metaMatches[0].id
              stats.matchedMeta++
            }
          }

          // 3. Create new product if not found
          if (!productId) {
            const slug = generateSlug(sp.external_name)

            // Ensure unique slug
            let finalSlug = slug
            let slugAttempt = 0
            while (true) {
              const { rows: slugCheck } = await pool.query(
                `SELECT id FROM products WHERE slug = $1 LIMIT 1`,
                [finalSlug]
              )
              if (slugCheck.length === 0) break
              slugAttempt++
              finalSlug = `${slug}-${slugAttempt}`
              if (slugAttempt > 50) {
                finalSlug = `${slug}-${Date.now()}`
                break
              }
            }

            // Upsert brand (gen_random_uuid() for id, CURRENT_TIMESTAMP for created_at/updated_at)
            let brandId: string | null = null
            if (sp.brand_name) {
              const brandSlug = generateSlug(sp.brand_name)
              const { rows: brandRes } = await pool.query(
                `INSERT INTO brands (id, name, slug, "is_active", created_at, updated_at)
                 VALUES (gen_random_uuid(), $1, $2, true, NOW(), NOW())
                 ON CONFLICT (slug) DO UPDATE SET name = $1, updated_at = NOW()
                 RETURNING id`,
                [sp.brand_name.trim(), brandSlug]
              )
              brandId = brandRes[0]?.id ?? null
            }

            const categoryId = sp.mapped_category_id || null

            // Parse images - imageUrl could be a JSON array string or single URL
            const images: string[] = []
            if (sp.image_url) {
              if (typeof sp.image_url === "string") {
                const raw = sp.image_url.trim()
                if (raw.startsWith("[")) {
                  try {
                    const parsed = JSON.parse(raw)
                    if (Array.isArray(parsed)) {
                      for (const item of parsed) {
                        if (typeof item === "string" && item.startsWith("http")) images.push(item)
                      }
                    }
                  } catch {
                    if (raw.startsWith("http")) images.push(raw)
                  }
                } else if (raw.startsWith("http")) {
                  images.push(raw)
                }
              } else if (Array.isArray(sp.image_url)) {
                for (const item of sp.image_url as unknown[]) {
                  if (typeof item === "string" && item.startsWith("http")) images.push(item)
                }
              }
            }

            if (dryRun) {
              stats.created++
              if (stats.created <= 5) {
                console.log(
                  `  [DRY] Would create: ${sp.external_name.slice(0, 60)} (cat: ${categoryId ? "mapped" : "none"}, brand: ${sp.brand_name || "none"})`
                )
              }
            } else {
              const { rows: newProduct } = await pool.query(
                `INSERT INTO products (
                   id, name, slug, barcode, brand_id, category_id, images,
                   "is_active", unit, metadata, created_at, updated_at
                 ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, 'ADET', $7, NOW(), NOW())
                 RETURNING id`,
                [
                  sp.external_name,
                  finalSlug,
                  sp.external_barcode || null,
                  brandId,
                  categoryId,
                  images.length > 0 ? images : null,
                  JSON.stringify({ [metaKey]: sp.external_id }),
                ]
              )
              productId = newProduct[0].id
              stats.created++
            }
          }

          // 4. Link supplier_product to product
          if (productId && !dryRun) {
            await pool.query(
              `UPDATE supplier_products SET product_id = $1, updated_at = NOW() WHERE id = $2`,
              [productId, sp.id]
            )
            stats.linked++
          } else if (dryRun && productId) {
            stats.linked++
          }

          // Progress
          if (stats.total % 200 === 0) {
            console.log(
              `  Progress: ${stats.total} processed (created: ${stats.created}, barcode: ${stats.matchedBarcode}, meta: ${stats.matchedMeta}, skipped: ${stats.skipped})`
            )
          }
        } catch (err) {
          stats.errors++
          if (stats.errors <= 10) {
            console.error(`  Error (${sp.external_id}): ${err instanceof Error ? err.message : err}`)
          }
        }
      }
    }

    console.log(`  ${code}: ${batchCount} batches processed`)
  }

  console.log(`\n=== Sonuç ===`)
  console.log(JSON.stringify(fixBigInt(stats), null, 2))

  if (dryRun) {
    console.log(`\n(DRY RUN - hiçbir değişiklik yapılmadı)`)
  }

  await pool.end()
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
