import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding page sections & hero slides & site texts...")

  // ── HOMEPAGE: WHY cards ──
  const whyItems = [
    { title: "Özellikli Ürünler", description: "AI kamera, Layer 3 switch, adresli panel — kurumsal kalite.", iconName: "ShieldCheck", bgClass: "bg-[#E9FFE9]" },
    { title: "Hızlı Tedarik", description: "Stoklu ürünlerde aynı gün kargo, proje siparişinde öncelikli lojistik.", iconName: "Truck", bgClass: "bg-[#F5F5F5]" },
    { title: "7/24 Teknik Destek", description: "Uzaktan yardım, saha analizi ve sistem tasarımı danışmanlığı.", iconName: "Headphones", bgClass: "bg-[#F5F5F5]" },
    { title: "Rekabetçi Bayi Fiyatları", description: "Hacim bazlı kademeli iskonto, proje özel indirimleri.", iconName: "Tag", bgClass: "bg-[#E8ECFF]" },
  ]
  for (const w of whyItems) {
    await prisma.pageSection.create({ data: { page: "HOMEPAGE", section: "WHY", ...w, sortOrder: whyItems.indexOf(w) + 1 } })
  }
  console.log("  ✓ WHY items (4)")

  // ── HOMEPAGE: PROCESS steps ──
  const processSteps = [
    { title: "İhtiyaç Analizi", description: "Sahanızı ve gereksinimlerinizi anlıyoruz, ürün ve marka önerisi hazırlıyoruz.", iconName: "ClipboardList", label: "01" },
    { title: "Sistem Tasarımı & Teklif", description: "Sistem mimarisi, BOM ve bayi fiyatlarıyla detaylı teklif sunuyoruz.", iconName: "FileText", label: "02" },
    { title: "Tedarik & Kurulum", description: "Lojistik koordinasyon, kurulum sonrası destek ve garanti takibi.", iconName: "PackageCheck", label: "03" },
  ]
  for (const p of processSteps) {
    await prisma.pageSection.create({ data: { page: "HOMEPAGE", section: "PROCESS", ...p, sortOrder: processSteps.indexOf(p) + 1 } })
  }
  console.log("  ✓ PROCESS steps (3)")

  // ── HOMEPAGE: ABOUT FEATURES ──
  const aboutFeatures = [
    { title: "Uzman Teknik Ekip", description: "Sertifikalı güvenlik ve network mühendislerinden proje bazlı destek." },
    { title: "Yetkili Tedarik", description: "Global markaların yetkili tedarikçisi — orijinal ürün, üretici garantisi." },
    { title: "Bayi Öncelikli", description: "Özel fiyat, kredi limiti ve proje bazlı ticari koşullar." },
  ]
  for (const a of aboutFeatures) {
    await prisma.pageSection.create({ data: { page: "HOMEPAGE", section: "ABOUT_FEATURES", ...a, sortOrder: aboutFeatures.indexOf(a) + 1 } })
  }
  console.log("  ✓ ABOUT FEATURES (3)")

  // ── HOMEPAGE: Hero slides ──
  const slides = [
    { label: "Güvenlik", title: "Güvenlik Sistemleri Ürünlerinde Çözüm Ortağınız", accent: "Güvenlik", ctaText: "Teklif İste", ctaHref: "/teklif-iste" },
    { label: "Yangın Alarm", title: "Yangın Algılama Sistemlerinde Güvenilir İş Ortağınız", accent: "Yangın", ctaText: "Teklif İste", ctaHref: "/teklif-iste" },
    { label: "Hırsız Alarm", title: "Hırsız Alarm Sistemlerinde Profesyonel Çözümler", accent: "Alarm", ctaText: "Teklif İste", ctaHref: "/teklif-iste" },
    { label: "Araç Kameraları", title: "Araç Kameralarında Güvenliğiniz İçin Buradayız", accent: "Araç", ctaText: "Teklif İste", ctaHref: "/teklif-iste" },
  ]
  for (const s of slides) {
    await prisma.heroSlide.create({ data: { ...s, sortOrder: slides.indexOf(s) + 1 } })
  }
  console.log("  ✓ Hero slides (4)")

  // ── COZUMLER: Value props ──
  const valueProps = [
    { title: "Saha analizi", description: "Ücretsiz keşif ve ihtiyaç analizi", iconName: "IcnTarget" },
    { title: "Sistem tasarımı", description: "Marka & mimari önerisi", iconName: "IcnBriefcase" },
    { title: "Tedarik", description: "Stoklu ürünlerde aynı gün", iconName: "IcnBox" },
    { title: "Teknik destek", description: "7/24 uzaktan yardım", iconName: "IcnTool" },
  ]
  for (const v of valueProps) {
    await prisma.pageSection.create({ data: { page: "COZUMLER", section: "VALUE_PROPS", ...v, sortOrder: valueProps.indexOf(v) + 1 } })
  }
  console.log("  ✓ COZUMLER value props (4)")

  // ── HAKKIMDA: Values ──
  const values = [
    { title: "Doğru çözüm", description: "Standardı satmak yerine projeye uygun çözümü öneririz. Sahayı analiz eder, ihtiyaca göre sistem tasarlar, maliyet-fayda dengesi kurarız.", iconName: "IcnTarget" },
    { title: "Uzun vadeli ortaklık", description: "Tek seferlik satış değil, sürekli iş ortaklığı hedefleriz. Bayilerimizin başarısı bizim başarımız.", iconName: "IcnBriefcase" },
    { title: "Teknik uzmanlık", description: "Saha mühendisleri ve sistem mimarlarımız, kurulum aşamasında ve sonrasında teknik destek verir.", iconName: "IcnTool" },
    { title: "Hızlı tedarik", description: "İstanbul, Mersin ve Bursa depolarımızdan aynı gün kargo.", iconName: "IcnBox" },
  ]
  for (const v of values) {
    await prisma.pageSection.create({ data: { page: "HAKKIMDA", section: "VALUES", ...v, sortOrder: values.indexOf(v) + 1 } })
  }
  console.log("  ✓ HAKKIMDA values (4)")

  // ── BAYI_PROGRAMI: Benefits ──
  const benefits = [
    { title: "Bayi Fiyatlandırması", description: "Ürün bazında özel bayi fiyatları, hacme göre kademeli iskonto.", iconName: "Tag" },
    { title: "Kredi Limiti & Vade", description: "Onaylı bayilere 30-60 gün vade ve kredi limiti.", iconName: "CreditCard" },
    { title: "Stok Görünürlüğü", description: "Gerçek zamanlı stok durumu, rezervasyon ve tahmini sevkiyat.", iconName: "PackageCheck" },
    { title: "Teknik Destek", description: "Sistem tasarımı, ürün seçimi ve kurulum danışmanlığı.", iconName: "Headphones" },
    { title: "Proje Danışmanlığı", description: "Saha analizi, BOM hazırlama ve teklif destek.", iconName: "ClipboardList" },
    { title: "Pazarlama Desteği", description: "Ürün katalogları, teknik dokümanlar ve dijital materyal.", iconName: "Megaphone" },
  ]
  for (const b of benefits) {
    await prisma.pageSection.create({ data: { page: "BAYI_PROGRAMI", section: "BENEFITS", ...b, sortOrder: benefits.indexOf(b) + 1 } })
  }
  console.log("  ✓ BAYI benefits (6)")

  // ── BAYI_PROGRAMI: Tiers ──
  const tiers = [
    { title: "Başlangıç", description: "Yeni bayiler için", badge: "5-10%", metadata: { discountRange: "5-10%", creditLimit: "25.000 TL" } },
    { title: "Profesyonel", description: "Aktif bayiler için", badge: "12-18%", metadata: { discountRange: "12-18%", creditLimit: "100.000 TL" } },
    { title: "Kurumsal", description: "Yüksek hacimli bayiler için", badge: "20%+", metadata: { discountRange: "20%+", creditLimit: "Proje bazlı" } },
  ]
  for (const t of tiers) {
    await prisma.pageSection.create({ data: { page: "BAYI_PROGRAMI", section: "TIERS", ...t, sortOrder: tiers.indexOf(t) + 1 } })
  }
  console.log("  ✓ BAYI tiers (3)")

  // ── KURUMSAL: Benefits ──
  const corpBenefits = [
    { title: "Özel Fiyatlandırma", description: "Kurumsal hacme özel indirimli fiyat listesi." },
    { title: "Öncelikli Teslimat", description: "Öncelikli sevkiyat ve lojistik koordinasyonu." },
    { title: "Özel Hesap Yöneticisi", description: "Tek kontak noktası, hızlı çözüm." },
    { title: "Stok Garantisi", description: "Kritik ürünlerde stok rezervasyonu." },
    { title: "Vadeli Ödeme", description: "30-60-90 gün vade seçenekleri." },
    { title: "Toplu Sipariş", description: "Yüksek hacimli siparişlerde ek iskonto." },
  ]
  for (const b of corpBenefits) {
    await prisma.pageSection.create({ data: { page: "KURUMSAL", section: "BENEFITS", ...b, sortOrder: corpBenefits.indexOf(b) + 1 } })
  }
  console.log("  ✓ KURUMSAL benefits (6)")

  // ── Site Texts: Section titles ──
  const texts = [
    { page: "HOMEPAGE", section: "WHY", key: "label", value: "Neden nexadepo?" },
    { page: "HOMEPAGE", section: "WHY", key: "title", value: "Tedarikçiden fazlası — güçlü bir iş ortağı" },
    { page: "HOMEPAGE", section: "WHY", key: "subtitle", value: "Hassasiyet, özen ve projenize özel modern tedarik çözümleriyle kusursuz sonuçlar." },
    { page: "HOMEPAGE", section: "ABOUT", key: "label", value: "Hakkımızda" },
    { page: "HOMEPAGE", section: "ABOUT", key: "title", value: "Güvenlikle, özenle, uzmanla" },
    { page: "HOMEPAGE", section: "PROCESS", key: "label", value: "Süreç" },
    { page: "HOMEPAGE", section: "PROCESS", key: "title", value: "Güvenli alana giden basit adımlar" },
    { page: "HAKKIMDA", section: "MISSION", key: "title", value: "Teknoloji tedarikçiden iş ortağına dönüşmek." },
    { page: "HAKKIMDA", section: "VISION", key: "title", value: "Türkiye'nin 1 numaralı B2B teknoloji platformu." },
    { page: "COZUMLER", section: "HERO", key: "title", value: "Projenizin tüm teknoloji katmanları için tek nokta çözümü." },
  ]
  for (const t of texts) {
    await prisma.siteText.upsert({
      where: { page_section_key: { page: t.page, section: t.section, key: t.key } },
      update: { value: t.value },
      create: { ...t, sortOrder: 1 },
    })
  }
  console.log(`  ✓ Site texts (${texts.length})`)

  console.log("Done!")
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
