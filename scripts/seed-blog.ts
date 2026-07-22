import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding blog posts...")

  const posts = [
    {
      title: "IP Kamera Seçiminde 5 Kritik Nokta",
      slug: "ip-kamera-secimi",
      excerpt: "Çözünürlük, WDR, PoE bütçesi ve AI analitik — projeye doğru kamera seçmenin pratik yolu.",
      content: "## IP Kamera Seçiminde 5 Kritik Nokta\n\nDoğru IP kamera seçimi, projenin başarısı için kritik öneme sahiptir. İşte dikkat edilmesi gereken 5 nokta:\n\n### 1. Çözünürlük\n4K (8MP) çözünürlük günümüzde standart hale gelmiştir. Ancak her proje 4K gerektirmez — izleme mesafesi ve detay ihtiyacına göre 2MP veya 4MP de yeterli olabilir.\n\n### 2. WDR (Wide Dynamic Range)\nAydınlık ve karanlık alanların aynı karede bulunduğu sahnelerde WDR kritik önem taşır. 120dB WPR ideal bir başlangıçtır.\n\n### 3. PoE Bütçesi\nPower over Ethernet, kamera altyapısını basitleştirir. Ancak switch'in PoE bütçesi tüm kameraları beslemeye yetmeli.\n\n### 4. AI Analitik\nYüz tanıma, plaka tanıma ve davranış analitiği artık birçok kamerada yerleşik olarak geliyor.\n\n### 5. Gece Görüş\nIR menzili ve düşük ışık performansı (0.001 lux altı) gece izleme kalitesini belirler.",
      imageUrl: "/images/cards/blog-kamera.jpg",
      readTime: "5 dk",
      sortOrder: 1,
    },
    {
      title: "Adresli Yangın İhbar Sistemleri Rehberi",
      slug: "adresli-yangin-ihbar",
      excerpt: "Adresli panellerin konvansiyonel sistemlere üstünlükleri ve proje tasarımında dikkat edilecekler.",
      content: "## Adresli Yangın İhbar Sistemleri Rehberi\n\nAdresli yangın ihbar sistemleri, konvansiyonel sistemlere göre birçok avantaj sunar.\n\n### Adresli vs Konvansiyonel\nAdresli sistemler her dedektörün tam konumunu panelde gösterir. Bu, acil durumlarda hızlı müdahale için kritiktir.\n\n### Proje Tasarımı\nSistemin tasarımında dikkat edilmesi gerekenler: döngü uzunluğu, cihaz sayısı, yedek güç kaynağı.\n\n### Sertifikasyon\nTürkiye'de yangın sistemleri TS EN 54 standardına uygun olmalıdır.",
      imageUrl: "/images/cards/blog-yangin.jpg",
      readTime: "4 dk",
      sortOrder: 2,
    },
    {
      title: "PoE Switch ile Sorunsuz Kamera Altyapısı",
      slug: "poe-switch-kamera-altyapisi",
      excerpt: "Port bütçesi, VLAN ayrımı ve uplink planlaması ile kesintisiz görüntü aktarımı.",
      content: "## PoE Switch ile Sorunsuz Kamera Altyapısı\n\nPower over Ethernet (PoE), IP kamera altyapısını basitleştirir.\n\n### Port Bütçesi\nHer kamera belirli bir PoE gücü (Watt) tüketir. Switch'in toplam PoE bütçesi tüm kameraların toplamından fazla olmalı.\n\n### VLAN Ayrımı\nGüvenlik kameraları için ayrı VLAN kullanmak, ağ trafiğini izole eder ve performansı artırır.\n\n### Uplink Planlaması\nYüksek kamera sayısında fiber uplink veya 10G uplink gerekebilir.",
      imageUrl: "/images/cards/blog-poe.jpg",
      readTime: "3 dk",
      sortOrder: 3,
    },
  ]

  for (const p of posts) {
    await prisma.blogPost.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    })
    console.log(`  ✓ Blog: ${p.title}`)
  }

  console.log("Done!")
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
