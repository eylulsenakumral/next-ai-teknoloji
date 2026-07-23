import "dotenv/config"
import { prisma } from "../src/lib/db"
import { copyFile } from "fs/promises"
import { join } from "path"

// yeni + güncellenen logolar (unv→uniview, inox→i-nox)
const MAPPING = [
  { file: "ajax.png", slug: "ajax", target: "ajax.png" },
  { file: "inform.png", slug: "inform", target: "inform.png" },
  { file: "inox.webp", slug: "i-nox", target: "inox.webp" },
  { file: "qnap.png", slug: "qnap", target: "qnap.png" },
  { file: "tescom.png", slug: "tescom", target: "tescom.png" },
  { file: "unv.png", slug: "uniview", target: "uniview.png" },
  { file: "vguard.webp", slug: "vguard", target: "vguard.webp" },
]

const SRC_DIR = join(process.cwd(), "logolar")
const DEST_DIR = join(process.cwd(), "public/images/logolar")

async function main() {
  const version = Date.now()
  let ok = 0
  for (const m of MAPPING) {
    try {
      await copyFile(join(SRC_DIR, m.file), join(DEST_DIR, m.target))
    } catch (e) {
      console.log(`✗ kopyalanamadı: ${m.file} → ${e}`)
      continue
    }
    // cache-busting ile logoUrl güncelle
    const r = await prisma.brand.updateMany({
      where: { slug: m.slug, deletedAt: null },
      data: { logoUrl: `/images/logolar/${m.target}?v=${version}` },
    })
    if (r.count > 0) {
      console.log(`✓ ${m.slug} → /images/logolar/${m.target}?v=${version}`)
      ok++
    } else {
      console.log(`✗ marka bulunamadı: ${m.slug}`)
    }
  }
  console.log(`\nToplam: ${ok}/${MAPPING.length} marka logosu bağlandı`)
  await prisma.$disconnect()
}
main()
