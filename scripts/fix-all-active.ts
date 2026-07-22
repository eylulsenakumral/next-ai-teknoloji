import "dotenv/config"
import { prisma } from "../src/lib/db"

async function main() {
  // Tüm ürünleri aktif yap
  const p = await prisma.product.updateMany({
    where: { isActive: false, deletedAt: null },
    data: { isActive: true },
  })
  console.log("Aktifleştirilen ürün:", p.count)

  // Tüm kategorileri aktif yap
  const c = await prisma.category.updateMany({
    where: { isActive: false, deletedAt: null },
    data: { isActive: true },
  })
  console.log("Aktifleştirilen kategori:", c.count)

  // Önbelleği temizle
  try {
    const { redis } = await import("@upstash/redis")
    const r = redis.fromEnv()
    if (r) {
      await r.del("cache:brand-list:public")
      await r.del("cache:category-tree:public")
      console.log("Redis cache temizlendi")
    }
  } catch {
    console.log("Redis yok — cache temizlenmedi (Vercel'de Upstash var)")
  }

  // Final sayım
  const [ap, ac] = await Promise.all([
    prisma.product.count({ where: { isActive: true, deletedAt: null } }),
    prisma.category.count({ where: { isActive: true, deletedAt: null } }),
  ])
  console.log(`\nFinal: ${ap} aktif ürün, ${ac} aktif kategori`)

  await prisma.$disconnect()
}
main()
