import "dotenv/config"
import { PrismaClient, type SolutionCategory } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding content tables...")

  // Solutions
  const solutions: { number: string; title: string; tagline: string; description: string; icon: string; gradient: string; brands: string[]; features: string[]; category: SolutionCategory; sortOrder: number }[] = [
    { number: "01", title: "Video Güvenlik", tagline: "CCTV / IP Kamera / NVR", description: "IP kamera, NVR, analitik yazılım ve montaj ekipmanlarıyla uçtan uca görüntü güvenlik sistemleri. AI tabanlı yüz/motorlu taşıt tanıma, plate recognition ve davranış analitiği entegrasyonu.", icon: "IcnCamera", gradient: "from-[var(--color-primary)] via-[var(--color-primary)] to-[#1a2942]", brands: ["Dahua","Hikvision","UNV","Reolink"], features: ["4K / 8MP / 12MP yüksek çözünürlük","AI analitik (yüz, plaka, davranış)","Edge & cloud depolama (NVR/CVR)","PoE — tek kablo ile güç + veri","Mobile & web izleme","Heat mapping & people counting"], category: "MAIN", sortOrder: 1 },
    { number: "02", title: "Ağ Altyapısı", tagline: "Switch / Wi-Fi / Fiber", description: "Yönetilen switch, wireless AP ve fiber omurga ile yüksek performanslı, güvenli ve ölçeklenebilir bağlantı altyapısı.", icon: "IcnNetwork", gradient: "from-[#0f766e] via-[#0d9488] to-[#14b8a6]", brands: ["Ruijie","TP-Link Omada","Ubiquiti","Cisco"], features: ["Layer 2/3 yönetilen switch","Wi-Fi 6 / 6E access point","Fiber OM3/OM4 backbone","VLAN & QoS konfigürasyonu","24/7 monitoring","DDoS koruması & firewall"], category: "MAIN", sortOrder: 2 },
    { number: "03", title: "Geçiş Kontrol", tagline: "Kart / Biometrik / Bariyer", description: "Kart okuyucu, bariyer, turnike ve biometrik sistemlerle kritik erişim noktalarının yönetimi.", icon: "IcnAccessControl", gradient: "from-[#7c3aed] via-[#8b5cf6] to-[#a78bfa]", brands: ["Hikvision","Dahua","ZKTeco","Suprema"], features: ["Biyometrik (parmak izi, yüz, iris)","OSDP v2 protokolü","IP tabanlı merkezi yönetim","Turnike, bariyer, speed gate","Ziyaretçi yönetim sistemi","Anti-passback & zaman dilimi"], category: "MAIN", sortOrder: 3 },
    { number: "04", title: "Akıllı Bina & IoT", tagline: "Alarm / Interkom / Otomasyon", description: "Alarm, interkom, otomasyon ve izleme sistemlerini tek platformdan yönetin.", icon: "IcnSmartHome", gradient: "from-[#0891b2] via-[#06b6d4] to-[#22d3ee]", brands: ["Ajax","Honeywell","Commax","KNX partnerleri"], features: ["Video interkom (IP & analog)","Alarm & yangın entegrasyonu","KNX home/building automation","Energy monitoring","Mobile app & sesli kontrol","API & third-party entegrasyon"], category: "MAIN", sortOrder: 4 },
    { number: "", title: "Plaka Tanıma (LPR/ANPR)", tagline: "", description: "Araç giriş-çıkış noktalarında otomatik plaka okuma, kara liste ve beyaz liste entegrasyonu, bariyer tetikleme.", icon: "IcnCar", gradient: "from-[#f59e0b] via-[#f97316] to-[#fb923c]", brands: [], features: [], category: "ANALYTICS", sortOrder: 1 },
    { number: "", title: "Kişi Sayma & Isı Haritası", tagline: "", description: "AVM, mağaza ve etkinlik alanlarında anlık kişi sayımı, bölgesel yoğunluk analizi ve raporlama.", icon: "IcnCameraGrid", gradient: "from-[#ef4444] via-[#f43f5e] to-[#fb7185]", brands: [], features: [], category: "ANALYTICS", sortOrder: 2 },
    { number: "", title: "Personel Devamlılığı (PDKS)", tagline: "", description: "Mobil uygulama, kart ve biyometrik tabanlı personel giriş-çıkış takip sistemi.", icon: "IcnSmartphone", gradient: "from-[#8b5cf6] via-[#a78bfa] to-[#c4b5fd]", brands: [], features: [], category: "ANALYTICS", sortOrder: 3 },
    { number: "", title: "Yüz Tanıma", tagline: "", description: "AI tabanlı yüz tanıma ile temassız geçiş kontrolü, kara liste eşleştirme ve ziyaretçi yönetimi.", icon: "IcnFaceId", gradient: "from-[#06b6d4] via-[#22d3ee] to-[#67e8f9]", brands: [], features: [], category: "ANALYTICS", sortOrder: 4 },
    { number: "", title: "Termal Kamera", tagline: "", description: "Vücut sıcaklığı tarama, endüstriyel sıcaklık izleme ve yangın önleme.", icon: "IcnCameraLarge", gradient: "from-[#dc2626] via-[#ef4444] to-[#f87171]", brands: [], features: [], category: "ANALYTICS", sortOrder: 5 },
    { number: "", title: "Davranış Analitiği", tagline: "", description: "Şüpheli hareket, terk edilmiş nesne, alan ihlali ve kalabalık tespiti.", icon: "IcnBell", gradient: "from-[#0ea5e9] via-[#38bdf8] to-[#7dd3fc]", brands: [], features: [], category: "ANALYTICS", sortOrder: 6 },
  ]

  for (const s of solutions) {
    await prisma.solution.create({ data: s })
    console.log(`  ✓ Solution: ${s.title}`)
  }

  // Sectors
  const sectors = [
    { title: "Ofis & Plaza", description: "Kat giriş kontrolü, ortak alan CCTV, toplantı odası rezervasyon entegrasyonu.", icon: "IcnBuilding", sortOrder: 1 },
    { title: "Fabrika & Üretim", description: "Çevre güvenliği, üretim hattı izleme, LPR araç takip, termal kamera.", icon: "IcnFactory", sortOrder: 2 },
    { title: "Okul & Kampüs", description: "Kampüs erişim kontrolü, sınıf ve koridor CCTV, acil durum anons sistemi.", icon: "IcnSchool", sortOrder: 3 },
    { title: "Otel & Konaklama", description: "Oda kart sistemleri, lobi ve koridor güvenliği, otopark yönetimi.", icon: "IcnHome", sortOrder: 4 },
    { title: "AVM & Perakende", description: "Mağaza içi CCTV, heat mapping, people counting, ortak alan anons.", icon: "IcnEnterprise", sortOrder: 5 },
    { title: "Hastane & Sağlık", description: "Hasta başı izleme, ilaç dolabı erişim kontrolü, hasta çağrı entegrasyonu.", icon: "IcnDoor", sortOrder: 6 },
    { title: "Depo & Lojistik", description: "Sevkiyat alanı CCTV, araç plaka tanıma, depo erişim kontrolü.", icon: "IcnCorridor", sortOrder: 7 },
    { title: "Site & Rezidans", description: "Dış çevre güvenliği, video interkom, otopark bariyer, ortak alan CCTV.", icon: "IcnOutdoor", sortOrder: 8 },
  ]

  for (const sec of sectors) {
    await prisma.sector.create({ data: sec })
    console.log(`  ✓ Sector: ${sec.title}`)
  }

  // Reference Projects
  const projects = [
    { title: "İstanbul Havalimanı — Teknik Bina", description: "1.200+ IP kamera, 48 NVR ve 80+ biometrik geçiş noktasıyla teknik bina güvenlik altyapısı.", tags: ["CCTV","Geçiş Kontrol"], icon: "IcnCamera", sortOrder: 1 },
    { title: "Ankara — Zincir Otel Grubu", description: "4 şubede video interkom, alarm ve Wi-Fi 6 altyapısı — tek platformdan merkezi yönetim.", tags: ["Akıllı Bina","Ağ Altyapısı"], icon: "IcnSmartHome", sortOrder: 2 },
    { title: "Bursa — Otomotiv Fabrikası", description: "Layer 3 switch omurga, 300+ IP kamera ve LPR sistemleriyle üretim tesisi güvenliği.", tags: ["Ağ Altyapısı","CCTV"], icon: "IcnNetwork", sortOrder: 3 },
    { title: "İzmir — Üniversite Kampüsü", description: "50+ turnike, 25+ araç bariyeri ve 400+ kamera ile kampüs geneli erişim ve güvenlik sistemi.", tags: ["Geçiş Kontrol","CCTV"], icon: "IcnAccessControl", sortOrder: 4 },
  ]

  for (const p of projects) {
    await prisma.referenceProject.create({ data: p })
    console.log(`  ✓ Project: ${p.title}`)
  }

  // FAQs
  const faqs = [
    { question: "Hangi çözüm projem için uygun?", answer: "Ücretsiz saha keşfi ve ihtiyaç analizi ile projenize en uygun çözüm kombinasyonunu belirliyoruz.", group: "COZUMLER", sortOrder: 1 },
    { question: "Farklı çözümler entegre çalışabilir mi?", answer: "Evet — tüm çözümlerimiz IP tabanlı ve açık protokol desteklidir.", group: "COZUMLER", sortOrder: 2 },
    { question: "Kurulum ve devreye alma desteği veriyor musunuz?", answer: "Evet. Sertifikalı saha ekibimiz kurulum, konfigürasyon ve devreye alma hizmeti verir.", group: "COZUMLER", sortOrder: 3 },
    { question: "Proje bazlı özel fiyat alabilir miyim?", answer: "Kesinlikle. Bayi iseniz proje hacmine göre kademeli iskonto ve özel ticari koşullar sağlıyoruz.", group: "COZUMLER", sortOrder: 4 },
    { question: "Hangi markaların yetkili tedarikçisisiniz?", answer: "Dahua, Hikvision, UNV, Ruijie, Ajax, Honeywell, ZKTeco, Suprema, Commax, Ubiquiti ve daha fazlası.", group: "COZUMLER", sortOrder: 5 },
    { question: "Bayi olmadan ürün satın alabilir miyim?", answer: "nexadepo B2B bir platformdur. Bayi başvurusu onaylanarak özel fiyatlara erişebilirsiniz.", group: "GENERAL", sortOrder: 1 },
    { question: "Proje bazlı teklif nasıl alırım?", answer: "Teklif İste formundan saha ve ihtiyaç bilgilerinizi iletin; teknik ekibimiz size özel teklif hazırlasın.", group: "GENERAL", sortOrder: 2 },
    { question: "Ürünlerde garanti var mı?", answer: "Tüm ürünlerde üretici garantisi (genelde 2 yıl) ve nexadepo ek desteği geçerlidir.", group: "GENERAL", sortOrder: 3 },
    { question: "Ödeme ve kredi limiti nasıl işliyor?", answer: "Onaylı bayilere vade ile ödeme ve kredi limiti, proje siparişlerinde özel ödeme planları sunuyoruz.", group: "GENERAL", sortOrder: 4 },
  ]

  for (const f of faqs) {
    await prisma.faq.create({ data: f })
    console.log(`  ✓ FAQ: ${f.question}`)
  }

  // Testimonials
  await prisma.testimonial.create({
    data: {
      authorName: "Mehmet K.",
      authorTitle: "Sistem Entegratörü, İstanbul",
      authorInitials: "MK",
      quote: "Proje bazlı teklif süreci çok hızlı. Teknik ekip kamera ve network mimarisini baştan tasarladı, aynı gün stoktan sevkiyat yaptılar.",
      rating: 5,
      sortOrder: 1,
    },
  })
  console.log("  ✓ Testimonial: Mehmet K.")

  // Milestones
  const milestones = [
    { year: "2014", title: "Kuruluş", description: "İstanbul merkez ofis ile CCTV ve güvenlik sistemleri toptan satışına başladık.", sortOrder: 1 },
    { year: "2017", title: "Marka anlaşmaları", description: "Dahua, Hikvision, UNV gibi global markaların Türkiye yetkili distribütörü olduk.", sortOrder: 2 },
    { year: "2020", title: "Network & IoT genişlemesi", description: "Ruijie, Ajax, Honeywell partnerlikleri ile ürün gamını genişlettik.", sortOrder: 3 },
    { year: "2023", title: "Bayi portalı", description: "Online bayi portalını devreye aldık — gerçek zamanlı stok, anlık sipariş.", sortOrder: 4 },
    { year: "2025", title: "Proje platformu", description: "Yeni nesil proje tasarım platformu ile bayilerin teknik tasarım süreçlerini dijitalleştirdik.", sortOrder: 5 },
  ]

  for (const m of milestones) {
    await prisma.milestone.create({ data: m })
    console.log(`  ✓ Milestone: ${m.year} ${m.title}`)
  }

  console.log("Done!")
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})