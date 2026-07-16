export const dynamic = 'force-dynamic'

import Link from "next/link"
import Image from "next/image"
import { ChevronRight, Tag, Package } from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface CampaignSet {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  type: "OUTLET" | "FEATURED" | "BUNDLE"
  discountPct: string | null
  validFrom: string | null
  validUntil: string | null
  isActive: boolean
  sortOrder: number
  products: Array<{
    id: string
    label: string | null
    product: {
      id: string
      name: string
      slug: string
      images: string[]
    }
  }>
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const TYPE_LABELS: Record<string, string> = {
  FEATURED: "Öne Çıkan",
  OUTLET: "Outlet",
  BUNDLE: "Paket",
}

const TYPE_COLORS: Record<string, string> = {
  FEATURED: "bg-[var(--color-primary)] text-white",
  OUTLET: "bg-[var(--color-error)] text-white",
  BUNDLE: "bg-[#3b7300] text-white",
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(dateStr))
}

/* ------------------------------------------------------------------ */
/*  Campaign Card                                                       */
/* ------------------------------------------------------------------ */

function CampaignCard({ campaign }: { campaign: CampaignSet }) {
  const previewImages = campaign.products
    .slice(0, 4)
    .map((p) => p.product.images?.[0])
    .filter(Boolean) as string[]

  const discountPct = campaign.discountPct ? Math.round(Number(campaign.discountPct)) : null
  const validUntilStr = formatDate(campaign.validUntil)

  return (
    <Link
      href={`/kampanya/${campaign.slug}`}
      className="group block bg-[var(--color-background)] rounded-[20px] overflow-hidden hover:shadow-xl hover:shadow-gray-400/20 hover:-translate-y-1 transition-all duration-300"
    >
      {/* Banner image or grid preview */}
      <div className="relative aspect-[16/7] bg-white overflow-hidden">
        {campaign.imageUrl ? (
          <Image
            src={campaign.imageUrl}
            alt={campaign.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : previewImages.length > 0 ? (
          <div className="grid grid-cols-4 h-full">
            {previewImages.slice(0, 4).map((img, i) => (
              <div key={i} className="relative bg-[var(--color-background)] border-r border-white last:border-0">
                <Image
                  src={img}
                  alt=""
                  fill
                  sizes="25vw"
                  className="object-contain p-3"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="h-16 w-16 text-[#e0e0e0]" aria-hidden />
          </div>
        )}

        {/* Type badge */}
        <span className={`absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-md ${TYPE_COLORS[campaign.type] ?? "bg-[var(--color-primary)] text-white"}`}>
          {TYPE_LABELS[campaign.type] ?? campaign.type}
        </span>

        {/* Discount badge */}
        {discountPct ? (
          <span className="absolute top-3 right-3 bg-white text-[var(--color-primary)] text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm">
            %{discountPct} İndirim
          </span>
        ) : null}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-base font-bold text-[var(--color-primary)] group-hover:text-[var(--color-primary)] transition-colors leading-snug mb-2">
          {campaign.name}
        </h3>
        {campaign.description && (
          <p className="text-[13px] text-[var(--color-text-muted)] line-clamp-2 leading-relaxed mb-3">
            {campaign.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
              <Tag className="h-3 w-3" aria-hidden />
              {campaign.products.length} ürün
            </span>
            {validUntilStr && (
              <span className="text-[11px] text-[var(--color-error)] font-semibold">
                Son: {validUntilStr}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--color-primary)] group-hover:translate-x-0.5 transition-transform">
            İncele
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default async function KampanyaPage() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  let campaigns: CampaignSet[] = []
  try {
    const res = await fetch(`${baseUrl}/api/public/campaigns?limit=50`, {
      next: { revalidate: 60 },
    })
    if (res.ok) {
      const json = await res.json()
      campaigns = json.data ?? []
    }
  } catch {
    // API erişilemezse boş sayfa göster
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Page Header */}
      <div className="bg-[var(--color-background)] border-b border-[var(--color-border)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <nav className="flex items-center gap-2 text-[12px] text-[var(--color-text-muted)] mb-4">
            <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">Ana Sayfa</Link>
            <ChevronRight className="h-3 w-3" aria-hidden />
            <span className="text-[var(--color-primary)] font-semibold">Kampanyalar</span>
          </nav>
          <h1 className="text-[32px] font-bold text-[var(--color-primary)] leading-tight">
            Kampanyalar
          </h1>
          <p className="text-[15px] text-[var(--color-text-muted)] mt-2">
            Özel fırsatlar ve indirimli ürünleri keşfedin
          </p>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4 border-2 border-dashed border-gray-300 rounded-[20px] bg-[var(--color-background)]/50">
            <Tag className="h-12 w-12 text-gray-400" aria-hidden />
            <div>
              <p className="text-base font-semibold text-gray-600">Aktif kampanya bulunamadı.</p>
              <p className="text-sm text-gray-500 mt-1">Lütfen daha sonra tekrar kontrol edin.</p>
            </div>
            <Link
              href="/katalog"
              className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white font-bold px-6 py-2.5 rounded-lg hover:bg-[var(--color-primary)] transition-colors text-sm"
            >
              Kataloga Git
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[30px]">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
