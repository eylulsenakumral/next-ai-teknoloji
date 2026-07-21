import type { Metadata } from "next"
import { prisma } from "@/lib/db"
import { HeroCarousel } from "./hero-carousel"
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

export default async function VitrinPage() {
  const categories = await getHeroCategories()

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Next AI Teknoloji — nexadepo",
    url: "https://nexadepo.com",
    logo: "https://nexadepo.com/images/logo-dark.png",
    description:
      "B2B güvenlik ve network tedarik platformu. 27+ global markanın yetkili tedarikçisi.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+90-552-989-59-59",
      contactType: "sales",
      areaServed: "TR",
      availableLanguage: "tr",
    },
  }
  const siteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "nexadepo",
    url: "https://nexadepo.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://nexadepo.com/katalog?search={search_term_string}",
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
      {/* ─── HERO (carousel) ──────────────────────────────────── */}
      <HeroCarousel />

      {/* ─── CATEGORY STRIP — DB'den tüm kategoriler, 5'li sayfalar + sağ/sol ok ─── */}
      {/* Gradyan: hero'nun tonundan About'un beyazına yumuşak geçiş */}
      <section className="bg-[linear-gradient(180deg,#E9F1FC_0%,#FFFFFF_100%)] px-5 md:px-8">
        <div className="mx-auto max-w-[1300px]">
          <CategoryStrip categories={categories} />
        </div>
      </section>

      <AboutSection />
      <PartnersSection />
      <WhySection />
      <ProcessSection />
      <TestimonialsSection />
      <FaqSection />
      <BlogSection />
    </div>
  )
}
