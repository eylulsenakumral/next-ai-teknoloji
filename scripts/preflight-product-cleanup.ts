/**
 * Pre-flight: Tüm product'ların supplier dağılımını raporlar.
 * Sadece SELECT, silme yapmaz.
 */
import { config } from "dotenv"
config()
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const cs = process.env.DATABASE_URL!
const pool = new Pool({
  connectionString: cs,
  ssl: cs.includes("neon.tech") ? { rejectUnauthorized: false } : false,
})
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  const totalProducts = await prisma.product.count()
  console.log(`\n=== TOPLAM PRODUCT: ${totalProducts} ===\n`)

  // 1. Metadata.b2bdepo_id'ye göre
  const b2bdepoMeta = await prisma.product.count({
    where: { metadata: { path: ["b2bdepo_id"], not: null } } as any,
  })
  console.log(`metadata.b2bdepo_id olan: ${b2bdepoMeta}`)

  // 2. Aktif supplier'lara SupplierProduct üzerinden bağlı
  const activeSuppliers = await prisma.supplier.findMany({
    select: { id: true, code: true, name: true },
  })
  console.log(`\nAktif supplier'lar (${activeSuppliers.length}):`)
  for (const s of activeSuppliers) {
    const count = await prisma.product.count({
      where: { supplierProducts: { some: { supplierId: s.id } } },
    })
    console.log(`  ${s.code} → ${count} product`)
  }

  // 3. Korunacak set: metadata.b2bdepo_id VEYA aktif supplier'a bağlı
  const activeSupplierIds = activeSuppliers.map((s) => s.id)
  const keepByMeta = await prisma.product.findMany({
    where: { metadata: { path: ["b2bdepo_id"], not: null } } as any,
    select: { id: true },
  })
  const keepBySupplier = await prisma.product.findMany({
    where: { supplierProducts: { some: { supplierId: { in: activeSupplierIds } } } },
    select: { id: true },
  })
  const keepIds = new Set([...keepByMeta.map((p) => p.id), ...keepBySupplier.map((p) => p.id)])
  console.log(`\nKorunacak product (b2bdepo metadata + aktif supplier): ${keepIds.size}`)
  console.log(`Silinecek product: ${totalProducts - keepIds.size}`)

  // 4. Silinecek ornek (10 adet)
  const orphans = await prisma.product.findMany({
    where: { id: { notIn: Array.from(keepIds) } },
    select: { id: true, name: true, slug: true, sku: true, createdAt: true, metadata: true },
    take: 10,
  })
  console.log(`\nSilinecek orphan ornekleri (ilk 10):`)
  for (const p of orphans) {
    console.log(`  ${p.name.slice(0, 60)} | sku=${p.sku} | created=${p.createdAt.toISOString().slice(0, 10)}`)
  }

  // 5. Metadata key dağılımı (hangi supplier'lardan kalma)
  const all = await prisma.product.findMany({
    select: { metadata: true },
    where: { metadata: { not: null } },
  })
  const keyCounts: Record<string, number> = {}
  for (const p of all) {
    if (p.metadata && typeof p.metadata === "object" && !Array.isArray(p.metadata)) {
      for (const k of Object.keys(p.metadata as object)) {
        keyCounts[k] = (keyCounts[k] ?? 0) + 1
      }
    }
  }
  console.log(`\nMetadata key dağılımı (hangi eski entegrasyondan kalma):`)
  for (const [k, v] of Object.entries(keyCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`)
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
