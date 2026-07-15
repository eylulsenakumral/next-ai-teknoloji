import Link from "next/link"
import { IcnBox, IcnTag, IcnTool, IcnFile, IcnBriefcase, IcnTarget } from "@/components/public/icons-next"

export const metadata = {
  title: "Bayi Programı — CCTV & Sistem Entegratörleri için Özel Koşullar",
  description:
    "Bayi avantajları: özel fiyatlandırma, kredi limiti, proje bazlı ticari koşullar, teknik destek, stok görünürlüğü. 340+ aktif bayi ağı.",
  alternates: { canonical: "/bayi-programi" },
}

const benefits = [
  {
    Icon: IcnTag,
    title: "Bayi fiyatlandırması",
    desc: "Toptan seviyesinde rekabetçi fiyatlar. Hacim bazlı kademeli iskonto, proje özel indirimleri.",
  },
  {
    Icon: IcnBriefcase,
    title: "Kredi limiti & vade",
    desc: "Onaylı bayilere vade-li ödeme ve kredi limiti. Proje siparişlerinde özel ödeme planları.",
  },
  {
    Icon: IcnBox,
    title: "Stok görünürlüğü",
    desc: "Gerçek zamanlı stok bilgisi. Online bayi portalı üzerinden anlık sipariş ve takip.",
  },
  {
    Icon: IcnTool,
    title: "Teknik destek",
    desc: "7/24 uzaktan destek, proje tasarım danışmanlığı, kurulum öncesi saha analizi.",
  },
  {
    Icon: IcnFile,
    title: "Proje danışmanlığı",
    desc: "Sistem mimarisi önerisi, marka seçimi, BOM (bill of materials) hazırlama.",
  },
  {
    Icon: IcnTarget,
    title: "Pazarlama desteği",
    desc: "Marka materyalleri, katalog, demo ürün desteği ve ortak pazarlama aktiviteleri.",
  },
]

const tiers = [
  {
    name: "Başlangıç",
    color: "#453e71",
    target: "Yeni başlayan bayiler",
    discount: "5–10%",
    credit: "₺25.000",
    perks: ["Online bayi portalı", "Standart bayi fiyatları", "Mail-order desteği", "Haftalık kampanya bildirimleri"],
  },
  {
    name: "Profesyonel",
    color: "#5086a8",
    target: "Aktif tedarik eden bayiler",
    discount: "12–18%",
    credit: "₺100.000",
    perks: [
      "Tüm Başlangıç avantajları",
      "Proje bazlı özel fiyatlar",
      "Öncelikli teknik destek",
      "Aylık basit saha analizi (1 adet)",
      "Demo ürün desteği",
    ],
    featured: true,
  },
  {
    name: "Kurumsal",
    color: "#453e71",
    target: "Sistem entegratörleri",
    discount: "20%+ özel",
    credit: "Proje bazlı",
    perks: [
      "Tüm Profesyonel avantajları",
      "Özel marka anlaşmaları",
      "Ayrılmış hesap müdürü",
      "Sınırsız saha analizi",
      "Ortak pazarlama bütçesi",
      "VİP lojistik öncelik",
    ],
  },
]

const stats = [
  ["340+", "Aktif bayi"],
  ["₺2.4M+", "Aylık bayi hacmi"],
  ["99.2%", "Sipariş tamamlama"],
  ["4.8/5", "Bayi memnuniyeti"],
]

export default function BayiProgramiPage() {
  return (
    <div className="font-nx-sans">
      {/* Hero */}
      <section className="bg-[#453e71] px-6 py-24 text-white md:px-10 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[#8aa8bc]">
                Bayi Programı
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-[-0.055em] md:text-6xl">
                Tedarikçiden fazlası —
                <span className="block bg-gradient-to-r from-[#a8c4d4] to-[#5086a8] bg-clip-text text-transparent">
                  güçlü bir iş ortağı.
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                CCTV bayileri ve sistem entegratörleri için özel ticari koşullar, kredi limiti, proje bazlı
                fiyatlandırma ve teknik destek. Türkiye genelinde 340+ aktif bayi.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/bayimiz-olun"
                  className="rounded-xl bg-[#5086a8] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#456680]"
                >
                  Bayimiz Olun
                </Link>
                <Link
                  href="/bayi-giris"
                  className="rounded-xl border border-white/15 bg-white/5 px-6 py-4 text-sm font-bold transition hover:bg-white/10"
                >
                  Bayi Portalına Gir →
                </Link>
              </div>
            </div>

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

      {/* Benefits */}
      <section className="bg-[#f4f7fa] px-6 py-20 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[#5086a8]">
              Bayi avantajları
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.055em] md:text-5xl">
              6 farklı alanda
              <br />
              iş ortaklığı avantajı.
            </h2>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-[#5086a8]/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5086a8]/10 text-[#5086a8]">
                  <b.Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#453e71]">{b.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="bg-white px-6 py-20 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto">
            <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[#5086a8]">
              Üyelik kademeleri
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.055em] md:text-5xl">
              Hacminize göre büyüyen avantajlar.
            </h2>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`relative rounded-3xl p-8 transition ${
                  t.featured
                    ? "bg-[#453e71] text-white shadow-2xl lg:-translate-y-3"
                    : "bg-[#f4f7fa] text-[#453e71] hover:bg-[#453e71] hover:text-white"
                }`}
              >
                {t.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#5086a8] px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    En popüler
                  </span>
                )}
                <h3 className="text-2xl font-bold">{t.name}</h3>
                <p className={`mt-1 text-xs ${t.featured ? "text-slate-400" : "text-slate-500 group-hover:text-slate-400"}`}>
                  {t.target}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3 pb-6 border-b border-current/10">
                  <div>
                    <p className="font-nx-mono text-[9px] uppercase tracking-[.14em] opacity-60">İndirim</p>
                    <p className="mt-1 text-xl font-extrabold">{t.discount}</p>
                  </div>
                  <div>
                    <p className="font-nx-mono text-[9px] uppercase tracking-[.14em] opacity-60">Kredi limiti</p>
                    <p className="mt-1 text-xl font-extrabold">{t.credit}</p>
                  </div>
                </div>

                <ul className="mt-6 space-y-3">
                  {t.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5086a8]" />
                      <span className="opacity-80">{p}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/bayimiz-olun"
                  className={`mt-8 block rounded-xl py-3 text-center text-sm font-bold transition ${
                    t.featured
                      ? "bg-[#5086a8] text-white hover:bg-[#456680]"
                      : "bg-[#453e71] text-white hover:bg-[#36305a]"
                  } ${!t.featured ? "[&]:hover:bg-[#5086a8]" : ""}`}
                >
                  Başvur
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="bg-[#453e71] px-6 py-20 text-white md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[#8aa8bc]">
              Başvuru süreci
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.055em] md:text-5xl">
              4 adımda onay.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", title: "Başvuru", desc: "Online form ve vergi levhası yükleyin" },
              { n: "02", title: "İnceleme", desc: "Ekibimiz 2 iş gününde değerlendirir" },
              { n: "03", title: "Onay & sözleşme", desc: "Kademeniz belirlenir, sözleşme imzalanır" },
              { n: "04", title: "Aktivasyon", desc: "Bayi portalı erişimi ve ilk sipariş" },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <span className="font-nx-mono text-[10px] font-bold tracking-[.18em] text-[#8aa8bc]">{s.n}</span>
                <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
