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
      logoUrl: null,
    },
    select: {
      name: true,
      slug: true,
    },
    orderBy: { name: 'asc' },
    take: 20,
  })

  console.log('Logo bulunamayan markalar:')
  console.log(JSON.stringify(brands, null, 2))

  await prisma.$disconnect()
}

main().catch(console.error)
