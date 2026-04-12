/**
 * Kampanya seed script
 * Çalıştır: tsx prisma/seed-campaigns.ts
 * veya:     node --experimental-strip-types prisma/seed-campaigns.ts
 */

import "dotenv/config"
import { PrismaClient, CampaignSetType } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

async function main() {
  console.log("Kampanya seed başlıyor...")

  // Mevcut ürünlerden ilk 20'yi al
  const products = await prisma.product.findMany({
    where: { deletedAt: null, isActive: true },
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  if (products.length === 0) {
    console.warn("Ürün bulunamadı — önce ürün seed'i çalıştırın.")
    return
  }

  const now = new Date()
  const chunk = (arr: typeof products, size: number) => {
    const result = []
    for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
    return result
  }

  const [featuredProducts, outletProducts, bundleProducts] = chunk(products, Math.ceil(products.length / 3))

  // 1. FEATURED kampanya — "Haftanın Fırsatları"
  const featured = await prisma.campaignSet.upsert({
    where: { slug: "haftanin-firsatlari" },
    update: { isActive: true },
    create: {
      name: "Haftanın Fırsatları",
      slug: "haftanin-firsatlari",
      description: "Her hafta güncellenen özel indirimli ürünler. Kaçırmayın!",
      type: CampaignSetType.FEATURED,
      discountPct: 15,
      validFrom: now,
      validUntil: addDays(now, 7),
      isActive: true,
      sortOrder: 1,
    },
  })

  for (let i = 0; i < (featuredProducts ?? []).length; i++) {
    const p = featuredProducts![i]
    await prisma.campaignSetProduct.upsert({
      where: { campaignSetId_productId: { campaignSetId: featured.id, productId: p.id } },
      update: {},
      create: {
        campaignSetId: featured.id,
        productId: p.id,
        sortOrder: i,
        label: "%15",
      },
    })
  }
  console.log(`✓ FEATURED kampanya: ${featured.name} (${(featuredProducts ?? []).length} ürün)`)

  // 2. OUTLET kampanya — "Outlet Fırsatları"
  const outlet = await prisma.campaignSet.upsert({
    where: { slug: "outlet-firsatlari" },
    update: { isActive: true },
    create: {
      name: "Outlet Fırsatları",
      slug: "outlet-firsatlari",
      description: "Son stok ürünlerde büyük indirimler. Stoklar tükenene kadar geçerlidir.",
      type: CampaignSetType.OUTLET,
      discountPct: 25,
      validFrom: now,
      validUntil: addDays(now, 30),
      isActive: true,
      sortOrder: 2,
    },
  })

  for (let i = 0; i < (outletProducts ?? []).length; i++) {
    const p = outletProducts![i]
    await prisma.campaignSetProduct.upsert({
      where: { campaignSetId_productId: { campaignSetId: outlet.id, productId: p.id } },
      update: {},
      create: {
        campaignSetId: outlet.id,
        productId: p.id,
        sortOrder: i,
        label: "OUTLET",
      },
    })
  }
  console.log(`✓ OUTLET kampanya: ${outlet.name} (${(outletProducts ?? []).length} ürün)`)

  // 3. BUNDLE kampanya — "Ofis Paketi"
  const bundle = await prisma.campaignSet.upsert({
    where: { slug: "ofis-paketi-2024" },
    update: { isActive: true },
    create: {
      name: "Ofis Paketi 2024",
      slug: "ofis-paketi-2024",
      description: "Ofis kurulumu için ihtiyaç duyduğunuz tüm ürünler tek bir pakette.",
      type: CampaignSetType.BUNDLE,
      discountPct: 10,
      validFrom: now,
      validUntil: addDays(now, 14),
      isActive: true,
      sortOrder: 3,
    },
  })

  for (let i = 0; i < (bundleProducts ?? []).length; i++) {
    const p = bundleProducts![i]
    await prisma.campaignSetProduct.upsert({
      where: { campaignSetId_productId: { campaignSetId: bundle.id, productId: p.id } },
      update: {},
      create: {
        campaignSetId: bundle.id,
        productId: p.id,
        sortOrder: i,
        label: "BUNDLE",
      },
    })
  }
  console.log(`✓ BUNDLE kampanya: ${bundle.name} (${(bundleProducts ?? []).length} ürün)`)

  console.log("\nKampanya seed tamamlandı!")
}

main()
  .catch((e) => {
    console.error("Seed hatası:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
