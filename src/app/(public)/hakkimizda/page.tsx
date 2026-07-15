import Link from "next/link"
import { IcnTarget, IcnBriefcase, IcnTool, IcnBox } from "@/components/public/icons-next"

export const metadata = {
  title: "Hakkımızda — Next AI Teknoloji",
  description:
    "Türkiye'nin B2B teknoloji tedarik platformu. 12+ yıl sektör deneyimi, 27+ global marka partneri, 340+ aktif bayi. CCTV, network, geçiş kontrol ve akıllı bina çözümlerinde yetkili tedarikçi.",
  alternates: { canonical: "/hakkimizda" },
}

const stats = [
  ["12+", "Yıl sektör deneyimi"],
  ["27+", "Global marka partneri"],
  ["340+", "Aktif bayi"],
  ["1.800+", "Aktif teknik ürün"],
]

const values = [
  {
    Icon: IcnTarget,
    title: "Doğru çözüm",
    desc: "Standardı satmak yerine projeye uygun çözümü öneririz. Sahayı analiz eder, ihtiyaca göre sistem tasarlar, maliyet-fayda dengesi kurarız.",
  },
  {
    Icon: IcnBriefcase,
    title: "Uzun vadeli ortaklık",
    desc: "Tek seferlik satış değil, sürekli iş ortaklığı hedefleriz. Bayilerimizin başarısı bizim başarımız. Proje öncesi ve sonrası teknik destek sağlarız.",
  },
  {
    Icon: IcnTool,
    title: "Teknik uzmanlık",
    desc: "Saha mühendisleri ve sistem mimarlarımız, kurulum aşamasında ve sonrasında teknik destek verir. 7/24 erişilebilir destek hattımız mevcuttur.",
  },
  {
    Icon: IcnBox,
    title: "Hızlı tedarik",
    desc: "İstanbul, Mersin ve Bursa depolarımızdan aynı gün kargo. Proje bazlı özel tedarik taleplerinde öncelikli lojistik koordinasyonu sağlarız.",
  },
]

const milestones = [
  { year: "2014", title: "Kuruluş", desc: "İstanbul merkez ofis ile CCTV ve güvenlik sistemleri toptan satışına başladık." },
  { year: "2017", title: "Marka anlaşmaları", desc: "Dahua, Hikvision, UNV gibi global markaların Türkiye yetkili distribütörü olduk." },
  { year: "2020", title: "Network & IoT genişlemesi", desc: "Ruijie, Ajax, Honeywell partnerlikleri ile ürün gamını network ve akıllı bina sistemlerine genişlettik." },
  { year: "2023", title: "Bayi portalı", desc: "Online bayi portalını devreye aldık — gerçek zamanlı stok, anlık sipariş, cari hesap yönetimi." },
  { year: "2025", title: "Proje platformu", desc: "Yeni nesil proje tasarım platformu ile bayilerin teknik tasarım süreçlerini dijitalleştirdik." },
]

export default function HakkimizdaPage() {
  return (
    <div className="font-nx-sans">
      {/* Hero */}
      <section className="bg-[#071426] px-6 py-24 text-white md:px-10 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[#67abff]">
                Hakkımızda
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-[-0.055em] md:text-6xl">
                Türkiye'nin B2B teknoloji
                <span className="block bg-gradient-to-r from-[#80b7ff] to-[#1477ff] bg-clip-text text-transparent">
                  tedarik ve proje platformu.
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                2014 yılından bu yana CCTV, network ve akıllı bina sistemlerinde Türkiye genelinde bayilere
                ve sistem entegratörlerine yetkili tedarik, teknik danışmanlık ve proje tasarım desteği
                sağlıyoruz.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {stats.map(([val, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <strong className="block text-3xl font-extrabold tracking-tight text-white">{val}</strong>
                  <span className="mt-1 block font-nx-mono text-[9px] uppercase tracking-[.14em] text-slate-500">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="bg-white px-6 py-20 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[#1477ff]">Misyonumuz</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                Teknoloji tedarikçiden <span className="text-[#1477ff]">iş ortağına dönüşmek.</span>
              </h2>
              <p className="mt-5 text-sm leading-7 text-slate-600">
                Bayilerimizin yalnızca ürün tedarik ettiği bir firmadan, teknik danışmanlık aldıkları, proje
                tasarımında destek gördükleri ve ticari koşullarda avantaj sağladıkları bir iş ortağına
                dönüşüyoruz. Türkiye'de her bölgede aynı hizmet kalitesini sunmak için çalışıyoruz.
              </p>
            </div>

            <div>
              <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[#1477ff]">Vizyonumuz</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                Türkiye'nin <span className="text-[#1477ff]">1 numaralı B2B teknoloji platformu.</span>
              </h2>
              <p className="mt-5 text-sm leading-7 text-slate-600">
                Güvenlik, network ve bina otomasyonunda ülkenin en kapsamlı ürün gamına, en hızlı lojistik
                ağına ve en güçlü teknik destek altyapısına sahip platformu olmayı hedefliyoruz. 2030'a kadar
                1.000+ aktif bayi ve 50+ global marka partnerliğine ulaşmayı planlıyoruz.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-[#f4f7fa] px-6 py-20 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[#1477ff]">Değerlerimiz</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              4 temel ilke üzerine kurulduk.
            </h2>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl bg-white p-6 border border-slate-200">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071426] text-white">
                  <v.Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#071426]">{v.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones / Timeline */}
      <section className="bg-white px-6 py-20 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[#1477ff]">Tarihçe</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">12 yıllık yolculuk.</h2>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {milestones.map((m, i) => (
              <div
                key={m.year}
                className={`rounded-2xl p-6 ${
                  i === 0 || i === milestones.length - 1
                    ? "bg-[#071426] text-white"
                    : "bg-[#f4f7fa] text-[#071426]"
                }`}
              >
                <span
                  className={`font-nx-mono text-[10px] font-bold tracking-[.18em] ${
                    i === 0 || i === milestones.length - 1 ? "text-[#67abff]" : "text-[#1477ff]"
                  }`}
                >
                  {m.year}
                </span>
                <h3 className="mt-4 text-sm font-bold leading-snug">{m.title}</h3>
                <p
                  className={`mt-2 text-xs leading-5 ${
                    i === 0 || i === milestones.length - 1 ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-[#1477ff] px-6 py-20 text-white md:px-10">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-3xl font-bold tracking-[-0.055em] md:text-5xl">Bizimle çalışmak ister misiniz?</h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-blue-100">
            Bayimiz olmak, proje teklifi almak veya daha fazla bilgi için bizimle iletişime geçin.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/bayimiz-olun"
              className="rounded-xl bg-white px-6 py-4 text-sm font-bold text-[#1477ff] transition hover:bg-blue-50"
            >
              Bayimiz Olun
            </Link>
            <Link
              href="/teklif-iste"
              className="rounded-xl border border-white/35 px-6 py-4 text-sm font-bold transition hover:bg-white/10"
            >
              Proje Teklifi İste
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
