import "dotenv/config"
import { prisma } from "../src/lib/db"

async function main() {
  const [products, brands, categories, suppliers, sp] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.brand.count({ where: { deletedAt: null } }),
    prisma.category.count({ where: { deletedAt: null } }),
    prisma.supplier.count(),
    prisma.supplierProduct.count({ where: { deletedAt: null } }),
  ])
  console.log("=== MEVCUT DB DURUMU ===")
  console.log("Products:", products)
  console.log("Brands:", brands)
  console.log("Categories:", categories)
  console.log("Suppliers:", suppliers)
  console.log("SupplierProducts:", sp)

  const supplier = await prisma.supplier.findFirst({
    where: { code: "B2BDEPO" },
    select: { id: true, code: true, name: true, syncStatus: true, lastSyncAt: true },
  })
  console.log("\nB2BDepo supplier:", JSON.stringify(supplier, null, 2))

  await prisma.$disconnect()
}
main()
