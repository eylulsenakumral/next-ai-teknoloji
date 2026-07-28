import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { CampaignProductCard } from "@/components/public/campaign-product-card"
import type { PublicProduct } from "@/components/public/public-product-card"

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface CampaignProduct extends PublicProduct {
  campaignDiscountPct?: number | null
  campaignLabel?: string | null
  manualPrice?: number | null
  manualPriceCurrency?: string | null
  salePriceExVat?: number | null
  salePriceIncVat?: number | null
  currency?: string | null
}

export interface CampaignSectionProps {
  title: string
  subtitle?: string
  products: CampaignProduct[]
  viewAllHref?: string
}

/* ------------------------------------------------------------------ */
/*  CampaignSection                                                     */
/* ------------------------------------------------------------------ */

export function CampaignSection({
  title,
  subtitle,
  products,
  viewAllHref,
}: CampaignSectionProps) {
  if (products.length === 0) return null

  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-primary)] tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors flex items-center gap-1 group"
          >
            Tümünü Gör
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[30px]">
        {products.map((product) => (
          <CampaignProductCard
            key={product.id}
            product={product}
            campaign={{
              discountPct: product.campaignDiscountPct,
              label: product.campaignLabel,
            }}
          />
        ))}
      </div>
    </section>
  )
}
