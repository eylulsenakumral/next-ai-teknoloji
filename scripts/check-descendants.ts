import "dotenv/config"
import { prisma } from "../src/lib/db"

async function main() {
  const cat = await prisma.category.findFirst({
    where: { slug: "bilgisayar-bilesenleri", deletedAt: null },
    select: { id: true, name: true, isActive: true },
  })
  if (!cat) { console.log("Kategori bulunamadı"); return }
  console.log("Kategori:", cat.name, "| active:", cat.isActive)

  // Tüm alt kategorileri recursive topla
  const allCats = await prisma.category.findMany({
    where: { deletedAt: null },
    select: { id: true, parentId: true, name: true, isActive: true },
  })

  const descendants = new Set<string>([cat.id])
  function find(parentId: string) {
    for (const c of allCats) {
      if (c.parentId === parentId && !descendants.has(c.id)) {
        descendants.add(c.id)
        find(c.id)
      }
    }
  }
  find(cat.id)

  console.log("Descendant sayisi:", descendants.size)
  for (const id of descendants) {
    if (id === cat.id) continue
    const c = allCats.find((x) => x.id === id)
    const pc = await prisma.product.count({ where: { categoryId: id, deletedAt: null } })
    console.log(`  ${c?.name ?? id} | active:${c?.isActive} | products:${pc}`)
  }

  // Toplam ürün (descendants dahil)
  const total = await prisma.product.count({
    where: { categoryId: { in: [...descendants] }, deletedAt: null },
  })
  console.log("Descendants dahil toplam ürün:", total)

  await prisma.$disconnect()
}
main()
