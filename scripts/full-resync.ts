/**
 * B2BDepo Full Re-Sync — sıfırdan başlangıç
 *
 * 1. Tüm ürünleri, markaları, kategorileri, supplier_product'ları siler
 * 2. B2BDepo ProductList XML'inden tüm ürünleri B2BDepo kategorileriyle çeker
 *
 * Kullanım: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/full-resync.ts
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import "dotenv/config"
import { prisma } from "../src/lib/db"
import { syncProducts } from "../src/services/b2bdepo-xml.service"

async function main() {
  console.log("╔══════════════════════════════════════════╗")
  console.log("║   B2BDepo Full Re-Sync (Sıfırdan)        ║")
  console.log("╚══════════════════════════════════════════╝\n")

  // ── 1. FK bağımlılıklarını sil ──
  console.log("1. FK bağımlılıkları siliniyor...")
  const fk = await Promise.all([
    prisma.orderItem.deleteMany({}),
    prisma.campaignSetProduct.deleteMany({}),
    prisma.productCategory.deleteMany({}),
    prisma.productTag.deleteMany({}),
    prisma.wishlistItem.deleteMany({}),
    prisma.cartItem.deleteMany({}),
    prisma.priceListItem.deleteMany({}),
  ])
  console.log(
    `   orderItem: ${fk[0].count} | campaignSetProduct: ${fk[1].count} | productCategory: ${fk[2].count}`
  )

  // ── 2. SupplierProduct'ları sil ──
  console.log("2. SupplierProduct'lar siliniyor...")
  const sp = await prisma.supplierProduct.deleteMany({})
  console.log(`   ${sp.count} kayıt silindi`)

  // ── 3. Ürünleri sil ──
  console.log("3. Ürünler siliniyor...")
  const products = await prisma.product.deleteMany({})
  console.log(`   ${products.count} ürün silindi`)

  // ── 4. Markaları sil ──
  console.log("4. Markalar siliniyor...")
  const brands = await prisma.brand.deleteMany({})
  console.log(`   ${brands.count} marka silindi`)

  // ── 5. Kategorileri sil (B2BDepo yapısı taze gelecek) ──
  console.log("5. Kategoriler siliniyor...")
  const cats = await prisma.category.deleteMany({})
  console.log(`   ${cats.count} kategori silindi`)

  // ── 6. Rate limit sayaçlarını sıfırla ──
  console.log("6. Rate limit sıfırlanıyor...")
  try {
    await prisma.setting.deleteMany({ where: { key: { contains: "b2bdepo" } } })
    console.log("   Sayaçlar temizlendi")
  } catch {
    console.log("   Setting tablosu atlandı")
  }

  // ── 7. B2BDepo Sync ──
  console.log("\n7. B2BDepo ProductList sync başlıyor (2880 ürün)...")
  console.log("   Kategoriler otomatik oluşturulacak (ust/alt/enAlt)\n")

  const startTime = Date.now()
  const result = await syncProducts()
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log("\n╔══════════════════════════════════════════╗")
  console.log("║   SYNC TAMAMLANDI                         ║")
  console.log("╚══════════════════════════════════════════╝")
  console.log(`   Synced:  ${result.synced}`)
  console.log(`   Created: ${result.created}`)
  console.log(`   Updated: ${result.updated}`)
  console.log(`   Errors:  ${result.errors}`)
  console.log(`   Süre:    ${totalDuration}s`)

  // Final sayım
  const [fp, fb, fc, fsp] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.brand.count({ where: { deletedAt: null } }),
    prisma.category.count({ where: { deletedAt: null } }),
    prisma.supplierProduct.count({ where: { deletedAt: null } }),
  ])
  console.log(`\n=== FİNAL DB DURUMU ===`)
  console.log(`   Ürünler:          ${fp}`)
  console.log(`   Markalar:         ${fb}`)
  console.log(`   Kategoriler:      ${fc}`)
  console.log(`   SupplierProducts: ${fsp}`)

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error("\n KRİTİK HATA:", err)
  process.exit(1)
})
