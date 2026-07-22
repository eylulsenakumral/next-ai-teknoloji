/**
 * B2BDepo Bulk Sync — tek tek yerine toplu (batch) insert
 * 2880 ürünü ~30 sorguda oluşturur (eski yöntem ~30000 sorgu)
 *
 * Kullanım: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/bulk-sync.ts
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import "dotenv/config"
import { prisma } from "../src/lib/db"
import { B2BDepoXmlFetcher } from "../workers/scraper/suppliers/b2bdepo-xml"

// ── Slug yardımcıları ──

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

/** Bir liste için benzersiz slug'lar üret (DB sorgusu yok) */
function uniqueSlugs(names: string[]): Map<string, string> {
  const used = new Set<string>()
  const result = new Map<string, string>()
  for (const name of names) {
    let slug = slugify(name)
    let attempt = 0
    while (used.has(slug)) {
      attempt++
      slug = `${slugify(name)}-${attempt}`
    }
    used.add(slug)
    result.set(name, slug)
  }
  return result
}

// ── Ana ──

async function main() {
  const t0 = Date.now()
  console.log("╔══════════════════════════════════════╗")
  console.log("║   B2BDepo Bulk Sync                  ║")
  console.log("╚══════════════════════════════════════╝\n")

  // 0. Temizlik
  console.log("0. DB temizleniyor...")
  await Promise.all([
    prisma.orderItem.deleteMany({}),
    prisma.campaignSetProduct.deleteMany({}),
    prisma.productCategory.deleteMany({}),
    prisma.cartItem.deleteMany({}),
    prisma.wishlistItem.deleteMany({}),
    prisma.priceListItem.deleteMany({}),
  ])
  await prisma.supplierProduct.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.brand.deleteMany({})
  await prisma.category.deleteMany({})
  try { await prisma.setting.deleteMany({ where: { key: { contains: "b2bdepo" } } }) } catch {}
  console.log("   Temizlendi.\n")

  // 1. XML çek
  console.log("1. ProductList XML çekiliyor...")
  const fetcher = new B2BDepoXmlFetcher()
  const xml = await fetcher.fetchProductList()
  console.log(`   ${xml.products.length} ürün alındı (${((Date.now() - t0) / 1000).toFixed(1)}s)\n`)

  // 2. B2BDepo supplier
  const supplier = await prisma.supplier.upsert({
    where: { code: "b2bdepo" },
    update: { syncStatus: "RUNNING" },
    create: {
      code: "b2bdepo", name: "B2BDepo", websiteUrl: "https://www.b2bdepo.com",
      scraperType: "API", isActive: true, priority: 5, syncIntervalMinutes: 480,
    },
  })

  // 3. Kategorileri topla ve oluştur
  console.log("2. Kategoriler oluşturuluyor...")

  // Tüm kategori isimlerini topla (global slug havuzu için)
  const allCatNames = new Set<string>(["Diğer"])
  const rootNames = new Set<string>(["Diğer"])
  const subMap = new Map<string, Set<string>>()
  const leafMap = new Map<string, Set<string>>()

  for (const p of xml.products) {
    const ust = p.ustKategoriAdi?.trim()
    if (!ust) continue
    rootNames.add(ust)
    allCatNames.add(ust)
    const alt = p.altKategoriAdi?.trim()
    if (!alt) continue
    allCatNames.add(alt)
    if (!subMap.has(ust)) subMap.set(ust, new Set())
    subMap.get(ust)!.add(alt)
    const enAlt = p.enAltKategoriAdi?.trim()
    if (enAlt) {
      allCatNames.add(enAlt)
      const key = `${ust}>${alt}`
      if (!leafMap.has(key)) leafMap.set(key, new Set())
      leafMap.get(key)!.add(enAlt)
    }
  }

  // Global slug havuzu — tüm seviyeler tek havuzdan
  const catSlugMap = uniqueSlugs([...allCatNames])
  await prisma.category.createMany({
    data: [...rootNames].map((name) => ({
      name, slug: catSlugMap.get(name)!, parentId: null, depth: 0, isActive: true,
      sortOrder: name === "Diğer" ? 999 : 0,
    })),
  })
  const rootCats = await prisma.category.findMany({ where: { parentId: null, deletedAt: null }, select: { id: true, name: true } })
  const rootBy = new Map(rootCats.map((c) => [c.name.toLowerCase(), c.id]))

  // Alt kategoriler
  const subData: { name: string; slug: string; parentId: string; depth: number; isActive: boolean }[] = []
  for (const [ust, altSet] of subMap) {
    const parentId = rootBy.get(ust.toLowerCase())
    if (!parentId) continue
    for (const name of altSet) {
      subData.push({ name, slug: catSlugMap.get(name)!, parentId, depth: 1, isActive: true })
    }
  }
  if (subData.length) await prisma.category.createMany({ data: subData })
  const subCats = await prisma.category.findMany({ where: { depth: 1, deletedAt: null }, select: { id: true, name: true, parentId: true } })

  // En alt kategoriler
  const leafData: { name: string; slug: string; parentId: string; depth: number; isActive: boolean }[] = []
  for (const [key, leafSet] of leafMap) {
    const [ust, alt] = key.split(">")
    const parentId = subCats.find((c) => c.name.toLowerCase() === alt.toLowerCase() && c.parentId === rootBy.get(ust.toLowerCase()))?.id
    if (!parentId) continue
    for (const name of leafSet) {
      leafData.push({ name, slug: catSlugMap.get(name)!, parentId, depth: 2, isActive: true })
    }
  }
  if (leafData.length) await prisma.category.createMany({ data: leafData })

  // Kategori lookup: "ust>alt>enAlt" → id, "ust>alt" → id, "ust" → id
  const allCats = await prisma.category.findMany({ where: { deletedAt: null }, select: { id: true, name: true, parentId: true, depth: true } })
  const catBy = new Map<string, string>()
  const catNameByParent = new Map<string, Map<string, string>>()
  for (const c of allCats) {
    const pKey = c.parentId ?? "ROOT"
    if (!catNameByParent.has(pKey)) catNameByParent.set(pKey, new Map())
    catNameByParent.get(pKey)!.set(c.name.toLowerCase(), c.id)
  }
  function getCatId(ust?: string, alt?: string, enAlt?: string): string {
    const diger = rootBy.get("diğer")!
    if (!ust) return diger
    const rootId = rootBy.get(ust.toLowerCase()) ?? diger
    if (!alt) return rootId
    const subId = catNameByParent.get(rootId)?.get(alt.toLowerCase())
    if (!subId) return rootId
    if (!enAlt) return subId
    return catNameByParent.get(subId)?.get(enAlt.toLowerCase()) ?? subId
  }
  const catCount = allCats.length
  console.log(`   ${catCount} kategori oluşturuldu (${((Date.now() - t0) / 1000).toFixed(1)}s)\n`)

  // 4. Markaları topla ve oluştur
  console.log("3. Markalar oluşturuluyor...")
  const brandNames = new Set<string>()
  for (const p of xml.products) {
    const m = p.marka?.trim()
    if (m) brandNames.add(m)
  }
  const brandSlugs = uniqueSlugs([...brandNames])
  await prisma.brand.createMany({
    data: [...brandNames].map((name) => ({
      name, slug: brandSlugs.get(name)!, isActive: true, source: "b2bdepo",
    })),
  })
  const allBrands = await prisma.brand.findMany({ where: { deletedAt: null }, select: { id: true, name: true } })
  const brandBy = new Map(allBrands.map((b) => [b.name.toLowerCase(), b.id]))
  console.log(`   ${allBrands.length} marka oluşturuldu (${((Date.now() - t0) / 1000).toFixed(1)}s)\n`)

  // 5. Ürünleri oluştur (batch)
  console.log("4. Ürünler oluşturuluyor (batch)...")
  const productSlugs = uniqueSlugs(xml.products.map((p) => p.urunAdi))
  const productData = xml.products.map((p) => {
    const ust = p.ustKategoriAdi?.trim()
    const alt = p.altKategoriAdi?.trim()
    const enAlt = p.enAltKategoriAdi?.trim()
    const categoryId = getCatId(ust, alt, enAlt)
    const brandId = p.marka?.trim() ? brandBy.get(p.marka.trim().toLowerCase()) : undefined
    return {
      name: p.urunAdi,
      slug: productSlugs.get(p.urunAdi)!,
      barcode: p.ean ?? null,
      brandId: brandId ?? null,
      categoryId,
      images: p.resimler ?? [],
      isActive: true,
      unit: "ADET" as const,
      metadata: { b2bdepo_id: p.urunKodu } as Record<string, unknown>,
    }
  })

  // 500'er batch
  const BATCH = 500
  for (let i = 0; i < productData.length; i += BATCH) {
    const batch = productData.slice(i, i + BATCH)
    await prisma.product.createMany({ data: batch })
    process.stdout.write(`\r   ${Math.min(i + BATCH, productData.length)}/${productData.length} ürün`)
  }
  console.log(`\n   ${productData.length} ürün oluşturuldu (${((Date.now() - t0) / 1000).toFixed(1)}s)\n`)

  // 6. SupplierProduct'ları oluştur
  console.log("5. SupplierProduct'lar oluşturuluyor (batch)...")
  const createdProducts = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { id: true, metadata: true },
  })
  const productByExtId = new Map<string, string>()
  for (const p of createdProducts) {
    const meta = p.metadata as Record<string, unknown> | null
    const extId = meta?.b2bdepo_id as string | undefined
    if (extId) productByExtId.set(extId, p.id)
  }

  const spData = xml.products.map((p) => ({
    productId: productByExtId.get(p.urunKodu)!,
    supplierId: supplier.id,
    externalId: p.urunKodu,
    externalName: p.urunAdi,
    externalBarcode: p.ean ?? null,
    purchasePrice: p.ozelFiyat,
    vatRate: p.kdv,
    currency: "USD",
    stockQuantity: p.stok,
    isAvailable: p.stok > 0,
    matchMethod: p.ean ? "BARCODE" as const : "SKU" as const,
    matchConfidence: p.ean ? 100 : 80,
    lastScrapedAt: new Date(),
  })).filter((sp) => sp.productId)

  for (let i = 0; i < spData.length; i += BATCH) {
    await prisma.supplierProduct.createMany({ data: spData.slice(i, i + BATCH) })
    process.stdout.write(`\r   ${Math.min(i + BATCH, spData.length)}/${spData.length} supplierProduct`)
  }
  console.log(`\n   ${spData.length} supplierProduct oluşturuldu (${((Date.now() - t0) / 1000).toFixed(1)}s)\n`)

  // 7. Supplier durumunu güncelle
  await prisma.supplier.update({
    where: { code: "b2bdepo" },
    data: { syncStatus: "SUCCESS", lastSyncAt: new Date(), syncError: null },
  })

  // Final
  const totalSec = ((Date.now() - t0) / 1000).toFixed(1)
  const [fp, fb, fc, fsp] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.brand.count({ where: { deletedAt: null } }),
    prisma.category.count({ where: { deletedAt: null } }),
    prisma.supplierProduct.count({ where: { deletedAt: null } }),
  ])
  console.log("╔══════════════════════════════════════╗")
  console.log("║   BULK SYNC TAMAMLANDI                ║")
  console.log("╚══════════════════════════════════════╝")
  console.log(`   Toplam süre: ${totalSec}s`)
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
