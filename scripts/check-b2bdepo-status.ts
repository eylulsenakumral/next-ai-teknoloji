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
  const supplier = await prisma.supplier.findUnique({ where: { code: "b2bdepo" } })
  console.log("Supplier:", {
    code: supplier?.code,
    active: supplier?.isActive,
    status: supplier?.syncStatus,
    lastSync: supplier?.lastSyncAt?.toISOString(),
    error: supplier?.syncError,
  })

  const logs = await prisma.scraperLog.findMany({
    orderBy: { startedAt: "desc" },
    take: 5,
    where: { supplierId: supplier?.id },
  })
  console.log("\nSon 5 ScraperLog:")
  for (const l of logs) {
    console.log(
      `  ${l.startedAt.toISOString()} | ${l.status} | new=${l.productsNew} upd=${l.productsUpdated} err=${l.errorsCount} | ${l.errorMessage?.slice(0, 120) ?? ""} | ${l.durationMs}ms`
    )
  }

  const count = await prisma.supplierProduct.count({
    where: { supplier: { code: "b2bdepo" } },
  })
  console.log("\nToplam SupplierProduct:", count)
  const lastScraped = await prisma.supplierProduct.findFirst({
    where: { supplier: { code: "b2bdepo" } },
    orderBy: { lastScrapedAt: "desc" },
    select: { lastScrapedAt: true, externalName: true },
  })
  console.log("Son scrape edilen ürün:", lastScraped?.externalName, "|", lastScraped?.lastScrapedAt?.toISOString())
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
