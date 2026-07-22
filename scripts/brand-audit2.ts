import "dotenv/config"
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const suppliers = await prisma.$queryRaw`SELECT id, code, name FROM suppliers WHERE deleted_at IS NULL ORDER BY code` as Array<{id:string;code:string;name:string}>
  console.log('Suppliers:')
  console.table(suppliers)

  const brandsNoProducts = await prisma.$queryRaw`
    SELECT b.id, b.name, b.slug
    FROM brands b
    WHERE b.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM products p WHERE p.brand_id = b.id AND p.deleted_at IS NULL)
  ` as Array<{id:string;name:string;slug:string}>
  console.log(`\nÜrünü olmayan aktif marka sayısı: ${brandsNoProducts.length}`)
  console.table(brandsNoProducts)

  const brandSources = await prisma.$queryRaw`
    SELECT b.id, b.name,
      STRING_AGG(DISTINCT s.code, ', ' ORDER BY s.code) AS supplier_codes,
      COUNT(DISTINCT s.code) AS supplier_count
    FROM brands b
    JOIN products p ON p.brand_id = b.id AND p.deleted_at IS NULL
    JOIN supplier_products sp ON sp.product_id = p.id
    JOIN suppliers s ON s.id = sp.supplier_id AND s.deleted_at IS NULL
    WHERE b.deleted_at IS NULL
    GROUP BY b.id, b.name
    ORDER BY supplier_count, b.name
  ` as Array<{id:string;name:string;supplier_codes:string;supplier_count:string}>
  console.log(`\nMarka başına supplier kaynakları (${brandSources.length} marka):`)
  console.table(brandSources.slice(0, 50))

  const nonB2bBrands = brandSources.filter(b => {
    const codes = b.supplier_codes.split(',').map(c => c.trim())
    return !codes.every(c => c === 'b2bdepo' || c === 'bizimhesap')
  })
  console.log(`\nB2BDEPO/BIZIMHESAP dışında supplier içeren marka sayısı: ${nonB2bBrands.length}`)
  console.table(nonB2bBrands.slice(0, 50))
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
