import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const brands = await prisma.brand.findMany({
    where: {
      deletedAt: null,
      isActive: true,
    },
    select: {
      name: true,
      slug: true,
      logoUrl: true,
    },
    orderBy: { name: 'asc' },
    take: 10,
  })

  console.log('İlk 10 marka:')
  console.log(JSON.stringify(brands, null, 2))

  const withLogos = brands.filter(b => b.logoUrl)
  console.log(`\nToplam: ${brands.length}, Logo olan: ${withLogos.length}`)

  await prisma.$disconnect()
}

main().catch(console.error)
