import Link from "next/link"
import { HeroCarousel } from "./hero-carousel"
import {
  Cctv,
  Network,
  Fingerprint,
  Building2,
  Flame,
  Siren,
  ShieldCheck,
  Truck,
  Headphones,
  Tag,
  Users,
  Award,
  ArrowRight,
  Phone,
  Check,
  ClipboardList,
  FileText,
  PackageCheck,
  Star,
  Plus,
  Quote,
} from "lucide-react"

const PARTNERS = ["DAHUA", "HIKVISION", "UNIVIEW", "RUIJIE", "AJAX", "HONEYWELL", "SEAGATE"]

const SERVICES = [
  { Icon: Cctv, title: "Güvenlik Kamerası", desc: "IP kamera, NVR ve AI analitik ile uçtan uca görüntü güvenliği.", color: "bg-blue-50 text-[#0040a4]" },
  { Icon: Network, title: "Ağ ve Network", desc: "PoE switch, wireless AP ve fiber omurga ile güvenli bağlantı altyapısı.", color: "bg-emerald-50 text-emerald-600" },
  { Icon: Fingerprint, title: "Geçiş Kontrol", desc: "Kart okuyucu, bariyer ve biometrik sistemlerle erişim yönetimi.", color: "bg-sky-50 text-sky-600" },
  { Icon: Building2, title: "Akıllı Bina", desc: "Alarm, interkom ve otomasyon sistemlerini tek platformdan yönetim.", color: "bg-amber-50 text-amber-600" },
  { Icon: Flame, title: "Yangın Algılama", desc: "Duman/ısı sensörü ve adresli yangın paneli, sprinkler entegrasyonu.", color: "bg-orange-50 text-orange-600" },
  { Icon: Siren, title: "Hırsız Alarm", desc: "PIR sensör ve manyetik kontak ile 7/24 izinsiz giriş tespiti.", color: "bg-rose-50 text-rose-600" },
]

const STATS = [
  ["12", "Yıl Deneyim"],
  ["340+", "Aktif Bayi"],
  ["1.800+", "Teknik Ürün"],
  ["48 sn", "İlk Yanıt SLA"],
]

const WHY = [
  { Icon: ShieldCheck, title: "Özellikli Ürünler", desc: "AI kamera, Layer 3 switch, adresli panel — kurumsal kalite.", bg: "bg-emerald-50" },
  { Icon: Truck, title: "Hızlı Tedarik", desc: "Stoklu ürünlerde aynı gün kargo, proje siparişinde öncelikli lojistik.", bg: "bg-slate-100" },
  { Icon: Headphones, title: "7/24 Teknik Destek", desc: "Uzaktan yardım, saha analizi ve sistem tasarımı danışmanlığı.", bg: "bg-slate-100" },
  { Icon: Tag, title: "Rekabetçi Bayi Fiyatları", desc: "Hacim bazlı kademeli iskonto, proje özel indirimleri.", bg: "bg-blue-50" },
  { Icon: Users, title: "Uzman Kadro", desc: "Sertifikalı güvenlik ve network mühendislerinden destek.", bg: "bg-slate-100" },
  { Icon: Award, title: "2 Yıl Garanti", desc: "Tüm ürünlerde üretici garantisi + nexadepo ek destek.", bg: "bg-sky-50" },
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

export default function VitrinPage() {
  return (
    <div className="bg-slate-50 font-nx-sans text-slate-900">
      {/* ─── HERO (carousel) ──────────────────────────────────── */}
      <HeroCarousel />

      {/* ─── PARTNERS ─────────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50 py-10">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center font-nx-mono text-[10px] uppercase tracking-[0.3em] text-slate-400">
            Tedarik ortaklarımız
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {PARTNERS.map((p) => (
              <span
                key={p}
                className="text-lg font-extrabold tracking-tight text-slate-400 grayscale transition hover:text-[#0040a4] hover:grayscale-0"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SERVICES ─────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <span className="font-nx-mono text-xs font-bold uppercase tracking-widest text-[#0040a4]">
              Hizmetlerimiz
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
              Projenize özel çözüm ekosistemi
            </h2>
            <p className="mt-3 text-slate-500">
              Güvenlik kamerasından yangın algılamaya, network altyapısından akıllı bina
              otomasyonuna kadar uçtan uca sistem tedariki.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <Link
                key={s.title}
                href="/cozumler"
                className="group rounded-2xl border border-slate-100 bg-white p-7 transition hover:-translate-y-1 hover:border-[#0040a4]/20 hover:shadow-xl"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${s.color}`}>
                  <s.Icon className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <h3 className="mt-6 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{s.desc}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[#0040a4]">
                  İncele
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ABOUT ────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 md:grid-cols-2">
          <div className="relative">
            <div className="overflow-hidden rounded-3xl shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=75&auto=format&fit=crop"
                alt="nexadepo ofis ve tedarik"
                className="h-[440px] w-full object-cover"
              />
            </div>
          </div>
          <div>
            <span className="font-nx-mono text-xs font-bold uppercase tracking-widest text-[#0040a4]">
              Hakkımızda
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
              Güvenlikle, özenle, uzmanla
            </h2>
            <p className="mt-4 leading-7 text-slate-500">
              nexadepo, güvenlik ve network sistemlerinde global güç ile yerel uzmanlığı
              birleştiren bir B2B tedarik platformudur. 27+ global markanın yetkili tedarikçisi
              olarak bayilere özel fiyat, kredi limiti ve proje bazlı ticari koşullar sunuyoruz.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-5">
              {STATS.map(([val, label]) => (
                <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5">
                  <p className="text-3xl font-extrabold text-[#0040a4]">{val}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">{label}</p>
                </div>
              ))}
            </div>
            <Link
              href="/bayi-programi"
              className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-[#0040a4] px-6 py-3 text-sm font-bold text-[#0040a4] transition hover:bg-[#0040a4] hover:text-white"
            >
              Bayi Programı <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE ───────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <span className="font-nx-mono text-xs font-bold uppercase tracking-widest text-[#0040a4]">
              Neden nexadepo?
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
              Tedarikçiden fazlası — güçlü bir iş ortağı
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WHY.map((w) => (
              <div key={w.title} className={`rounded-2xl p-7 ${w.bg}`}>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#0040a4] shadow-sm">
                  <w.Icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h3 className="mt-5 text-lg font-bold">{w.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{w.desc}</p>
                <Link
                  href="/teklif-iste"
                  className="mt-5 inline-flex items-center gap-1 border-b-2 border-slate-900 text-xs font-bold uppercase tracking-wider text-slate-900 hover:gap-2"
                >
                  İletişime Geç <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROCESS ──────────────────────────────────────────── */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <span className="font-nx-mono text-xs font-bold uppercase tracking-widest text-[#0040a4]">
              Süreç
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
              Güvenli alana giden basit adımlar
            </h2>
            <p className="mt-3 text-slate-500">
              İhtiyaç analizinden kurulum sonrası desteğe kadar uçtan uca proje takibi.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {PROCESS.map((p) => (
              <div
                key={p.n}
                className="rounded-2xl border border-slate-100 bg-white p-8 transition hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="font-nx-mono text-3xl font-extrabold text-slate-200">{p.n}</span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0040a4]/10 text-[#0040a4]">
                    <p.Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="mt-5 text-lg font-bold">{p.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <span className="font-nx-mono text-xs font-bold uppercase tracking-widest text-sky-400">
              Referanslar
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
              Gerçek sonuçlar, gerçek bayi yorumları
            </h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-[1fr_1.4fr]">
            <div className="rounded-3xl bg-slate-800 p-8">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-4xl font-extrabold">4.8/5</p>
              <p className="mt-1 text-sm text-slate-400">Bayi memnuniyet skoru</p>
              <p className="mt-6 text-sm leading-6 text-slate-300">
                340+ aktif bayi ve binlerce proje ile Türkiye genelinde güvenilir tedarik.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-800 p-8">
              <Quote className="h-10 w-10 text-sky-400/40" />
              <p className="mt-4 text-lg leading-8 text-slate-200">
                &ldquo;Proje bazlı teklif süreci çok hızlı. Teknik ekip kamera ve network mimarisini
                baştan tasarladı, aynı gün stoktan sevkiyat yaptılar. Müşterilerimize kurulum
                artık çok daha sorunsuz.&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0040a4] font-bold">
                  MK
                </div>
                <div>
                  <p className="font-bold">Mehmet K.</p>
                  <p className="text-xs text-slate-400">Sistem Entegratörü, İstanbul</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className="font-nx-mono text-xs font-bold uppercase tracking-widest text-[#0040a4]">
              SSS
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
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
                  <Plus className="h-5 w-5 shrink-0 text-[#0040a4] transition group-open:rotate-45" />
                </summary>
                <p className="mt-3 text-sm leading-6 text-slate-500">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BAND ─────────────────────────────────────────── */}
      <section className="bg-[#0040a4] py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 text-center md:flex-row md:text-left">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
              Projenizi birlikte planlayalım
            </h2>
            <p className="mt-2 text-sm text-blue-100">
              Teknik ekibimiz 2–4 saat içinde size geri döner. Ücretsiz analiz ve teklif.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/teklif-iste"
              className="inline-flex items-center gap-2 rounded-full bg-green-500 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-green-600"
            >
              TEKLİF AL <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/bayimiz-olun"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-7 py-3.5 text-sm font-bold transition hover:bg-white/10"
            >
              Bayimiz Olun
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
