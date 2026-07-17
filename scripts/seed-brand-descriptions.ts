/**
 * Öne çıkan global markalar için gerçek description seed.
 * DB'deki 279 markanın description alanı NULL — markalar sayfası render-time
 * "${name} ürünleri..." gösteriyor (kod fix). Bu script bilinen global markalara
 * SEO-friendly gerçek açıklama yazar.
 *
 * KULLANIM:
 *   npx tsx scripts/seed-brand-descriptions.ts          # DRY-RUN (değişiklik yok, preview)
 *   npx tsx scripts/seed-brand-descriptions.ts --apply  # GERÇEK YAZAR (Neon production DB)
 *
 * DATABASE_URL .env'den okunmalı: export DATABASE_URL="$(grep ^DATABASE_URL= .env | cut -d= -f2-)"
 */
import { prisma } from "../src/lib/db"

const DESCRIPTIONS: Record<string, string> = {
  Dahua:
    "AI destekli IP kameralar, NVR kayıt cihazları ve akıllı video analitik çözümleri üreten küresel güvenlik teknolojisi lideri.",
  Hikvision:
    "Kurumsal gözetleme ve güvenlik sistemlerinde dünya lideri. IP kamera, NVR, turnike ve geçiş kontrol çözümleri.",
  UNV:
    "Uniview — 4K IP kamera sistemleri, NVR ve video yönetim yazılımları. Kurumsal gözetleme altyapısı.",
  Reolink:
    "PoE ve kablosuz IP kamera çözümleri. Kolay kurulumlu ev ve işyeri güvenlik sistemleri.",
  Ruijie:
    "Yönetilen network switch, wireless access point ve fiber altyapı çözümleri. Kurumsal ağ donanımları.",
  Ajax:
    "Kablosuz alarm, akıllı ev otomasyonu ve güvenlik sistemleri. Hub ve sensör tabanlı modern koruma.",
  Honeywell:
    "Ticari ve endüstriyel yangın algılama, alarm ve güvenlik sistemleri. Kritik altyapı koruması.",
  Seagate:
    "SkyHawk surveillance HDD ve NAS depolama çözümleri. 7/24 video kayıt için optimize edilmiş diskler.",
  "Western Digital":
    "WD Purple surveillance HDD ve veri depolama çözümleri. Güvenlik kayıt sistemleri için tasarlanmış.",
  Toshiba:
    "Surveillance ve kurumsal HDD/SSD çözümleri. Güvenilir veri depolama donanımları.",
  Ubiquiti:
    "UniFi network ve gözetleme ekosistemi. Switch, AP ve kamera yönetim platformu.",
  "TP-Link":
    "Omada işletme ağı, switch, access point ve güvenlik kamera çözümleri. SMB ve kurumsal ağ.",
  Synology:
    "NAS depolama, Surveillance Station video yönetimi ve ağ çözümleri. Kurumsal veri altyapısı.",
  QNAP:
    "NAS ve NVR çözümleri. Depolama, sanallaştırma ve video gözetleme platformları.",
}

async function main() {
  const apply = process.argv.includes("--apply")
  console.log(apply ? ">>> APPLY MODU — DB'YE YAZILIYOR" : ">>> DRY-RUN (--apply ile gerçek yazar)\n")

  let updated = 0
  let skipped = 0
  for (const [name, desc] of Object.entries(DESCRIPTIONS)) {
    const brand = await prisma.brand.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, deletedAt: null },
      select: { id: true, name: true, slug: true, description: true },
    })
    if (!brand) {
      console.log(`SKIP  ${name} — DB'de bulunamadı`)
      skipped++
      continue
    }
    if (apply) {
      await prisma.brand.update({ where: { id: brand.id }, data: { description: desc } })
      console.log(`UPD   ${brand.name} (slug=${brand.slug})`)
    } else {
      console.log(`DRY   ${brand.name.padEnd(18)} -> ${desc.slice(0, 70)}...`)
    }
    updated++
  }
  console.log(`\nÖzet: ${updated} marka ${apply ? "güncellendi" : "preview"}, ${skipped} atlandı.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(() => prisma.$disconnect())
