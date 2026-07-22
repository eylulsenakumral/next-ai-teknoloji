import "dotenv/config"
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const rows = await prisma.$queryRaw`
    SELECT s.code, COUNT(DISTINCT p.brand_id) AS brand_count, COUNT(*) AS product_count
    FROM supplier_products sp
    JOIN suppliers s ON s.id = sp.supplier_id
    JOIN products p ON p.id = sp.product_id
    WHERE s.code IN ('b2bdepo','bizimhesap')
    GROUP BY s.code
  ` as Array<{ code: string; brand_count: string; product_count: string }>
  console.log('Tedarikçi bazlı marka/ürün dağılımı:')
  console.table(rows)

  const allBrands = await prisma.$queryRaw`
    SELECT b.id, b.name, b.slug, b.deleted_at,
      (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.deleted_at IS NULL) AS product_count
    FROM brands b
    WHERE b.deleted_at IS NULL
    ORDER BY product_count DESC, b.name
  ` as Array<{ id: string; name: string; slug: string; deleted_at: string | null; product_count: string }>
  console.log(`\nToplam aktif marka: ${allBrands.length}`)
  console.table(allBrands.slice(0, 50))

  const supplierLinkedBrands = await prisma.$queryRaw`
    SELECT DISTINCT b.id, b.name
    FROM brands b
    JOIN products p ON p.brand_id = b.id
    JOIN supplier_products sp ON sp.product_id = p.id
    JOIN suppliers s ON s.id = sp.supplier_id
    WHERE s.code IN ('b2bdepo','bizimhesap') AND b.deleted_at IS NULL
  ` as Array<{ id: string; name: string }>
  console.log(`\nb2bdepo/bizimhesap ürünlerine bağlı marka sayısı: ${supplierLinkedBrands.length}`)

  const onlyOtherSuppliers = await prisma.$queryRaw`
    SELECT b.id, b.name, b.slug,
      (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.deleted_at IS NULL) AS product_count
    FROM brands b
    WHERE b.deleted_at IS NULL
      AND b.id NOT IN (
        SELECT DISTINCT p2.brand_id
        FROM products p2
        JOIN supplier_products sp2 ON sp2.product_id = p2.id
        JOIN suppliers s2 ON s2.id = sp2.supplier_id
        WHERE s2.code IN ('b2bdepo','bizimhesap') AND p2.deleted_at IS NULL
      )
    ORDER BY product_count DESC, b.name
  ` as Array<{ id: string; name: string; slug: string; product_count: string }>
  console.log(`\nSadece diğer kaynaklara bağlı/markasız marka sayısı: ${onlyOtherSuppliers.length}`)
  console.table(onlyOtherSuppliers.slice(0, 50))
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
