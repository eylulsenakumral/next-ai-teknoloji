import "dotenv/config"
import { prisma } from "../src/lib/db"

async function main() {
  const roots = await prisma.category.findMany({
    where: { parentId: null, deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, isActive: true, _count: { select: { products: true, children: true } } },
  })
  console.log("=== ROOT KATEGORİLER ===", roots.length)
  for (const r of roots) {
    console.log(`  ${r.name} | slug:${r.slug} | active:${r.isActive} | products:${r._count.products} | children:${r._count.children}`)
  }
  await prisma.$disconnect()
}
main()
