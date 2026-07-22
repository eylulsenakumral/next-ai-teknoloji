import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const all = await prisma.pageSection.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "asc" } })
  const seen = new Set()
  const toDelete: string[] = []
  for (const s of all) {
    const key = `${s.page}|${s.section}|${s.title}`
    if (seen.has(key)) {
      toDelete.push(s.id)
    } else {
      seen.add(key)
    }
  }
  console.log(`Deleting ${toDelete.length} duplicates...`)
  if (toDelete.length > 0) {
    await prisma.pageSection.deleteMany({ where: { id: { in: toDelete } } })
  }
  const count = await prisma.pageSection.count({ where: { deletedAt: null } })
  console.log(`Remaining: ${count}`)
  await prisma.$disconnect()
}

main()
