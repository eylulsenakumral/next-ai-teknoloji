import "dotenv/config"
import { prisma } from "../src/lib/db"

const IMAGE_MAP: Record<string, string> = {
  guvenlik: "/images/categories/guvenlik-sistemleri.jpg",
  network: "/images/categories/ag-network.jpg",
  "yangin-algilama-urunleri": "/images/cards/yangin.jpg",
  "hirsiz-algilama-urunleri": "/images/categories/guvenlik-urunleri.jpg",
  "guc-elektronigi": "/images/categories/guc-elektronigi.jpg",
  "seslendirme-sistemleri": "/images/categories/seslendirme.jpg",
  kabinetler: "/images/categories/kabinetler.jpg",
}

async function main() {
  for (const [slug, imageUrl] of Object.entries(IMAGE_MAP)) {
    const updated = await prisma.category.updateMany({
      where: { slug },
      data: { imageUrl },
    })
    console.log(`${slug}: ${updated.count} güncellendi → ${imageUrl}`)
  }
  await prisma.$disconnect()
}
main()
