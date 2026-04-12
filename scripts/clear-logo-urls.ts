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
  const result = await prisma.brand.updateMany({
    where: {
      deletedAt: null,
      logoUrl: {
        not: null,
      },
    },
    data: {
      logoUrl: null,
    },
  })

  console.log(`Cleared logoUrl for ${result.count} brands`)
  await prisma.$disconnect()
}

main().catch(console.error)
