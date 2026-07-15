/**
 * Preflight: silinecek kayıt sayılarını raporlar.
 * HİÇBİR ŞEYİ SİLMEZ, sadece SELECT.
 */
import { config } from "dotenv"
config()
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("sslmode=require") || connectionString.includes(".neon.tech")
    ? { rejectUnauthorized: false }
    : false,
})
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

// Korunacak supplier kodları (büyük/küçük harf duyarsız)
// b2bdepo: tek ürün tedarikçisi
// bizimhesap: ERP/muhasebe entegrasyonu (fatura, müşteri, stok sync) — ürün tedarikçisi değil
const KEEP_CODES = ["b2bdepo", "bizimhesap"]

async function main() {
  // 1. Supplier kayıtları
  const allSuppliers = await prisma.supplier.findMany({
    select: { id: true, code: true, name: true, isActive: true },
  })
  const keepIds = new Set(
    allSuppliers.filter((s) => KEEP_CODES.includes(s.code.toLowerCase())).map((s) => s.id)
  )
  const deleteSupplierIds = allSuppliers.filter((s) => !keepIds.has(s.id)).map((s) => s.id)

  console.log("\n=== SUPPLIERS ===")
  console.log("Toplam:", allSuppliers.length)
  console.log("Korunacak (b2bdepo):", allSuppliers.filter((s) => keepIds.has(s.id)).map((s) => `${s.code}(${s.name})`))
  console.log("Silinecek supplier'lar:")
  for (const s of allSuppliers.filter((s) => !keepIds.has(s.id))) {
    console.log(`  - ${s.code}  | ${s.name}  | active=${s.isActive}`)
  }
  console.log("Silinecek supplier ID sayısı:", deleteSupplierIds.length)

  if (deleteSupplierIds.length === 0) {
    console.log("\n!! Silinecek supplier yok, abort")
    return
  }

  // 2. SupplierProduct — silinecek supplier'lara bağlı olanlar
  const supplierProductsToDelete = await prisma.supplierProduct.count({
    where: { supplierId: { in: deleteSupplierIds } },
  })
  const supplierProductsToKeep = await prisma.supplierProduct.count({
    where: { supplierId: { in: Array.from(keepIds) } },
  })
  console.log("\n=== SUPPLIER_PRODUCTS ===")
  console.log("Silinecek supplier'lara bağlı:", supplierProductsToDelete)
  console.log("b2bdepo'ya bağlı (korunacak):", supplierProductsToKeep)

  // 3. Product sayıları — korunabilir: metadata.b2bdepo_id varsa VEYA herhangi bir korunacak supplier'a SupplierProduct bağlı
  const allProductsCount = await prisma.product.count()
  const b2bdepoMetaProducts = await prisma.product.count({
    where: { metadata: { path: ["b2bdepo_id"], not: null } } as any,
  })
  const keepLinkedProducts = await prisma.product.count({
    where: {
      supplierProducts: { some: { supplierId: { in: Array.from(keepIds) } } },
    },
  })
  console.log("\n=== PRODUCTS ===")
  console.log("Toplam product:", allProductsCount)
  console.log("metadata.b2bdepo_id olan:", b2bdepoMetaProducts)
  console.log("korunacak supplier'a SupplierProduct bağlı:", keepLinkedProducts)
  console.log("Silinecek product (korumalı hariç):", allProductsCount - Math.max(b2bdepoMetaProducts, keepLinkedProducts))

  // 4. Bağımlılıklar — korunacak sette OLMAYAN product'lara referanslar
  const keepProductIdsRaw = await prisma.product.findMany({
    where: {
      OR: [
        { metadata: { path: ["b2bdepo_id"], not: null } } as any,
        { supplierProducts: { some: { supplierId: { in: Array.from(keepIds) } } } },
      ],
    },
    select: { id: true },
  })
  const keepProductIds = new Set(keepProductIdsRaw.map((p) => p.id))
  console.log("\nKorunacak product sayısı:", keepProductIds.size)

  const inClause = `(${Array.from(keepProductIds).map((id) => `'${id}'`).join(",")})`
  // Eğer keepProductIds boşsa hepsi silinir
  const notInKeep = keepProductIds.size === 0 ? "" : `AND product_id NOT IN ${inClause}`

  // Raw sayımlar
  const queries = [
    ["CartItem (silinecek)", `SELECT COUNT(*) FROM cart_items WHERE true ${notInKeep}`],
    ["WishlistItem (silinecek)", `SELECT COUNT(*) FROM wishlist_items WHERE true ${notInKeep}`],
    ["PriceListItem (silinecek)", `SELECT COUNT(*) FROM price_list_items WHERE true ${notInKeep}`],
    ["CampaignSetProduct (silinecek)", `SELECT COUNT(*) FROM campaign_set_products WHERE true ${notInKeep}`],
    ["ProductTag (cascade zaten)", `SELECT COUNT(*) FROM product_tags WHERE true ${notInKeep}`],
    ["ProductCategory (cascade zaten)", `SELECT COUNT(*) FROM product_categories WHERE true ${notInKeep}`],
    ["OrderItem (productId null yapılacak)", `SELECT COUNT(*) FROM order_items WHERE product_id IS NOT NULL ${notInKeep.replace("product_id", "product_id")}`],
    ["QuoteItem (productId null yapılacak)", `SELECT COUNT(*) FROM quote_items WHERE product_id IS NOT NULL ${notInKeep.replace("product_id", "product_id")}`],
  ] as const

  console.log("\n=== PRODUCT BAĞIMLILIKLARI ===")
  for (const [label, q] of queries) {
    try {
      const r = await prisma.$queryRawUnsafe<{ count: bigint }[]>(q)
      console.log(`  ${label}: ${r[0].count}`)
    } catch (e) {
      console.log(`  ${label}: HATA - ${(e as Error).message.slice(0, 100)}`)
    }
  }

  // 5. ScraperLog ve SupplierCategoryMap
  console.log("\n=== DİĞER ===")
  const scraperLogs = await prisma.scraperLog.count({ where: { supplierId: { in: deleteSupplierIds } } })
  console.log("  ScraperLog (silinecek supplier'lara):", scraperLogs)
  const catMaps = await prisma.supplierCategoryMap.count({
    where: { supplierCode: { not: { equals: "b2bdepo" } } },
  })
  console.log("  SupplierCategoryMap (b2bdepo dışı):", catMaps)
}

main()
  .catch((e) => {
    console.error("PREFLIGHT ERROR:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
