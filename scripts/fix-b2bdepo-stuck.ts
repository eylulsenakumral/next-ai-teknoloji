import { config } from "dotenv"
config()
import { PrismaClient, SupplierSyncStatus } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const cs = process.env.DATABASE_URL!
const pool = new Pool({
  connectionString: cs,
  ssl: cs.includes("neon.tech") ? { rejectUnauthorized: false } : false,
})
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  // 1. supplier.syncStatus RUNNING → SUCCESS (takılı durum)
  const supplier = await prisma.supplier.findUnique({ where: { code: "b2bdepo" } })
  console.log("Önce:", { status: supplier?.syncStatus, lastSync: supplier?.lastSyncAt })

  const updated = await prisma.supplier.update({
    where: { code: "b2bdepo" },
    data: {
      syncStatus: SupplierSyncStatus.SUCCESS,
      syncError: null,
    },
  })
  console.log("Sonra:", { status: updated.syncStatus })

  // 2. Orphan RUNNING ScraperLog kayıtlarını ERROR olarak kapat
  const orphanLogs = await prisma.scraperLog.updateMany({
    where: {
      supplierId: supplier?.id,
      status: SupplierSyncStatus.RUNNING,
    },
    data: {
      status: SupplierSyncStatus.ERROR,
      finishedAt: new Date(),
      errorMessage: "Orphan RUNNING log — process crash sırasında kapatılmadı, manuel reset",
    },
  })
  console.log(`\n${orphanLogs.count} orphan RUNNING log ERROR olarak kapatıldı`)

  // 3. Doğrula
  const recheck = await prisma.supplier.findUnique({ where: { code: "b2bdepo" } })
  console.log("\nDoğrulama:", {
    status: recheck?.syncStatus,
    error: recheck?.syncError,
    lastSync: recheck?.lastSyncAt,
  })
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
