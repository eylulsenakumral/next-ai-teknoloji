import "dotenv/config"
import { prisma } from "../src/lib/db"

async function main() {
  const [products, brands, sp, activeProducts] = await Promise.all([
    prisma.product.count(),
    prisma.brand.count(),
    prisma.supplierProduct.count(),
    prisma.product.count({ where: { isActive: true, deletedAt: null } }),
  ])
  console.log("Products (toplam):", products)
  console.log("Products (aktif):", activeProducts)
  console.log("Brands:", brands)
  console.log("SupplierProducts:", sp)

  const supplier = await prisma.supplier.findFirst({
    where: { code: "b2bdepo" },
    select: { syncStatus: true, lastSyncAt: true, syncError: true },
  })
  console.log("B2BDepo supplier:", JSON.stringify(supplier))

  const lastLog = await prisma.scraperLog.findFirst({
    orderBy: { startedAt: "desc" },
    select: { status: true, productsFound: true, productsNew: true, productsUpdated: true, errorsCount: true, errorMessage: true, startedAt: true, finishedAt: true },
  })
  console.log("Last sync log:", JSON.stringify(lastLog, null, 2))

  await prisma.$disconnect()
}
main()
