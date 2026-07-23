import "dotenv/config"
import { prisma } from "../src/lib/db"

async function main() {
  const cat = await prisma.category.findFirst({
    where: { slug: "bilgisayar-bilesenleri", deletedAt: null },
    select: { id: true },
  })
  if (!cat) { console.log("yok"); return }

  const allCats = await prisma.category.findMany({
    where: { deletedAt: null },
    select: { id: true, parentId: true },
  })
  const ids = new Set<string>([cat.id])
  function find(pid: string) {
    for (const c of allCats) {
      if (c.parentId === pid && !ids.has(c.id)) { ids.add(c.id); find(c.id) }
    }
  }
  find(cat.id)

  const idArr = [...ids]
  const [total, active, activeInStock] = await Promise.all([
    prisma.product.count({ where: { categoryId: { in: idArr }, deletedAt: null } }),
    prisma.product.count({ where: { categoryId: { in: idArr }, deletedAt: null, isActive: true } }),
    prisma.product.count({
      where: {
        categoryId: { in: idArr }, deletedAt: null, isActive: true,
        supplierProducts: { some: { deletedAt: null, isAvailable: true, stockQuantity: { gt: 0 } } },
      },
    }),
  ])
  console.log("descendant IDs:", idArr.length)
  console.log("toplam ürün:", total)
  console.log("aktif ürün:", active)
  console.log("aktif + stoklu:", activeInStock)

  // getCategoryDescendants'in Vercel'de döndürdüğü şeyi simüle et
  console.log("\n=== getCategoryDescendants simülasyonu ===")
  console.log("cat bulundu mu:", !!cat)
  console.log("allCats count:", allCats.length)
  console.log("descendant count:", idArr.length)
  console.log("IDs:", idArr.slice(0, 5).join(","), "...")

  await prisma.$disconnect()
}
main()
