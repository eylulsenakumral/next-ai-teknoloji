import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { BadgeCheck, Package, Globe, ArrowRight, ChevronRight } from "lucide-react"
import { prisma } from "@/lib/db"
import { BrandProducts } from "@/components/public/brand-products"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string }>
}

async function getBrand(slug: string) {
  return prisma.brand.findFirst({
    where: { slug, deletedAt: null, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      description: true,
      websiteUrl: true,
      _count: { select: { products: { where: { isActive: true, deletedAt: null } } } },
    },
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const brand = await getBrand(slug)
  if (!brand) return { title: "Marka Bulunamadı" }
  return {
    title: `${brand.name} Ürünleri — Yetkili Tedarikçi`,
    description:
      brand.description ??
      `${brand.name} ürünleri toptan bayi fiyatları ve stok garantisiyle. Yetkili tedarikçi güvencesiyle.`,
    alternates: { canonical: `/markalar/${brand.slug}` },
  }
}

export default async function BrandDetailPage({ params }: Props) {
  const { slug } = await params
  const brand = await getBrand(slug)
  if (!brand) notFound()

  const productCount = brand._count.products

  return (
    <div className="font-nx-sans">
      {/* ─── Marka hero ─── */}
      <section className="relative overflow-hidden border-b border-[#E9F1FC] bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#E9F1FC] via-[#F4F9FE] to-white" />
        <div aria-hidden className="absolute inset-0 nx-hero-dots" />
        <div aria-hidden className="pointer-events-none absolute -top-24 right-[10%] h-[340px] w-[340px] rounded-full bg-[#1852ac]/[0.08] blur-3xl" />

        <div className="relative mx-auto max-w-[1400px] px-4 pb-14 pt-12 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/" className="transition hover:text-[#1852ac]">Anasayfa</Link>
            <ChevronRight className="h-3 w-3 text-slate-300" aria-hidden />
            <Link href="/markalar" className="transition hover:text-[#1852ac]">Markalar</Link>
            <ChevronRight className="h-3 w-3 text-slate-300" aria-hidden />
            <span className="font-semibold text-[#1852ac]">{brand.name}</span>
          </nav>

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-center">
            {/* Logo / isim */}
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              {brand.logoUrl ? (
                <span className="relative block h-full w-full">
                  <Image src={brand.logoUrl} alt={brand.name} fill className="object-contain" sizes="72px" priority />
                </span>
              ) : (
                <span className="font-nx-heading text-2xl font-bold tracking-tight text-[#1852ac]">
                  {brand.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-nx-mono text-xs font-bold uppercase tracking-[0.25em] text-[#1852ac]">
                Yetkili tedarikçi
              </p>
              <h1 className="mt-2 font-nx-heading text-4xl font-bold tracking-tight text-[#1852ac] md:text-5xl">
                {brand.name}
              </h1>
              {brand.description && (
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">{brand.description}</p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9F1FC]">
                    <Package className="h-5 w-5 text-[#1852ac]" aria-hidden />
                  </span>
                  <div>
                    <p className="font-nx-heading text-xl font-bold text-[#1852ac]">
                      {productCount.toLocaleString("tr-TR")}
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Ürün</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <BadgeCheck className="h-6 w-6 text-nx-accent" aria-hidden />
                  <div>
                    <p className="text-sm font-bold text-[#1852ac]">Orijinal Ürün</p>
                    <p className="text-xs text-slate-500">Üretici garantisi</p>
                  </div>
                </div>
                {brand.websiteUrl && (
                  <a
                    href={brand.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1852ac] transition hover:text-nx-accent"
                  >
                    <Globe className="h-4 w-4" aria-hidden />
                    Resmi web sitesi
                  </a>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="flex shrink-0 flex-col gap-3">
              <Link
                href={`/katalog?brandSlug=${brand.slug}`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1852ac] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#12408a]"
              >
                Tüm ürünleri gör <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/teklif-iste"
                className="inline-flex items-center justify-center rounded-full border border-[#1852ac]/25 bg-white px-7 py-3.5 text-sm font-bold text-[#1852ac] transition hover:border-[#1852ac]"
              >
                Teklif İste
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Marka ürünleri ─── */}
      <BrandProducts brandSlug={brand.slug} />
    </div>
  )
}
