import "dotenv/config"
import { prisma } from "../src/lib/db"
import { copyFile } from "fs/promises"
import { join } from "path"

async function main() {
  const version = Date.now()

  // 1. Dosyayı public'e kopyala
  await copyFile(
    join(process.cwd(), "logolar/wd.png"),
    join(process.cwd(), "public/images/logolar/wd.png")
  )
  console.log("wd.png kopyalandı")

  // 2. DB'de logoUrl güncelle (cache-busting versiyon ile)
  const r = await prisma.brand.updateMany({
    where: { slug: "wd", deletedAt: null },
    data: { logoUrl: `/images/logolar/wd.png?v=${version}` },
  })
  console.log(`WD logoUrl güncellendi: /images/logolar/wd.png?v=${version} (${r.count} marka)`)

  await prisma.$disconnect()
}
main()
