import "dotenv/config"
import { prisma } from "../src/lib/db"

// Güvenlik'in center (4.) kart olması için sıralama
const ORDER: Record<string, number> = {
  network: 1,
  "yangin-algilama-urunleri": 2,
  "hirsiz-algilama-urunleri": 3,
  guvenlik: 4,
  "guc-elektronigi": 5,
  "seslendirme-sistemleri": 6,
  kabinetler: 7,
}

async function main() {
  for (const [slug, sortOrder] of Object.entries(ORDER)) {
    const r = await prisma.category.updateMany({ where: { slug }, data: { sortOrder } })
    console.log(`${slug}: sortOrder → ${sortOrder} (${r.count})`)
  }
  await prisma.$disconnect()
}
main()
