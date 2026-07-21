import Link from "next/link"
import type { Metadata } from "next"
import { prisma } from "@/lib/db"
import { HeroCarousel } from "./hero-carousel"
import { CategoryStrip, type HeroCard } from "./category-strip"
import { Reveal } from "./reveal"
import {
  ShieldCheck,
  Truck,
  Headphones,
  Tag,
  ArrowRight,
  Check,
  ClipboardList,
  FileText,
  PackageCheck,
  Star,
  Plus,
  Quote,
} from "lucide-react"

export const metadata: Metadata = {
  title: "nexadepo — Güvenlik & Network Sistemleri",
  description:
    "B2B güvenlik ve network tedarik platformu. Güvenlik kamerası, ağ altyapısı, alarm sistemleri, switch ve yazılım. Proje bazlı teklif, bayi avantajları.",
  alternates: { canonical: "/" },
}

// Kategori şeridi DB'den beslenir — saatte bir yenilenir (ISR)
export const revalidate = 3600

// DB erişilemezse/devre dışıysa kullanılan yedek şerit
const FALLBACK_CARDS = [
  { title: "Güvenlik Kamerası", href: "/kategoriler/guvenlik-kamerasi", img: "/images/cards/guvenlik.jpg" },
  { title: "Yangın İhbar", href: "/kategoriler/yangin-ihbar", img: "/images/cards/yangin.jpg" },
  { title: "Yapay Zeka", href: "/kategoriler/yapay-zeka", img: "/images/cards/yapay-zeka.jpg" },
  { title: "Ağ ve Network", href: "/kategoriler/ag-ve-network", img: "/images/cards/network.jpg" },
  { title: "Plaka Okuma", href: "/kategoriler/plaka-okuma", img: "/images/cards/plaka.jpg" },
]

/** Hero kategori şeridi — tüm aktif ana kategoriler (şerit 5'li sayfalar halinde gösterir) */
async function getHeroCategories(): Promise<HeroCard[]> {
  try {
    const cats = await prisma.category.findMany({
      where: { isActive: true, deletedAt: null, parentId: null },
      orderBy: { sortOrder: "asc" },
      select: { name: true, slug: true, imageUrl: true },
    })
    if (cats.length === 0) return FALLBACK_CARDS
    return cats.map((c) => ({
      title: c.name.trim(),
      href: `/kategoriler/${c.slug}`,
      img: c.imageUrl ?? "/images/cards/guvenlik.jpg",
    }))
  } catch {
    return FALLBACK_CARDS
  }
}

const PARTNERS = [
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

const STATS = [
  ["12", "Yıl Deneyim"],
  ["340+", "Aktif Bayi"],
  ["1.800+", "Teknik Ürün"],
]

const ABOUT_FEATURES = [
  { title: "Uzman Teknik Ekip", desc: "Sertifikalı güvenlik ve network mühendislerinden proje bazlı destek." },
  { title: "Yetkili Tedarik", desc: "27+ global markanın yetkili tedarikçisi — orijinal ürün, üretici garantisi." },
  { title: "Bayi Öncelikli", desc: "Özel fiyat, kredi limiti ve proje bazlı ticari koşullar." },
]

const WHY = [
  { Icon: ShieldCheck, title: "Özellikli Ürünler", desc: "AI kamera, Layer 3 switch, adresli panel — kurumsal kalite.", bg: "bg-[#E9FFE9]" },
  { Icon: Truck, title: "Hızlı Tedarik", desc: "Stoklu ürünlerde aynı gün kargo, proje siparişinde öncelikli lojistik.", bg: "bg-[#F5F5F5]" },
  { Icon: Headphones, title: "7/24 Teknik Destek", desc: "Uzaktan yardım, saha analizi ve sistem tasarımı danışmanlığı.", bg: "bg-[#F5F5F5]" },
  { Icon: Tag, title: "Rekabetçi Bayi Fiyatları", desc: "Hacim bazlı kademeli iskonto, proje özel indirimleri.", bg: "bg-[#E8ECFF]" },
]

const PROCESS = [
  { n: "01", Icon: ClipboardList, title: "İhtiyaç Analizi", desc: "Sahanızı ve gereksinimlerinizi anlıyoruz, ürün ve marka önerisi hazırlıyoruz." },
  { n: "02", Icon: FileText, title: "Sistem Tasarımı & Teklif", desc: "Sistem mimarisi, BOM ve bayi fiyatlarıyla detaylı teklif sunuyoruz." },
  { n: "03", Icon: PackageCheck, title: "Tedarik & Kurulum", desc: "Lojistik koordinasyon, kurulum sonrası destek ve garanti takibi." },
]

const FAQS = [
  { q: "Bayi olmadan ürün satın alabilir miyim?", a: "nexadepo B2B bir platformdur. Bayi başvurusu onaylanarak özel fiyat, kredi limiti ve proje bazlı tekliflere erişebilirsiniz." },
  { q: "Proje bazlı teklif nasıl alırım?", a: "Teklif İste formundan saha ve ihtiyaç bilgilerinizi iletin; teknik ekibimiz 2–4 saat içinde marka, ürün ve fiyat önerisi hazırlasın." },
  { q: "Hangi markaların yetkili tedarikçisisiniz?", a: "Dahua, Hikvision, Uniview, Ruijie, Ajax, Honeywell, Seagate ve daha fazlası — 27+ global markanın yetkili tedarikçisiyiz." },
  { q: "Kurulum desteği veriyor musunuz?", a: "Evet. Saha analizi, sistem tasarımı ve gerektiğinde kurulum koordinasyonu sağlıyoruz; 7/24 uzaktan teknik destek sunuyoruz." },
  { q: "Ürünlerde garanti var mı?", a: "Tüm ürünlerde üretici garantisi (genelde 2 yıl) ve nexadepo ek desteği geçerlidir." },
  { q: "Ödeme ve kredi limiti nasıl işliyor?", a: "Onaylı bayilere vade ile ödeme ve kredi limiti, proje siparişlerinde özel ödeme planları sunuyoruz." },
]

const POSTS = [
  {
    title: "IP Kamera Seçiminde 5 Kritik Nokta",
    desc: "Çözünürlük, WDR, PoE bütçesi ve AI analitik — projeye doğru kamera seçmenin pratik yolu.",
    img: "/images/cards/blog-kamera.jpg",
    href: "/blog",
  },
  {
    title: "Adresli Yangın İhbar Sistemleri Rehberi",
    desc: "Adresli panellerin konvansiyonel sistemlere üstünlükleri ve proje tasarımında dikkat edilecekler.",
    img: "/images/cards/blog-yangin.jpg",
    href: "/blog",
  },
  {
    title: "PoE Switch ile Sorunsuz Kamera Altyapısı",
    desc: "Port bütçesi, VLAN ayrımı ve uplink planlaması ile kesintisiz görüntü aktarımı.",
    img: "/images/cards/blog-poe.jpg",
    href: "/blog",
  },
]

export default async function VitrinPage() {
  const categories = await getHeroCategories()
  return (
    <div className="bg-[#F5F5F5] font-nx-sans text-slate-900">
      {/* ─── HERO (carousel) ──────────────────────────────────── */}
      <HeroCarousel />

      {/* ─── CATEGORY STRIP — DB'den tüm kategoriler, 5'li sayfalar + sağ/sol ok ─── */}
      {/* Gradyan: hero'nun tonundan About'un beyazına yumuşak geçiş */}
      <section className="bg-[linear-gradient(180deg,#E9F1FC_0%,#FFFFFF_100%)] px-5 md:px-8">
        <div className="mx-auto max-w-[1300px]">
          <CategoryStrip categories={categories} />
        </div>
      </section>

      {/* ─── ABOUT — Ceron: hero kartlarından hemen sonra ─── */}
      <section className="bg-white py-20">
        <Reveal>
        <div className="mx-auto grid max-w-[1300px] items-center gap-12 px-6 md:grid-cols-2">
          <div className="relative">
            <div className="overflow-hidden rounded-[15px]">
              <img
                src="/images/cards/about.jpg"
                alt="nexadepo tedarik ve proje ekibi"
                className="h-[440px] w-full object-cover"
              />
            </div>
          </div>
          <div>
            <span className="font-nx-mono text-xs font-bold uppercase tracking-widest text-nx-accent">
              Hakkımızda
            </span>
            <h2 className="mt-3 text-3xl font-nx-heading font-extrabold tracking-tight md:text-4xl">
              Güvenlikle, özenle, uzmanla
            </h2>
            <p className="mt-4 leading-7 text-slate-500">
              nexadepo, güvenlik ve network sistemlerinde global güç ile yerel uzmanlığı
              birleştiren bir B2B tedarik platformudur.
            </p>
            {/* Ceron: 3 özellik — cyan daire check + başlık + desc */}
            <div className="mt-8 space-y-5">
              {ABOUT_FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-4">
                  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nx-accent/10 text-nx-accent">
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-nx-dark">{f.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Ceron: sayaç satırı */}
            <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-slate-200 pt-7">
              {STATS.map(([val, label]) => (
                <div key={label}>
                  <p className="text-3xl font-nx-heading font-extrabold text-nx-dark">{val}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        </Reveal>
      </section>

      {/* ─── PARTNERS — Ceron: logo bandı About'tan sonra ─── */}
      <section className="border-y border-slate-100 bg-[#F5F5F5] py-10">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center font-nx-mono text-[10px] uppercase tracking-[0.3em] text-slate-400">
            Çözüm Ortaklarımız
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {PARTNERS.map((p) => (
              <img
                key={p.name}
                src={p.img}
                alt={p.name}
                className="h-9 w-auto grayscale opacity-50 transition duration-300 hover:grayscale-0 hover:opacity-100"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE — Ceron: sol görsel kart, sağ 2x2 pastel kart ─── */}
      <section className="bg-white py-20">
        <Reveal>
        <div className="mx-auto grid max-w-[1300px] gap-[15px] px-6 lg:grid-cols-2">
          {/* Sol: görsel kart + başlık */}
          <div className="relative flex min-h-[420px] flex-col justify-end overflow-hidden rounded-[15px] p-8">
            <img
              src="/images/cards/why.jpg"
              alt="nexadepo depo ve lojistik"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(15,23,42,0.75)_0%,transparent_55%)]" />
            <div className="relative">
              <span className="font-nx-mono text-xs font-bold uppercase tracking-widest text-nx-accent">
                Neden nexadepo?
              </span>
              <h2 className="mt-3 text-3xl font-nx-heading font-extrabold tracking-tight text-white md:text-4xl">
                Tedarikçiden fazlası — güçlü bir iş ortağı
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/80">
                Hassasiyet, özen ve projenize özel modern tedarik çözümleriyle kusursuz sonuçlar.
              </p>
            </div>
          </div>
          {/* Sağ: 2x2 pastel kartlar */}
          <div className="grid gap-[15px] sm:grid-cols-2">
            {WHY.map((w) => (
              <div key={w.title} className={`rounded-[15px] p-[30px] ${w.bg}`}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-nx-accent shadow-sm">
                  <w.Icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h3 className="mt-5 text-lg font-bold text-nx-dark">{w.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{w.desc}</p>
                <Link
                  href="/teklif-iste"
                  className="mt-5 inline-flex items-center gap-1 border-b border-nx-dark pb-1 text-xs font-bold uppercase tracking-wider text-nx-dark transition hover:border-nx-accent hover:text-nx-accent"
                >
                  İletişime Geç <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
        </Reveal>
      </section>

      {/* ─── PROCESS — Ceron: sol içerik + görsel pill'ler, sağ dashed kartlar ─── */}
      <section className="bg-[#F0F5FF] py-20">
        <Reveal>
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-2">
          {/* Sol: başlık + buton + görsel üstünde beyaz pill'ler */}
          <div>
            <span className="font-nx-mono text-xs font-bold uppercase tracking-widest text-nx-accent">
              Süreç
            </span>
            <h2 className="mt-3 text-3xl font-nx-heading font-extrabold tracking-tight md:text-4xl">
              Güvenli alana giden basit adımlar
            </h2>
            <p className="mt-3 max-w-md text-slate-500">
              İhtiyaç analizinden kurulum sonrası desteğe kadar uçtan uca proje takibi.
            </p>
            <Link
              href="/teklif-iste"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-nx-accent px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-nx-dark"
            >
              Hemen Başla <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="relative mt-8 flex min-h-[350px] flex-col justify-end overflow-hidden rounded-[15px]">
              <img
                src="/images/cards/process.jpg"
                alt="Saha kurulum ve sistem entegrasyonu"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="relative flex flex-wrap gap-[10px] p-5">
                {["Aynı Gün Sevkiyat", "Sertifikalı Teknik Ekip", "Garanti Takibi"].map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-2 rounded-full bg-white py-[5px] pl-[3px] pr-[10px] text-sm text-nx-dark"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-nx-accent/10 text-nx-accent">
                      <Check className="h-4 w-4" />
                    </span>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {/* Sağ: Ceron dashed-border adım kartları + outline numara */}
          <div className="flex flex-col gap-5">
            {PROCESS.map((p) => (
              <div
                key={p.n}
                className="relative flex-1 rounded-[15px] border border-dashed border-slate-300 bg-white p-7 transition-colors duration-300 hover:border-nx-dark"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute right-7 top-5 font-nx-heading text-[80px] font-extrabold leading-[0.8] text-transparent nx-outline-num"
                >
                  {p.n}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-nx-accent/10 text-nx-accent">
                  <p.Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="mt-5 text-lg font-bold">{p.title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
        </Reveal>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="bg-[#EFFAF3] py-20">
        <Reveal>
        <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="font-nx-mono text-xs font-bold uppercase tracking-widest text-nx-accent">
              Referanslar
            </span>
            <h2 className="mt-3 text-3xl font-nx-heading font-extrabold tracking-tight text-nx-dark md:text-4xl">
              Gerçek sonuçlar, gerçek bayi yorumları
            </h2>
            <p className="mt-3 text-slate-500">340+ aktif bayinin nexadepo deneyiminden öne çıkanlar.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
            <div className="rounded-3xl border border-slate-100 bg-white p-8">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-4xl font-nx-heading font-extrabold text-nx-dark">4.8/5</p>
              <p className="mt-1 text-sm text-slate-500">Bayi memnuniyet skoru</p>
              <p className="mt-6 text-sm leading-6 text-slate-600">
                340+ aktif bayi ve binlerce proje ile Türkiye genelinde güvenilir tedarik.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-8">
              <Quote className="h-10 w-10 text-nx-accent/40" />
              <p className="mt-4 text-lg leading-8 text-slate-700">
                &ldquo;Proje bazlı teklif süreci çok hızlı. Teknik ekip kamera ve network mimarisini
                baştan tasarladı, aynı gün stoktan sevkiyat yaptılar. Müşterilerimize kurulum
                artık çok daha sorunsuz.&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-nx-accent font-bold text-white">
                  MK
                </div>
                <div>
                  <p className="font-bold text-nx-dark">Mehmet K.</p>
                  <p className="text-xs text-slate-500">Sistem Entegratörü, İstanbul</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </Reveal>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <Reveal>
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className="font-nx-mono text-xs font-bold uppercase tracking-widest text-nx-accent">
              SSS
            </span>
            <h2 className="mt-3 text-3xl font-nx-heading font-extrabold tracking-tight md:text-4xl">
              Sorularınız mı var? Cevabımız var
            </h2>
            <p className="mt-3 text-slate-500">
              Bayilik, teklif süreçi ve teknik destek hakkında sık sorulan sorular.
            </p>
          </div>
          <div className="divide-y divide-slate-100 border-y border-slate-100">
            {FAQS.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-bold text-slate-900 marker:content-none">
                  {f.q}
                  <Plus className="h-5 w-5 shrink-0 text-nx-accent transition group-open:rotate-45" />
                </summary>
                <p className="mt-3 text-sm leading-6 text-slate-500">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
        </Reveal>
      </section>

      {/* ─── BLOG — Ceron: 3 kart ─── */}
      <section className="bg-[#F5F5F5] py-20">
        <Reveal>
        <div className="mx-auto max-w-[1300px] px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="font-nx-mono text-xs font-bold uppercase tracking-widest text-nx-accent">
                Blog
              </span>
              <h2 className="mt-3 text-3xl font-nx-heading font-extrabold tracking-tight md:text-4xl">
                Güvenlik ipuçları ve uzman görüşleri
              </h2>
              <p className="mt-3 text-slate-500">
                Pratik kurulum ipuçları, ürün karşılaştırmaları ve proje deneyimleri.
              </p>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border-2 border-nx-dark/15 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-nx-dark transition hover:border-nx-accent hover:text-nx-accent"
            >
              Tüm Yazılar <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-12 grid gap-[15px] md:grid-cols-3">
            {POSTS.map((post) => (
              <Link
                key={post.title}
                href={post.href}
                className="group overflow-hidden rounded-[15px] bg-white"
              >
                <div className="h-[220px] overflow-hidden">
                  <img
                    src={post.img}
                    alt={post.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-7">
                  <h3 className="text-lg font-bold leading-snug text-nx-dark">{post.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{post.desc}</p>
                  <span className="mt-5 inline-flex items-center gap-1 border-b border-nx-dark pb-1 text-xs font-bold uppercase tracking-wider text-nx-dark transition group-hover:border-nx-accent group-hover:text-nx-accent">
                    Devamını Oku <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
        </Reveal>
      </section>

      {/* ─── NEWSLETTER — Ceron: koyu band, abonelik formu ─── */}
      <section className="bg-nx-dark py-16 text-white">
        <Reveal>
        <div className="mx-auto grid max-w-[1300px] items-center gap-8 px-6 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-nx-heading font-extrabold tracking-tight md:text-3xl">
              Bayi bültenimize abone olun, yeni ürün ve proje fırsatlarından ilk siz haberdar olun.
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              İstediğiniz zaman abonelikten ayrılabilirsiniz.
            </p>
          </div>
          <form
            action="/teklif-iste"
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <input
              type="email"
              required
              placeholder="E-posta adresiniz"
              className="h-[52px] flex-1 rounded-full border border-white/20 bg-white/10 px-6 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-nx-accent"
            />
            <button
              type="submit"
              className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-nx-accent px-7 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-white hover:text-nx-dark"
            >
              Abone Ol <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
        </Reveal>
      </section>
    </div>
  )
}
