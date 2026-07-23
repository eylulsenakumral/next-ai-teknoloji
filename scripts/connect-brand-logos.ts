import "dotenv/config"
import { prisma } from "../src/lib/db"
import { copyFile } from "fs/promises"
import { join } from "path"

// logo dosyası → marka slug eşlemesi (ruije→ruijie ve unv→uniview düzeltildi)
const MAPPING = [
  { file: "dahua.png", slug: "dahua", target: "dahua.png" },
  { file: "hikvision.png", slug: "hikvision", target: "hikvision.png" },
  { file: "hilook.jpg", slug: "hilook", target: "hilook.jpg" },
  { file: "inox.webp", slug: "i-nox", target: "inox.webp" },
  { file: "ruije.png", slug: "ruijie", target: "ruijie.png" },
  { file: "rxr.png", slug: "rxr", target: "rxr.png" },
  { file: "seagate.png", slug: "seagate", target: "seagate.png" },
  { file: "teknim.png", slug: "tekni-m", target: "teknim.png" },
  { file: "toshiba.png", slug: "toshiba", target: "toshiba.png" },
  { file: "ttec.png", slug: "ttec", target: "ttec.png" },
  { file: "unv.jpg", slug: "uniview", target: "uniview.jpg" },
  { file: "wd.png", slug: "wd", target: "wd.png" },
  { file: "westa.png", slug: "westa", target: "westa.png" },
]

const SRC_DIR = join(process.cwd(), "logolar")
const DEST_DIR = join(process.cwd(), "public/images/logolar")

async function main() {
  let ok = 0
  for (const m of MAPPING) {
    // 1. Dosyayı public'e kopyala
    try {
      await copyFile(join(SRC_DIR, m.file), join(DEST_DIR, m.target))
    } catch (e) {
      console.log(`✗ kopyalanamadı: ${m.file} → ${e}`)
      continue
    }

    // 2. DB'de logoUrl güncelle
    const r = await prisma.brand.updateMany({
      where: { slug: m.slug, deletedAt: null },
      data: { logoUrl: `/images/logolar/${m.target}` },
    })
    if (r.count > 0) {
      console.log(`✓ ${m.slug} → /images/logolar/${m.target}`)
      ok++
    } else {
      console.log(`✗ marka bulunamadı: ${m.slug}`)
    }
  }
  console.log(`\nToplam: ${ok}/${MAPPING.length} marka logosu bağlandı`)
  await prisma.$disconnect()
}
main()
