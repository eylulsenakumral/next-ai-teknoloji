import type { LucideIcon } from "lucide-react"
import {
  ShieldCheck,
  Truck,
  Headphones,
  Tag,
  ClipboardList,
  FileText,
  PackageCheck,
} from "lucide-react"
import type { HeroCard } from "./category-strip"

// DB erişilemezse/devre dışıysa kullanılan yedek şerit (7 kategori)
export const FALLBACK_CARDS: HeroCard[] = [
  { title: "Güvenlik", href: "/kategoriler/guvenlik", img: "/images/categories/guvenlik-sistemleri.jpg", slug: "guvenlik", productCount: 0 },
  { title: "Network", href: "/kategoriler/network", img: "/images/categories/ag-network.jpg", slug: "network", productCount: 0 },
  { title: "Yangın Algılama Ürünleri", href: "/kategoriler/yangin-algilama-urunleri", img: "/images/cards/yangin.jpg", slug: "yangin-algilama-urunleri", productCount: 0 },
  { title: "Hırsız Algılama Ürünleri", href: "/kategoriler/hirsiz-algilama-urunleri", img: "/images/categories/guvenlik-urunleri.jpg", slug: "hirsiz-algilama-urunleri", productCount: 0 },
  { title: "Güç Elektroniği", href: "/kategoriler/guc-elektronigi", img: "/images/categories/guc-elektronigi.jpg", slug: "guc-elektronigi", productCount: 0 },
  { title: "Seslendirme Sistemleri", href: "/kategoriler/seslendirme-sistemleri", img: "/images/categories/seslendirme.jpg", slug: "seslendirme-sistemleri", productCount: 0 },
  { title: "Kabinetler", href: "/kategoriler/kabinetler", img: "/images/categories/kabinetler.jpg", slug: "kabinetler", productCount: 0 },
]

export const PARTNERS = [
  { name: "Dahua", img: "/images/logolar/dahua.png" },
  { name: "Hikvision", img: "/images/logolar/hikvision.png" },
  { name: "UNV", img: "/images/logolar/unv.png" },
  { name: "Seagate", img: "/images/logolar/seagate.png" },
  { name: "Toshiba", img: "/images/logolar/toshiba.png" },
  { name: "Western Digital", img: "/images/logolar/wd.png" },
  { name: "TTEC", img: "/images/logolar/ttec.png" },
  { name: "Perkotek", img: "/images/logolar/perkotek.png" },
  { name: "Inox", img: "/images/logolar/inox.png" },
  { name: "RXR", img: "/images/logolar/rxr.png" },
  { name: "Uniywell", img: "/images/logolar/uniywell.png" },
]

export const STATS: [string, string][] = [
  ["12", "Yıl Deneyim"],
  ["340+", "Aktif Bayi"],
  ["1.800+", "Teknik Ürün"],
]

export const ABOUT_FEATURES = [
  { title: "Uzman Teknik Ekip", desc: "Sertifikalı güvenlik ve network mühendislerinden proje bazlı destek." },
  { title: "Yetkili Tedarik", desc: "27+ global markanın yetkili tedarikçisi — orijinal ürün, üretici garantisi." },
  { title: "Bayi Öncelikli", desc: "Özel fiyat, kredi limiti ve proje bazlı ticari koşullar." },
]

export const WHY: { Icon: LucideIcon; title: string; desc: string; bg: string }[] = [
  { Icon: ShieldCheck, title: "Özellikli Ürünler", desc: "AI kamera, Layer 3 switch, adresli panel — kurumsal kalite.", bg: "bg-[#E9FFE9]" },
  { Icon: Truck, title: "Hızlı Tedarik", desc: "Stoklu ürünlerde aynı gün kargo, proje siparişinde öncelikli lojistik.", bg: "bg-[#F5F5F5]" },
  { Icon: Headphones, title: "7/24 Teknik Destek", desc: "Uzaktan yardım, saha analizi ve sistem tasarımı danışmanlığı.", bg: "bg-[#F5F5F5]" },
  { Icon: Tag, title: "Rekabetçi Bayi Fiyatları", desc: "Hacim bazlı kademeli iskonto, proje özel indirimleri.", bg: "bg-[#E8ECFF]" },
]

export const PROCESS: { n: string; Icon: LucideIcon; title: string; desc: string }[] = [
  { n: "01", Icon: ClipboardList, title: "İhtiyaç Analizi", desc: "Sahanızı ve gereksinimlerinizi anlıyoruz, ürün ve marka önerisi hazırlıyoruz." },
  { n: "02", Icon: FileText, title: "Sistem Tasarımı & Teklif", desc: "Sistem mimarisi, BOM ve bayi fiyatlarıyla detaylı teklif sunuyoruz." },
  { n: "03", Icon: PackageCheck, title: "Tedarik & Kurulum", desc: "Lojistik koordinasyon, kurulum sonrası destek ve garanti takibi." },
]

export const FAQS = [
  { q: "Bayi olmadan ürün satın alabilir miyim?", a: "nexadepo B2B bir platformdur. Bayi başvurusu onaylanarak özel fiyat, kredi limiti ve proje bazlı tekliflere erişebilirsiniz." },
  { q: "Proje bazlı teklif nasıl alırım?", a: "Teklif İste formundan saha ve ihtiyaç bilgilerinizi iletin; teknik ekibimiz 2–4 saat içinde marka, ürün ve fiyat önerisi hazırlasın." },
  { q: "Hangi markaların yetkili tedarikçisisiniz?", a: "Dahua, Hikvision, Uniview, Ruijie, Ajax, Honeywell, Seagate ve daha fazlası — 27+ global markanın yetkili tedarikçisiyiz." },
  { q: "Kurulum desteği veriyor musunuz?", a: "Evet. Saha analizi, sistem tasarımı ve gerektiğinde kurulum koordinasyonu sağlıyoruz; 7/24 uzaktan teknik destek sunuyoruz." },
  { q: "Ürünlerde garanti var mı?", a: "Tüm ürünlerde üretici garantisi (genelde 2 yıl) ve nexadepo ek desteği geçerlidir." },
  { q: "Ödeme ve kredi limiti nasıl işliyor?", a: "Onaylı bayilere vade ile ödeme ve kredi limiti, proje siparişlerinde özel ödeme planları sunuyoruz." },
]

export const POSTS = [
  {
    title: "IP Kamera Seçiminde 5 Kritik Nokta",
    desc: "Çözünürlük, WDR, PoE bütçesi ve AI analitik — projeye doğru kamera seçmenin pratik yolu.",
    img: "/images/cards/blog-kamera.jpg",
    href: "/blog/ip-kamera-secimi",
  },
  {
    title: "Adresli Yangın İhbar Sistemleri Rehberi",
    desc: "Adresli panellerin konvansiyonel sistemlere üstünlükleri ve proje tasarımında dikkat edilecekler.",
    img: "/images/cards/blog-yangin.jpg",
    href: "/blog/adresli-yangin-ihbar",
  },
  {
    title: "PoE Switch ile Sorunsuz Kamera Altyapısı",
    desc: "Port bütçesi, VLAN ayrımı ve uplink planlaması ile kesintisiz görüntü aktarımı.",
    img: "/images/cards/blog-poe.jpg",
    href: "/blog/poe-switch-kamera-altyapisi",
  },
]
