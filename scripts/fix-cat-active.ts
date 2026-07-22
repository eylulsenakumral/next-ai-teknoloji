import "dotenv/config"
import { prisma } from "../src/lib/db"

async function main() {
  const r = await prisma.category.updateMany({
    where: { isActive: false, deletedAt: null },
    data: { isActive: true },
  })
  console.log("Aktifleştirilen kategori:", r.count)

  const roots = await prisma.category.count({ where: { parentId: null, isActive: true, deletedAt: null } })
  console.log("Aktif root kategori:", roots)

  await prisma.$disconnect()
}
main()
