import Link from "next/link"
import { prisma } from "@/lib/db"

export const metadata = {
  title: "Markalar — 27+ Global Teknoloji Markasının Yetkili Tedarikçisi",
  description:
    "Dahua, Hikvision, UNV, Reolink, Ruijie, Ajax, Honeywell, Seagate ve daha fazlası. Yetkili tedarikçi olarak tüm markaların ürünleri bayi fiyatına.",
  alternates: { canonical: "/markalar" },
}

// Statik logo component'leri yerine text-based grid kullanıyoruz.
// Gerçek logolar admin panelden yönetiliyor (Brand.logoUrl).

const FEATURED_BRANDS = [
  { name: "Dahua", cat: "Kamera Sistemleri", desc: "AI kamera, NVR ve analitik" },
  { name: "Hikvision", cat: "Kamera Sistemleri", desc: "Kurumsal güvenlik global lideri" },
  { name: "UNV", cat: "Kamera Sistemleri", desc: "4K IP kamera sistemleri" },
  { name: "Reolink", cat: "Kamera Sistemleri", desc: "PoE & kablosuz kamera" },
  { name: "Ruijie", cat: "Network", desc: "Yönetilen switch & AP" },
  { name: "Ajax", cat: "Akıllı Bina", desc: "Alarm & otomasyon" },
  { name: "Honeywell", cat: "Yangın Algılama", desc: "Ticari yangın sistemleri" },
  { name: "Seagate", cat: "Veri Depolama", desc: "Surveillance HDD" },
]

export const dynamic = "force-dynamic"

async function getBrands() {
  try {
    const brands = await prisma.brand.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        description: true,
        websiteUrl: true,
      },
    })
    return brands
  } catch (e) {
    console.error("[/markalar] brand fetch error:", e)
    return []
  }
}

export default async function MarkalarPage() {
  const brands = await getBrands()

  return (
    <div className="font-nx-sans">
      {/* Hero */}
      <section className="bg-[#453e71] px-6 py-24 text-white md:px-10 md:py-32">
        <div className="mx-auto max-w-7xl">
          <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[#8aa8bc]">
            Tedarik ortaklarımız
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.05] tracking-[-0.055em] md:text-6xl">
            27+ global markanın
            <span className="block bg-gradient-to-r from-[#a8c4d4] to-[#5086a8] bg-clip-text text-transparent">
              yetkili tedarikçisi.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400">
            CCTV ve network alanında dünya liderlerini Türkiye genelinde bayilere ulaştırıyoruz. Her markanın
            ürün gamı, teknik dokümantasyonu ve demo desteği tarafımızdan sağlanır.
          </p>
        </div>
      </section>

      {/* Featured statik grid */}
      <section className="bg-white px-6 py-20 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[#5086a8]">
              01 · Öne çıkan partnerler
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.055em] md:text-4xl">
              Sektörün global liderleri.
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-px bg-slate-100 border border-slate-100 rounded-2xl overflow-hidden md:grid-cols-4">
            {FEATURED_BRANDS.map((b) => (
              <div
                key={b.name}
                className="group flex flex-col justify-between bg-white p-6 transition hover:bg-[#453e71]"
              >
                <span className="font-nx-mono text-[9px] uppercase tracking-[.15em] text-slate-400 group-hover:text-slate-600">
                  {b.cat}
                </span>
                <div className="mt-6 flex h-12 items-center">
                  <span className="text-2xl font-extrabold tracking-[-.04em] text-[#453e71] group-hover:text-white">
                    {b.name}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-slate-400 group-hover:text-slate-500">{b.desc}</p>
                  <Link
                    href={`/katalog?brandSlug=${b.name.toLowerCase()}`}
                    className="mt-3 block text-xs font-bold text-[#5086a8] opacity-0 transition group-hover:opacity-100"
                  >
                    Ürünleri gör →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All brands from DB */}
      <section className="bg-[#f4f7fa] px-6 py-20 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[#5086a8]">
              02 · Tüm markalar ({brands.length})
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.055em] md:text-4xl">
              Kataloğumuzdaki tüm markalar.
            </h2>
          </div>

          {brands.length === 0 ? (
            <div className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-sm text-slate-500">
                Marka listesi yüklenemedi. Lütfen daha sonra tekrar deneyin.
              </p>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {brands.map((b) => (
                <Link
                  key={b.id}
                  href={`/urunler?brandSlug=${b.slug}`}
                  className="group flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#5086a8]/30 hover:bg-[#5086a8]/5"
                >
                  <div className="flex h-10 w-full items-center">
                    {b.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.logoUrl}
                        alt={b.name}
                        className="max-h-10 max-w-[120px] object-contain opacity-80 transition group-hover:opacity-100"
                      />
                    ) : (
                      <span className="text-lg font-bold tracking-[-.04em] text-[#453e71]">
                        {b.name}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                    {b.description ?? "Marka açıklaması"}
                  </p>
                  <span className="mt-auto pt-3 text-xs font-bold text-[#5086a8]">
                    Ürünleri gör →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#5086a8] px-6 py-20 text-white md:px-10">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-3xl font-bold tracking-[-0.055em] md:text-5xl">
            Aradığınız markayı bulamadınız?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-blue-100">
            Tedarik ettiğimiz 27+ markanın tamamı web sitesinde yer almıyor. Belirli bir marka veya ürün için
            bize ulaşın, ekibimiz araştırıp dönüş yapsın.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/teklif-iste"
              className="rounded-xl bg-white px-6 py-4 text-sm font-bold text-[#5086a8] transition hover:bg-blue-50"
            >
              Teklif İste
            </Link>
            <Link
              href="/bayimiz-olun"
              className="rounded-xl border border-white/35 px-6 py-4 text-sm font-bold transition hover:bg-white/10"
            >
              Bayimiz Olun
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
