import "dotenv/config"
import { prisma } from "../src/lib/db"

async function main() {
  const r = await prisma.product.updateMany({
    where: { isActive: false, deletedAt: null },
    data: { isActive: true },
  })
  console.log("Aktifleştirilen ürün:", r.count)

  const c = await prisma.category.updateMany({
    where: { isActive: false, deletedAt: null },
    data: { isActive: true },
  })
  console.log("Aktifleştirilen kategori:", c.count)

  await prisma.$disconnect()
}
main()
