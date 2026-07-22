import "dotenv/config"
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  // 1. Markaların supplier kaynaklarını bul
  const brandSources = await prisma.$queryRaw`
    SELECT b.id,
      STRING_AGG(DISTINCT s.code, ',' ORDER BY s.code) AS codes
    FROM brands b
    JOIN products p ON p.brand_id = b.id AND p.deleted_at IS NULL
    JOIN supplier_products sp ON sp.product_id = p.id
    JOIN suppliers s ON s.id = sp.supplier_id AND s.deleted_at IS NULL
    WHERE b.deleted_at IS NULL
    GROUP BY b.id
  ` as Array<{ id: string; codes: string }>

  console.log(`${brandSources.length} markanın kaynağı güncellenecek`)

  for (const { id, codes } of brandSources) {
    const codeList = codes.split(',').map(c => c.trim()).sort()
    const source = codeList.join(',')
    await prisma.brand.update({ where: { id }, data: { source } })
  }

  // 2. Ürünü olmayan markaları soft-delete
  const emptyBrands = await prisma.brand.findMany({
    where: { deletedAt: null, products: { none: { deletedAt: null } } },
    select: { id: true, name: true },
  })
  console.log(`\n${emptyBrands.length} ürünü olmayan marka silinecek (soft-delete)`)
  console.table(emptyBrands.slice(0, 30))

  const now = new Date()
  await prisma.brand.updateMany({
    where: { deletedAt: null, products: { none: { deletedAt: null } } },
    data: { deletedAt: now, isActive: false },
  })

  console.log('\nTamamlandı.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
