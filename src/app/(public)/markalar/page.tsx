import Link from "next/link"
import Image from "next/image"
import { BadgeCheck, ArrowRight } from "lucide-react"
import { prisma } from "@/lib/db"
import { BrandGrid, type BrandItem, type BrandCategory } from "@/components/public/brand-grid"

export const metadata = {
  title: "Markalar — Global Teknoloji Markalarının Yetkili Tedarikçisi",
  description:
    "Dahua, Hikvision, UNV, Ruijie, Ajax, Honeywell, Seagate ve daha fazlası. Yetkili tedarikçi olarak tüm markaların ürünleri bayi fiyatına.",
  alternates: { canonical: "/markalar" },
}

export const dynamic = "force-dynamic"

// Kategori/OEM/typo gibi gerçek marka olmayan kayıtlar — listede gösterme.
const HIDDEN_BRANDS = [
  "Hiksivion",
  "Marka Yok",
  "OEM",
  "Microsoft Oem",
  "Kurumsal OEM Paket",
  "Para Çekmecesi",
  "Video İnterkom Ürünleri",
  "FOEM",
]

async function getBrandsData() {
  try {
    const [brands, allCategories] = await Promise.all([
      prisma.brand.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          name: { notIn: HIDDEN_BRANDS },
          // Sadece sistemde aktif ürünü olan markalar
          products: { some: { isActive: true, deletedAt: null } },
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          description: true,
          websiteUrl: true,
          _count: {
            select: { products: { where: { isActive: true, deletedAt: null } } },
          },
          products: {
            where: { isActive: true, deletedAt: null },
            select: { categoryId: true },
          },
        },
      }),
      prisma.category.findMany({
        where: { isActive: true, deletedAt: null },
        select: { id: true, parentId: true, slug: true, name: true, sortOrder: true },
      }),
    ])

    // Kategori id → kayıt haritası (üst kategoriye yürümek için)
    const catById = new Map(allCategories.map((c) => [c.id, c]))

    // Bir kategorinin en üst seviye (root) kategorisinin slug'ını bul
    function topLevelSlug(id: string | null): string | null {
      let cur = id ? catById.get(id) : undefined
      if (!cur) return null
      const seen = new Set<string>()
      while (cur && cur.parentId && !seen.has(cur.id)) {
        seen.add(cur.id)
        cur = catById.get(cur.parentId)
      }
      return cur?.slug ?? null
    }

    // Marka → ürün sayısı + ait olduğu üst kategoriler
    const brandItems: BrandItem[] = brands
      .map((b) => {
        const catSlugs = new Set<string>()
        for (const p of b.products) {
          const root = topLevelSlug(p.categoryId)
          if (root) catSlugs.add(root)
        }
        return {
          id: b.id,
          name: b.name,
          slug: b.slug,
          logoUrl: b.logoUrl,
          description: b.description,
          productCount: b._count.products,
          categorySlugs: [...catSlugs],
        }
      })
      .sort((a, b) => b.productCount - a.productCount)

    // Sekmeler: en az bir markası olan üst kategoriler (sortOrder'a göre)
    const categories: BrandCategory[] = allCategories
      .filter((c) => !c.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        count: brandItems.filter((b) => b.categorySlugs.includes(c.slug)).length,
      }))
      .filter((c) => c.count > 0)

    return { brandItems, categories }
  } catch (e) {
    console.error("[/markalar] brand fetch error:", e)
    return { brandItems: [] as BrandItem[], categories: [] as BrandCategory[] }
  }
}

export default async function MarkalarPage() {
  const { brandItems, categories } = await getBrandsData()
  const totalProducts = brandItems.reduce((sum, b) => sum + b.productCount, 0)
  const marqueeBrands = brandItems.slice(0, 12)

  return (
    <div className="font-nx-sans">
      {/* ─── Açılış: marka odaklı, canlı sayılar + logo marquee ─── */}
      <section className="relative overflow-hidden border-b border-[#E9F1FC] bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#E9F1FC] via-[#F4F9FE] to-white" />
        <div aria-hidden className="absolute inset-0 nx-hero-dots" />
        <div aria-hidden className="pointer-events-none absolute -top-24 right-[8%] h-[360px] w-[360px] rounded-full bg-[#1852ac]/[0.08] blur-3xl" />

        <div className="relative mx-auto max-w-[1400px] px-4 pb-14 pt-16 sm:px-6 md:pt-20 lg:px-8">
          <p className="font-nx-mono text-xs font-bold uppercase tracking-[0.25em] text-[#1852ac]">
            Tedarik ortaklarımız
          </p>
          <h1 className="mt-4 max-w-3xl font-nx-heading text-4xl font-bold leading-[1.08] tracking-tight text-[#1852ac] sm:text-5xl md:text-6xl">
            Global markaların <span className="text-nx-accent">yetkili</span> tedarikçisi
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            CCTV, network ve güvenlik alanında dünya liderlerini Türkiye genelinde bayilerle buluşturuyoruz.
            Listelenen her markanın ürünü stoklarımızda ve bayi fiyatına hazır.
          </p>

          {/* Canlı istatistikler */}
          <div className="mt-10 flex flex-wrap items-center gap-x-12 gap-y-6">
            <div>
              <p className="font-nx-heading text-4xl font-bold text-[#1852ac]">{brandItems.length}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Marka</p>
            </div>
            <div className="hidden h-10 w-px bg-[#1852ac]/15 sm:block" />
            <div>
              <p className="font-nx-heading text-4xl font-bold text-[#1852ac]">
                {totalProducts.toLocaleString("tr-TR")}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Ürün</p>
            </div>
            <div className="hidden h-10 w-px bg-[#1852ac]/15 sm:block" />
            <div className="flex items-center gap-2.5">
              <BadgeCheck className="h-6 w-6 text-nx-accent" aria-hidden />
              <div>
                <p className="text-sm font-bold text-[#1852ac]">Yetkili Tedarik</p>
                <p className="text-xs text-slate-500">Orijinal ürün, üretici garantisi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Logo marquee — en çok ürünü olan markalar */}
        {marqueeBrands.length > 0 && (
          <div className="nx-marquee relative border-t border-[#E9F1FC] bg-white/70 py-5 backdrop-blur-sm">
            <div className="nx-marquee-track flex w-max items-center gap-14 px-7">
              {[...marqueeBrands, ...marqueeBrands].map((b, i) => (
                <Link
                  key={`${b.id}-${i}`}
                  href={`/markalar/${b.slug}`}
                  className="flex shrink-0 items-center gap-3 opacity-70 transition hover:opacity-100"
                  aria-label={`${b.name} markası`}
                >
                  {b.logoUrl ? (
                    <span className="relative block h-9 w-28">
                      <Image src={b.logoUrl} alt={b.name} fill className="object-contain" sizes="112px" />
                    </span>
                  ) : (
                    <span className="font-nx-heading text-xl font-bold tracking-tight text-[#1852ac]">{b.name}</span>
                  )}
                  <span className="rounded-full bg-[#E9F1FC] px-2 py-0.5 text-[10px] font-bold text-[#1852ac]">
                    {b.productCount}
                  </span>
                </Link>
              ))}
            </div>
            <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent" />
            <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent" />
          </div>
        )}
      </section>

      {/* ─── İnteraktif marka listesi: arama + kategori sekmeleri ─── */}
      <BrandGrid brands={brandItems} categories={categories} />

      {/* ─── CTA: split düzen ─── */}
      <section className="relative overflow-hidden bg-[#1852ac]">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-nx-accent/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div className="max-w-xl">
            <h2 className="font-nx-heading text-3xl font-bold tracking-tight text-white md:text-4xl">
              Aradığınız markayı bulamadınız?
            </h2>
            <p className="mt-4 text-sm leading-7 text-blue-100">
              Tedarik ettiğimiz birçok marka web sitesinde yer almıyor. Belirli bir marka veya ürün için
              bize ulaşın; ekibimiz araştırıp en kısa sürede dönüş yapsın.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/teklif-iste"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#1852ac] transition hover:bg-blue-50"
            >
              Teklif İste <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/bayimiz-olun"
              className="inline-flex items-center rounded-full border border-white/40 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Bayimiz Olun
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
