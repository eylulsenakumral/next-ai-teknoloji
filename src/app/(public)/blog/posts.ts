export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  img: string
  date: string
  readTime: string
  sections: { heading: string; body: string[] }[]
}

export const POSTS: BlogPost[] = [
  {
    slug: "ip-kamera-secimi",
    title: "IP Kamera Seçiminde 5 Kritik Nokta",
    excerpt:
      "Çözünürlük, WDR, PoE bütçesi ve AI analitik — projeye doğru kamera seçmenin pratik yolu.",
    img: "/images/cards/blog-kamera.jpg",
    date: "2026-07-10",
    readTime: "5 dk",
    sections: [
      {
        heading: "1. Çözünürlük tek başına yeterli değil",
        body: [
          "4MP ve 8MP (4K) arasındaki fark broşürde büyük görünür; sahada ise asıl belirleyici sensör boyutu ve lens kalitesidir. 1/1.8\" sensör, 1/2.8\" sensöre göre düşük ışıkta iki kat daha fazla detay verir.",
          "Kural: kimlik tanıma gereken noktada (kapı, turnike) metrekare başına yüksek piksel yoğunluğu hedefleyin — yüz için 250 piksel/metre, plaka için 300+ piksel/metre.",
        ],
      },
      {
        heading: "2. WDR ve düşük ışık performansı",
        body: [
          "Güneşi arkasına alan giriş kapıları ve cam cepheli lobiler gerçek WDR (120dB+) ister. 'Dijital WDR' ibaresi pazarlama terimidir; donanım tabanlı True WDR arayın.",
          "Gece görüşte IR mesafesi yerine minimum aydınlatma (lux) değerine bakın: renkli gece görüşü için 0.005 lux ve altı (ColorVu, Full-Color serileri) sokak aydınlatması olan alanlarda IR'sız renkli kayıt sağlar.",
        ],
      },
      {
        heading: "3. PoE bütçesi ve altyapı uyumu",
        body: [
          "PTZ ve motorize zoom kameralar 802.3at (PoE+, 30W) ister; standart dome/bullet kameralar 802.3af (15.4W) ile çalışır. Switch seçerken toplam PoE bütçesini kamera sayısıyla değil, en yüksek çekim senaryosuyla hesaplayın: tüm kameralar aynı anda IR açarsa bütçe yeter mi?",
        ],
      },
      {
        heading: "4. AI analitik gerçekten işinize yarar mı?",
        body: [
          "İnsan/araç sınıflandırması (AcuSense, WizSense) sahte alarmı %90+ azaltır — rüzgar, kedi, gölge kaynaklı alarmlar elenir. Yüz tanıma ve plaka okuma ise ayrı lisans/uyumluluk gerektirir; teklif aşamasında NVR uyumluluğunu mutlaka teyit edin.",
        ],
      },
      {
        heading: "5. Siber güvenlik ve firmware desteği",
        body: [
          "Kameranın kaç yıl güvenlik güncellemesi alacağını sorun. VLAN ayrımı, 802.1X port kimlik doğrulama ve HTTPS/digest kimlik desteği kurumsal projelerde zorunluluk olmalı.",
          "nexadepo olarak proje tekliflerinde kamera-NVR-switch uyumluluğunu tek tabloda sunuyoruz; uyumsuzluk sahada değil, masada çözülür.",
        ],
      },
    ],
  },
  {
    slug: "adresli-yangin-ihbar",
    title: "Adresli Yangın İhbar Sistemleri Rehberi",
    excerpt:
      "Adresli panellerin konvansiyonel sistemlere üstünlükleri ve proje tasarımında dikkat edilecekler.",
    img: "/images/cards/blog-yangin.jpg",
    date: "2026-07-05",
    readTime: "6 dk",
    sections: [
      {
        heading: "Konvansiyonel mi, adresli mi?",
        body: [
          "Konvansiyonel sistemde panel, alarmın geldiği bölgeyi (zonu) bilir; adresli sistemde ise alarm veren dedektörün tam adresini (ör. '3. kat, koridor sonu, D-47') görürsünüz. 20+ dedektörlü her projede adresli sistem toplam sahip olma maliyetinde daha ucuzdur: müdahale süresi kısalır, bakım kolaylaşır, kablo tasarrufu sağlanır (loop topolojisi).",
        ],
      },
      {
        heading: "Loop kapasitesi ve genişleme payı",
        body: [
          "Tek loop'a 120-240 adres bağlanabilir (üreticiye göre değişir). Proje tasarımında loop'u %80 kapasiteyle planlayın; kiracı değişimi veya revizyon durumunda yeni loop kartı almak yerine mevcut loop'a eklersiniz.",
        ],
      },
      {
        heading: "Dedektör tipi seçimi",
        body: [
          "Optik duman dedektörü: ofis, koridor, otel odası (yavaş yanan yangınlarda erken).",
          "Isı dedektörü: mutfak, otopark, buhar/toz olan alanlar (duman dedektörü sahte alarm verir).",
          "Multi-sensör (duman+ısı): veri merkezi ve arşiv gibi hem hızlı hem yavaş yangın riski taşıyan kritik hacimler.",
          "Lineer (beam) dedektör: depo ve hangar gibi yüksek tavanlı, geniş açıklıklı alanlar — tek cihazla 100m'ye kadar koruma.",
        ],
      },
      {
        heading: "Sprinkler ve senaryo entegrasyonu",
        body: [
          "Adresli panel, yangın senaryosunu modüller üzerinden yönetir: alarm bölgesindeki söndürme kontaktörü, duman tahliye fanı, asansör çağırma, kapı manyetik kilit açma ve sesli tahliye anonsu. Tasarım aşamasında senaryo tablosu itfaiye yönetmeliğine (Binaların Yangından Korunması Yönetmeliği) göre netleştirilmeli.",
        ],
      },
      {
        heading: "Bakım ve test periyodu",
        body: [
          "Yönetmelik gereği yılda en az bir kez tüm dedektörler fonksiyon testinden geçmelidir. Adresli sistemde panel üzerinden dedektör bazlı kirlenme (drift kompanzasyon) raporu alınır — hangi dedektörün temizlik istediğini sahayı gezmeden görürsünüz. nexadepo olarak panel + dedektör + modül BOM'unu senaryo tablosuyla birlikte tekliflendiriyoruz.",
        ],
      },
    ],
  },
  {
    slug: "poe-switch-kamera-altyapisi",
    title: "PoE Switch ile Sorunsuz Kamera Altyapısı",
    excerpt:
      "Port bütçesi, VLAN ayrımı ve uplink planlaması ile kesintisiz görüntü aktarımı.",
    img: "/images/cards/blog-poe.jpg",
    date: "2026-06-28",
    readTime: "5 dk",
    sections: [
      {
        heading: "PoE bütçesi nasıl hesaplanır?",
        body: [
          "16 kameralık bir sistem için: 16 × 8W (tipik dome/bullet) = 128W. IR led devreye girdiğinde +%30 pay bırakın → ~170W. Yani 250W PoE bütçeli bir switch güvenli bölgededir. PTZ varsa ayrıca 802.3at/af uyumluluğunu kontrol edin.",
        ],
      },
      {
        heading: "VLAN ile kamera trafiğini ayırın",
        body: [
          "Kamera VLAN'ı (ör. VLAN 20) ile ofis ağını ayırmak hem güvenlik hem performans sağlar: multicast/broadcast fırtınası ofis ağını etkilemez, kameralar internete doğrudan çıkamaz. Yönetilebilir (L2+) switch bu ayrımı 10 dakikada yapar; yönetilemez switch'te ise tek çözüm fiziksel ayrım.",
        ],
      },
      {
        heading: "Uplink planlaması: tıkanan nokta uplink'tir",
        body: [
          "24 kameralı sistemde kamera başına 6Mbps (4MP, H.265) ≈ 150Mbps toplam. 1G uplink yeterli görünür; ama aynı switch'te NVR + izleme istasyonu + uzaktan erişim trafiği birleşirse tepe noktalarında kayıp başlar. 24+ kamera projelerinde 10G SFP+ uplink veya iki ayrı switch düşünün.",
        ],
      },
      {
        heading: "H.265+ ve kayıt süresi dengesi",
        body: [
          "H.265+ (akıllı codec) statik sahnelerde bant genişliğini %70 düşürür. 30 günlük kayıt hedefiyle disk hesabı yaparken gerçekçi bitrate kullanın: 4MP H.265+ ≈ 2-4Mbps, 8MP ≈ 4-8Mbps. Yanlış codec seçimi hem disk hem uplink maliyetini iki katına çıkarır.",
        ],
      },
      {
        heading: "Watchdog ve uzaktan yönetim",
        body: [
          "PoE watchdog özellikli switch'ler yanıt vermeyen kamerayı otomatik resetler (port power-cycle) — sahaya servis gitmeden sorun çözülür. nexadepo'da switch + kamera + NVR teklifleri uyumluluk kontrolünden geçer; PoE bütçesi ve uplink planı teklif ekinde tablo olarak gelir.",
        ],
      },
    ],
  },
]

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug)
}
