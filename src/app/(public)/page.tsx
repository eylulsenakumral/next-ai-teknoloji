import Link from "next/link"
import { Hero } from "@/components/public/hero-next"
import {
  IcnTarget,
  IcnBriefcase,
  IcnBox,
  IcnTag,
  IcnTool,
  IcnFile,
  IcnCamera,
  IcnNetwork,
  IcnAccessControl,
  IcnSmartHome,
} from "@/components/public/icons-next"
import {
  LogoDahua,
  LogoHikvision,
  LogoUNV,
  LogoReolink,
  LogoSeagate,
  LogoAjax,
  LogoRuijie,
  LogoHoneywell,
} from "@/components/public/brand-logos"

export const metadata = {
  title: "Next AI Teknoloji — Güvenlik & Network Sistemleri Bayi Platformu",
  description:
    "16+ global markanın yetkili tedarikçisi. CCTV, IP kamera, NVR, network altyapısı, geçiş kontrol ve akıllı bina çözümleri için proje bazlı teklif ve bayi avantajları.",
  alternates: { canonical: "/" },
}

// Ana üretim domain'i env ile override edilebilir (sitemap.ts ile aynı kural).
// globalThis required: bu dosyada PartnershipSection'ın `const process` array'i
// modül-scope'ta global Node process'ini gölgeliyor.
const SITE_URL = globalThis.process.env.NEXT_PUBLIC_SITE_URL ?? "https://next-ai-teknoloji.com"

// Organization JSON-LD — Knowledge Graph / kurumsal kimlik tanımı.
// İletişim bilgileri dealer-footer.tsx ile tutarlı (tek kaynak: +905529895959 / info@next-ai.com.tr).
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Next AI Teknoloji",
  url: SITE_URL,
  description:
    "16+ global markanın yetkili tedarikçisi. CCTV, IP kamera, NVR, network altyapısı, geçiş kontrol ve akıllı bina çözümleri için proje bazlı teklif ve bayi avantajları.",
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/logo.png`,
    width: 940,
    height: 400,
  },
  image: `${SITE_URL}/logo.png`,
  email: "info@next-ai.com.tr",
  telephone: "+905529895959",
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+905529895959",
      email: "info@next-ai.com.tr",
      contactType: "sales",
      areaServed: "TR",
      availableLanguage: ["Turkish", "English"],
    },
  ],
}

// ─── Brand Ecosystem ───────────────────────────────────────────────────────────
const featuredBrands = [
  { Logo: LogoDahua, cat: "Kamera Sistemleri", desc: "AI kamera, NVR ve analitik" },
  { Logo: LogoHikvision, cat: "Kamera Sistemleri", desc: "Kurumsal güvenlik global lideri" },
  { Logo: LogoUNV, cat: "Kamera Sistemleri", desc: "4K IP kamera sistemleri" },
  { Logo: LogoReolink, cat: "Kamera Sistemleri", desc: "PoE & kablosuz kamera çözümleri" },
]

const secondaryBrands = [
  { Logo: LogoRuijie, cat: "Network Sistemleri" },
  { Logo: LogoAjax, cat: "Akıllı Bina" },
  { Logo: LogoSeagate, cat: "Veri Depolama" },
  { Logo: LogoHoneywell, cat: "Yangın Algılama" },
]

function BrandsSection() {
  return (
    <section className="bg-white px-6 py-24 md:px-10 font-nx-sans">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[var(--color-primary)]">
              02 · Kurumsal çözüm ortaklarımız
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.055em] md:text-5xl">
              16+ global markanın
              <br />
              yetkili tedarikçisi.
            </h2>
          </div>
          <Link
            href="/markalar"
            className="shrink-0 text-sm font-bold text-[var(--color-primary)] hover:underline"
          >
            Tüm markalar ve kategoriler →
          </Link>
        </div>

        {/* featured brand grid */}
        <div className="mt-12 grid grid-cols-2 gap-px bg-slate-100 border border-slate-100 rounded-2xl overflow-hidden md:grid-cols-4">
          {featuredBrands.map(({ Logo, cat, desc }, i) => (
            <div
              key={i}
              className="group flex flex-col justify-between bg-white p-6 transition hover:bg-[var(--color-primary)]"
            >
              <span className="font-nx-mono text-[9px] uppercase tracking-[.15em] text-slate-400 group-hover:text-slate-600">
                {cat}
              </span>
              <div className="mt-6 flex h-12 items-center">
                <Logo className="h-8 w-auto max-w-[120px] opacity-80 transition group-hover:opacity-100 group-hover:[filter:brightness(10)]" />
              </div>
              <div className="mt-4">
                <p className="text-xs text-slate-400 group-hover:text-slate-500">{desc}</p>
                <span className="mt-3 block text-xs font-bold text-[var(--color-primary)] opacity-0 transition group-hover:opacity-100">
                  Ürünleri gör →
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* secondary brands */}
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {secondaryBrands.map(({ Logo, cat }, i) => (
            <div
              key={i}
              className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 transition hover:border-slate-200 hover:bg-white"
            >
              <Logo className="h-6 w-auto max-w-[80px] opacity-60 transition group-hover:opacity-90" />
              <span className="font-nx-mono text-[8px] uppercase tracking-widest text-slate-400">
                {cat}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Value Props ───────────────────────────────────────────────────────────────
const valueProps = [
  {
    Icon: IcnTarget,
    title: "Teknik danışmanlık",
    desc: "Saha analizi, ürün seçimi ve sistem tasarımı — her adımda uzman desteği.",
  },
  {
    Icon: IcnBriefcase,
    title: "Bayi avantajları",
    desc: "Özel fiyatlandırma, kredi limiti ve proje bazlı ticari koşullar.",
  },
  {
    Icon: IcnBox,
    title: "Hızlı tedarik",
    desc: "Stoklu ürünlerde aynı gün kargo. Proje siparişlerinde öncelikli lojistik koordinasyonu.",
  },
]

function ValueSection() {
  return (
    <section className="bg-[var(--color-background)] px-6 py-20 md:px-10 font-nx-sans">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-px bg-slate-200 rounded-2xl overflow-hidden sm:grid-cols-3">
          {valueProps.map((v) => (
            <div key={v.title} className="bg-white p-8 md:p-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white">
                <v.Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-8 text-xl font-bold tracking-tight">{v.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Solutions ─────────────────────────────────────────────────────────────────
const solutions = [
  {
    number: "01",
    Icon: IcnCamera,
    title: "Video Güvenlik",
    desc: "IP kamera, NVR, analitik yazılım ve montaj ekipmanlarıyla uçtan uca görüntü güvenliği.",
    tags: ["AI Analitik", "4K / 8MP", "PoE"],
    dark: true,
  },
  {
    number: "02",
    Icon: IcnNetwork,
    title: "Ağ Altyapısı",
    desc: "Yönetilen switch, wireless AP ve fiber omurga ile yüksek performanslı bağlantı altyapısı.",
    tags: ["Layer 3", "Wi-Fi 6", "VLAN"],
    dark: false,
  },
  {
    number: "03",
    Icon: IcnAccessControl,
    title: "Geçiş Kontrol",
    desc: "Kart okuyucu, bariyer, turnike ve biometrik sistemlerle kritik erişim noktaları yönetimi.",
    tags: ["Biometrik", "IP Entegre", "OSDP"],
    dark: false,
  },
  {
    number: "04",
    Icon: IcnSmartHome,
    title: "Akıllı Bina",
    desc: "Alarm, interkom, otomasyon ve izleme sistemlerini tek platformdan yönetin.",
    tags: ["IoT", "KNX", "Entegre Panel"],
    dark: false,
  },
]

function SolutionsSection() {
  return (
    <section className="bg-white px-6 py-24 md:px-10 font-nx-sans">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[var(--color-primary)]">
              03 · Çözüm alanları
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.055em] md:text-5xl">
              Projenize özel
              <br />
              çözüm ekosistemi.
            </h2>
          </div>
          <Link href="/cozumler" className="shrink-0 text-sm font-bold text-[var(--color-primary)] hover:underline">
            Tüm çözümleri gör →
          </Link>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {solutions.map((s) => (
            <div
              key={s.number}
              className={`group flex min-h-72 flex-col justify-between rounded-2xl p-7 transition ${
                s.dark
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-background)] hover:bg-[var(--color-primary)] hover:text-white"
              }`}
            >
              <div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    s.dark
                      ? "bg-[var(--color-primary)]/20 text-[#8aa8bc]"
                      : "bg-white text-[var(--color-primary)] group-hover:bg-[var(--color-primary)]/20 group-hover:text-[#8aa8bc]"
                  }`}
                >
                  <s.Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-xl font-bold tracking-tight">{s.title}</h3>
                <p
                  className={`mt-3 text-sm leading-6 ${
                    s.dark ? "text-slate-400" : "text-slate-500 group-hover:text-slate-400"
                  }`}
                >
                  {s.desc}
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-1.5">
                {s.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`rounded-full px-2.5 py-1 font-nx-mono text-[8px] font-bold uppercase tracking-[.1em] ${
                      s.dark
                        ? "bg-white/10 text-slate-400"
                        : "bg-white text-slate-500 group-hover:bg-white/10 group-hover:text-slate-400"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Project Design CTA ────────────────────────────────────────────────────────
function ProjectDesignSection() {
  const steps = [
    { n: "01", label: "Proje türünü seçin", sub: "Konut, işyeri, fabrika, kampüs…" },
    { n: "02", label: "İhtiyaçları belirleyin", sub: "Alan, kamera sayısı, özellikler" },
    { n: "03", label: "Bütçe aralığını girin", sub: "Yaklaşık bile olsa yeterli" },
    { n: "04", label: "Öneri alın", sub: "Ekibimiz size özel hazırlar" },
  ]

  return (
    <section className="bg-[var(--color-primary)] px-6 py-24 text-white md:px-10 font-nx-sans">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[#8aa8bc]">
              04 · Proje tasarımı
            </p>
            <h2 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.055em] md:text-5xl">
              Kamera sistemini
              <br />
              <span className="text-[#a8c4d4]">hiç bilmesek de</span>
              <br />
              birlikte tasarlayalım.
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-slate-400">
              Hangi kamerayı nereye koyacağınızı bilmeniz gerekmiyor. Birkaç soruya yanıt verin, teknik ekibimiz
              sizin için en uygun sistemi hazırlasın.
            </p>
            <Link
              href="/proje-tasarim"
              className="mt-8 flex items-center gap-3 rounded-xl bg-[var(--color-primary)] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[var(--color-primary)]/25 transition hover:bg-[#456680] w-fit"
            >
              Projenizi Tasarlayalım
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
                ↗
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {steps.map((s, i) => (
              <div
                key={s.n}
                className={`rounded-2xl p-6 ${i === 0 ? "bg-[var(--color-primary)]" : "border border-white/10 bg-white/5"}`}
              >
                <span
                  className={`font-nx-mono text-[10px] font-bold tracking-[.18em] ${
                    i === 0 ? "text-blue-200" : "text-slate-600"
                  }`}
                >
                  {s.n}
                </span>
                <h4 className="mt-6 text-sm font-bold leading-snug">{s.label}</h4>
                <p className={`mt-1.5 text-xs leading-5 ${i === 0 ? "text-blue-200" : "text-slate-500"}`}>
                  {s.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Process / Partnership ─────────────────────────────────────────────────────
const process = [
  { n: "01", title: "İhtiyaç analizi", desc: "Sahanızı ve gereksinimlerinizi anlıyoruz." },
  { n: "02", title: "Teknik tasarım", desc: "Ürün, marka ve sistem mimarisi önerileri." },
  { n: "03", title: "Ticari teklif", desc: "Bayi fiyatları ve proje koşullarıyla detaylı teklif." },
  { n: "04", title: "Tedarik & destek", desc: "Lojistik koordinasyon ve kurulum sonrası destek." },
]

function PartnershipSection() {
  return (
    <section className="bg-white px-6 py-24 md:px-10 font-nx-sans">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[var(--color-primary)]">
              05 · İş ortaklığı
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.055em] md:text-5xl">
              Tedarikçiden fazlası —
              <br />
              <span className="text-[var(--color-primary)]">güçlü bir iş ortağı.</span>
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-slate-500">
              CCTV bayileri ve sistem entegratörleri için özel ticari koşullar, kredi limiti, proje bazlı
              fiyatlandırma ve teknik destek.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {(
                [
                  [IcnBox, "Stok görünürlüğü", "Gerçek zamanlı stok bilgisi"],
                  [IcnTag, "Bayi fiyatları", "Rekabetçi toptan fiyatlar"],
                  [IcnTool, "Teknik destek", "7/24 uzaktan yardım"],
                  [IcnFile, "Proje danışmanlığı", "Saha analizi ve tasarım"],
                ] as const
              ).map(([Icon, title, sub]) => (
                <div key={title} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-background)] text-[var(--color-primary)]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-sm font-bold text-[var(--color-primary)]">{title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex gap-3">
              <Link
                href="/bayimiz-olun"
                className="rounded-xl bg-[var(--color-primary)] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[var(--color-primary-hover)]"
              >
                Bayimiz Olun
              </Link>
              <Link
                href="/bayi-programi"
                className="rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-bold text-[var(--color-primary)] transition hover:bg-slate-50"
              >
                Programı İncele →
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-[var(--color-background)] p-8 md:p-10">
            <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[var(--color-primary)]">
              Proje süreci
            </p>
            <div className="mt-8 space-y-0">
              {process.map((step, i) => (
                <div key={step.n} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] font-nx-mono text-[10px] font-bold text-white">
                      {step.n}
                    </div>
                    {i < process.length - 1 && (
                      <div className="my-1 w-px flex-1 bg-slate-200" style={{ minHeight: 32 }} />
                    )}
                  </div>
                  <div className="pb-8">
                    <h4 className="font-bold text-[var(--color-primary)]">{step.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Stats band ────────────────────────────────────────────────────────────────
function StatsBand() {
  return (
    <section className="border-y border-slate-100 bg-[var(--color-background)] px-6 py-14 md:px-10 font-nx-sans">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            ["₺2.4M+", "Aylık proje hacmi"],
            ["340+", "Aktif bayi"],
            ["99.2%", "Sipariş tamamlama oranı"],
            ["4.8/5", "Bayi memnuniyet skoru"],
          ].map(([val, label]) => (
            <div key={label}>
              <strong className="block text-3xl font-extrabold tracking-tight text-[var(--color-primary)]">{val}</strong>
              <span className="mt-1 block font-nx-mono text-[9px] uppercase tracking-[.14em] text-slate-400">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ─────────────────────────────────────────────────────────────────
function CtaSection() {
  return (
    <section className="bg-[var(--color-primary)] px-6 py-24 text-white md:px-10 font-nx-sans">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-2 md:items-end">
          <div>
            <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-blue-200">
              Bir sonraki adım
            </p>
            <h2 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.055em] md:text-5xl lg:text-6xl">
              Projenizi birlikte
              <br />
              planlayalım.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-blue-100">
              Teknik ekibimiz 2–4 saat içinde size geri döner. Projenizi ücretsiz analiz eder, marka ve ürün
              önerisi hazırlar.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end md:self-end">
            <Link
              href="/proje-tasarim"
              className="rounded-xl bg-white px-6 py-4 text-sm font-bold text-[var(--color-primary)] transition hover:bg-blue-50"
            >
              Projenizi Tasarlayalım
            </Link>
            <Link
              href="/teklif-iste"
              className="rounded-xl border border-white/35 px-6 py-4 text-sm font-bold transition hover:bg-white/10"
            >
              Proje Teklifi İste
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Hero />
      <ValueSection />
      <BrandsSection />
      <SolutionsSection />
      <ProjectDesignSection />
      <PartnershipSection />
      <StatsBand />
      <CtaSection />
    </>
  )
}
