/**
 * DB Cleanup: B2BDepo + BizimHesap dışındaki tüm supplier'ları ve onlara bağlı
 * ürünleri/supplier_product'ları fiziksel siler.
 *
 * Strateji:
 *   1. KEEP = {b2bdepo, bizimhesap} (büyük/küçük harf duyarsız)
 *   2. Korunacak Product seti:
 *      - metadata.b2bdepo_id var, VEYA
 *      - en az bir SupplierProduct'ı KEEP supplier'lardan birine bağlı
 *   3. Transaction içinde:
 *      a. QuoteItem.productId → null (silinecek product'lara referans varsa, teklif kaydı korunur)
 *      b. CartItem / WishlistItem / PriceListItem / CampaignSetProduct / ProductTag / ProductCategory → DELETE (silinecek product'lara)
 *      c. SupplierProduct → DELETE (silinecek supplier'lara) [PriceHistory cascade]
 *      d. Product → DELETE (korunmayanlar) [ProductCategory/ProductTag cascade zaten]
 *      e. ScraperLog → DELETE (silinecek supplier'lara)
 *      f. SupplierCategoryMap → DELETE (b2bdepo/bizimhesap dışı)
 *      g. Supplier → DELETE (KEEP dışı)
 *
 * Yedek: /tmp/opencode/neon-backup.sql
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

const KEEP_CODES_LOWER = ["b2bdepo", "bizimhesap"]

async function main() {
  // ---- HAZIRLIK: ID setleri ----
  const allSuppliers = await prisma.supplier.findMany({ select: { id: true, code: true } })
  const keepSupplierIds = allSuppliers
    .filter((s) => KEEP_CODES_LOWER.includes(s.code.toLowerCase()))
    .map((s) => s.id)
  const deleteSupplierIds = allSuppliers
    .filter((s) => !KEEP_CODES_LOWER.includes(s.code.toLowerCase()))
    .map((s) => s.id)

  if (keepSupplierIds.length === 0) {
    throw new Error("KEEP supplier bulunamadı, abort")
  }
  if (deleteSupplierIds.length === 0) {
    console.log("Silinecek supplier yok, çıkılıyor.")
    return
  }

  console.log(`KEEP supplier count: ${keepSupplierIds.length}`)
  console.log(`DELETE supplier count: ${deleteSupplierIds.length}`)

  // Korunacak Product ID'leri
  const keepProductRows = await prisma.product.findMany({
    where: {
      OR: [
        { metadata: { path: ["b2bdepo_id"], not: null } } as any,
        { supplierProducts: { some: { supplierId: { in: keepSupplierIds } } } },
      ],
    },
    select: { id: true },
  })
  const keepProductIds = keepProductRows.map((r) => r.id)
  console.log(`KEEP product count: ${keepProductIds.length}`)

  const allProductCount = await prisma.product.count()
  console.log(`Toplam product: ${allProductCount} → silinecek: ${allProductCount - keepProductIds.length}`)

  // ---- TRANSACTION ----
  const result = await prisma.$transaction(
    async (tx) => {
      const stats: Record<string, number> = {}

      // 1. QuoteItem.productId → null (silinecek product'lara)
      // PriceHistory cascade (SupplierProduct silinince)
      const q = await tx.$executeRaw`
        UPDATE quote_items
        SET product_id = NULL
        WHERE product_id IS NOT NULL
          AND product_id NOT IN (
            SELECT unnest(${keepProductIds}::uuid[])
          )
      `
      stats.quoteItem_nullified = q
      console.log(`  ✓ QuoteItem.productId → null: ${q}`)

      // 2. CartItem / WishlistItem / PriceListItem / CampaignSetProduct / ProductTag / ProductCategory
      // Bu tabloları korunacak product seti DIŞINDA olanlardan temizle
      // keepProductIds boş olamaz (en azından b2bdepo var)
      const cartDel = await tx.cartItem.deleteMany({
        where: { productId: { notIn: keepProductIds } },
      })
      stats.cartItem_deleted = cartDel.count
      console.log(`  ✓ CartItem delete: ${cartDel.count}`)

      const wishDel = await tx.wishlistItem.deleteMany({
        where: { productId: { notIn: keepProductIds } },
      })
      stats.wishlistItem_deleted = wishDel.count
      console.log(`  ✓ WishlistItem delete: ${wishDel.count}`)

      const pliDel = await tx.priceListItem.deleteMany({
        where: { productId: { notIn: keepProductIds } },
      })
      stats.priceListItem_deleted = pliDel.count
      console.log(`  ✓ PriceListItem delete: ${pliDel.count}`)

      const cspDel = await tx.campaignSetProduct.deleteMany({
        where: { productId: { notIn: keepProductIds } },
      })
      stats.campaignSetProduct_deleted = cspDel.count
      console.log(`  ✓ CampaignSetProduct delete: ${cspDel.count}`)

      const ptDel = await tx.productTag.deleteMany({
        where: { productId: { notIn: keepProductIds } },
      })
      stats.productTag_deleted = ptDel.count
      console.log(`  ✓ ProductTag delete: ${ptDel.count}`)

      const pcDel = await tx.productCategory.deleteMany({
        where: { productId: { notIn: keepProductIds } },
      })
      stats.productCategory_deleted = pcDel.count
      console.log(`  ✓ ProductCategory delete: ${pcDel.count}`)

      // 3. SupplierProduct → DELETE (silinecek supplier'lara)
      // PriceHistory onDelete:Cascade olduğu için otomatik gider
      const spDel = await tx.supplierProduct.deleteMany({
        where: { supplierId: { in: deleteSupplierIds } },
      })
      stats.supplierProduct_deleted = spDel.count
      console.log(`  ✓ SupplierProduct delete: ${spDel.count} (PriceHistory cascade)`)

      // 4. Product → DELETE (korunmayanlar)
      // OrderItem.productId şu an NULL yapıldı (adım 1'de sadece silinecek'lere; order yoktu zaten)
      // Ama yine de kontrol: Product delete ederken hala FK violation olmasın diye
      const pDel = await tx.product.deleteMany({
        where: { id: { notIn: keepProductIds } },
      })
      stats.product_deleted = pDel.count
      console.log(`  ✓ Product delete: ${pDel.count}`)

      // 5. ScraperLog → DELETE (silinecek supplier'lara)
      const slDel = await tx.scraperLog.deleteMany({
        where: { supplierId: { in: deleteSupplierIds } },
      })
      stats.scraperLog_deleted = slDel.count
      console.log(`  ✓ ScraperLog delete: ${slDel.count}`)

      // 6. SupplierCategoryMap → DELETE (b2bdepo/bizimhesap dışı)
      const scmDel = await tx.supplierCategoryMap.deleteMany({
        where: {
          supplierCode: {
            not: { in: KEEP_CODES_LOWER.map((c) => c.toUpperCase()).concat(KEEP_CODES_LOWER) },
          },
        },
      })
      stats.supplierCategoryMap_deleted = scmDel.count
      console.log(`  ✓ SupplierCategoryMap delete: ${scmDel.count}`)

      // 7. Supplier → DELETE
      const sDel = await tx.supplier.deleteMany({
        where: { id: { in: deleteSupplierIds } },
      })
      stats.supplier_deleted = sDel.count
      console.log(`  ✓ Supplier delete: ${sDel.count}`)

      return stats
    },
    { timeout: 300_000 } // 5 dk
  )

  console.log("\n=== TRANSACTION TAMAMLANDI ===")
  console.log(JSON.stringify(result, null, 2))

  // ---- DOĞRULAMA ----
  console.log("\n=== DOĞRULAMA ===")
  const remainingSuppliers = await prisma.supplier.findMany({ select: { code: true, name: true } })
  console.log("Kalan supplier'lar:", remainingSuppliers.map((s) => s.code))
  const remainingProducts = await prisma.product.count()
  console.log("Kalan product sayısı:", remainingProducts)
  const remainingSupplierProducts = await prisma.supplierProduct.count()
  console.log("Kalan supplierProduct sayısı:", remainingSupplierProducts)
}

main()
  .catch((e) => {
    console.error("CLEANUP ERROR:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
