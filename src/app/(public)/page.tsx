import type { Metadata } from "next"
import { prisma } from "@/lib/db"
import { getSiteConfig, getLiveCounts } from "@/lib/settings"
import { HomeHero, type MarqueeBrand } from "./home-hero"
import { CategoryStrip, type HeroCard } from "./category-strip"
import { FALLBACK_CARDS } from "./home-content"
import { AboutSection } from "./sections/about-section"
import { PartnersSection } from "./sections/partners-section"
import { WhySection } from "./sections/why-section"
import { ProcessSection } from "./sections/process-section"
import { TestimonialsSection } from "./sections/testimonials-section"
import { FaqSection } from "./sections/faq-section"
import { BlogSection } from "./sections/blog-section"

export const metadata: Metadata = {
  title: "nexadepo — Güvenlik & Network Sistemleri",
  description:
    "B2B güvenlik ve network tedarik platformu. Güvenlik kamerası, ağ altyapısı, alarm sistemleri, switch ve yazılım. Proje bazlı teklif, bayi avantajları.",
  alternates: { canonical: "/" },
}

// Kategori şeridi DB'den beslenir — saatte bir yenilenir (ISR)
export const revalidate = 3600

/** Hero kategori şeridi — ilk 7 aktif ana kategori (Pasif Ürünler sortOrder 99 ile dışarıda kalır) */
async function getHeroCategories(): Promise<HeroCard[]> {
  try {
    const cats = await prisma.category.findMany({
      where: { isActive: true, deletedAt: null, parentId: null },
      orderBy: { sortOrder: "asc" },
      take: 7,
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

// Gerçek marka olmayan kayıtlar (markalar sayfasıyla aynı liste)
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

/** Hero marquee — ürünü olan markalardan en çok ürünü olan 12'si + toplam marka sayısı */
async function getHomeBrands(): Promise<{ marquee: MarqueeBrand[]; brandCount: number }> {
  try {
    const brands = await prisma.brand.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        name: { notIn: HIDDEN_BRANDS },
        products: { some: { isActive: true, deletedAt: null } },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { products: { where: { isActive: true, deletedAt: null } } } },
      },
    })
    const mapped = brands
      .map((b) => ({ id: b.id, name: b.name, slug: b.slug, productCount: b._count.products }))
      .sort((a, b) => b.productCount - a.productCount)
    return { marquee: mapped.slice(0, 12), brandCount: mapped.length }
  } catch {
    return { marquee: [], brandCount: 0 }
  }
}

export default async function VitrinPage() {
  const [categories, productCount, liveCounts, siteConfig, homeBrands] = await Promise.all([
    getHeroCategories(),
    prisma.product
      .count({ where: { isActive: true, deletedAt: null } })
      .catch(() => 0),
    getLiveCounts().catch(() => null),
    getSiteConfig().catch(() => null),
    getHomeBrands(),
  ])

  const stats: [string, string][] | undefined = liveCounts
    ? [
        [`${liveCounts.customerCount}+`, "Aktif Bayi"],
        [liveCounts.productCountFormatted, "Teknik Ürün"],
        [`${liveCounts.brandCount}+`, "Marka Partneri"],
      ]
    : undefined

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig?.name ?? "Next AI Teknoloji — nexadepo",
    url: siteConfig?.url ?? "https://nexadepo.com",
    logo: siteConfig?.url ? `${siteConfig.url}/images/logo-dark.png` : "https://nexadepo.com/images/logo-dark.png",
    description: siteConfig?.description ?? "B2B güvenlik ve network tedarik platformu.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: siteConfig?.phone ?? "+90-552-989-59-59",
      contactType: "sales",
      areaServed: "TR",
      availableLanguage: "tr",
    },
  }
  const siteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig?.name ?? "nexadepo",
    url: siteConfig?.url ?? "https://nexadepo.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig?.url ?? "https://nexadepo.com"}/katalog?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  return (
    <div className="bg-[#F5F5F5] font-nx-sans text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }}
      />
      <HomeHero total={productCount} brandCount={homeBrands.brandCount} brands={homeBrands.marquee} />
      <section className="bg-[linear-gradient(180deg,#E9F1FC_0%,#FFFFFF_100%)] px-5 md:px-8">
        <div className="mx-auto max-w-[1300px]">
          <CategoryStrip categories={categories} />
        </div>
      </section>

      <AboutSection stats={stats} />
      <PartnersSection />
      <WhySection />
      <ProcessSection />
      <TestimonialsSection stats={stats} />
      <FaqSection />
      <BlogSection />
    </div>
  )
}
