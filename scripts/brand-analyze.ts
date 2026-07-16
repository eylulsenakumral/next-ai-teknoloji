import { prisma } from "../src/lib/db"

async function main() {
  const where = { deletedAt: null, isActive: true }
  const total = await prisma.brand.count({ where })
  const nullDesc = await prisma.brand.count({ where: { ...where, description: null } })
  console.log(JSON.stringify({ total, nullDesc, hasDesc: total - nullDesc }, null, 2))

  console.log("\n--- Hikvision ailesi (typo/çeşitlilik kontrolü) ---")
  const hik = await prisma.brand.findMany({
    where: { deletedAt: null, OR: [
      { name: { contains: "ikvision", mode: "insensitive" } },
      { name: { contains: "iksivion", mode: "insensitive" } },
      { name: { contains: "hik", mode: "insensitive" } },
    ] },
    select: { name: true, slug: true, description: true, sortOrder: true },
    orderBy: { name: "asc" },
  })
  for (const b of hik) console.log(`  ${b.name.padEnd(18)} slug=${b.slug}  desc=${b.description ? "VAR" : "NULL"}`)

  console.log("\n--- placeholder/kategori gibi görünen markalar ---")
  const odd = await prisma.brand.findMany({
    where: { deletedAt: null, OR: [
      { name: { contains: "marka yok", mode: "insensitive" } },
      { name: { contains: "para", mode: "insensitive" } },
      { name: { contains: "oem", mode: "insensitive" } },
      { name: { contains: "video interkom", mode: "insensitive" } },
    ] },
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  })
  for (const b of odd) console.log(`  ${b.name}  (slug=${b.slug})`)

  console.log("\n--- en yüksek sortOrder (öne çıkanlar) ---")
  const top = await prisma.brand.findMany({ where, orderBy: { sortOrder: "desc" }, take: 12, select: { name: true, description: true, sortOrder: true } })
  for (const b of top) console.log(`  [${b.sortOrder}] ${b.name.padEnd(16)} desc=${b.description ? "VAR" : "NULL"}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
