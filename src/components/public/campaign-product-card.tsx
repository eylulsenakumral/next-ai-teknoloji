"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Lock, ImageOff, Tag, Heart, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import type { PublicProduct } from "@/components/public/public-product-card"

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface CampaignInfo {
  discountPct?: number | null
  label?: string | null
  validUntil?: Date | string | null
}

export interface CampaignProductCardProps {
  product: PublicProduct
  campaign?: CampaignInfo
}

/* ------------------------------------------------------------------ */
/*  Badge helpers                                                       */
/* ------------------------------------------------------------------ */

function DiscountBadge({ discountPct, label }: { discountPct?: number | null; label?: string | null }) {
  if (discountPct && discountPct > 0) {
    return (
      <div className="absolute top-3 left-3 z-20 bg-[#0040a4] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
        -{Math.round(Number(discountPct))}%
      </div>
    )
  }
  if (label) {
    const isOutlet = label.toUpperCase().includes("OUTLET")
    return (
      <div
        className={cn(
          "absolute top-3 left-3 z-20 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm",
          isOutlet ? "bg-[#a60811]" : "bg-[#0040a4]"
        )}
      >
        {label}
      </div>
    )
  }
  return null
}

function SoldOutOverlay({ inStock }: { inStock: boolean }) {
  if (inStock) return null
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-t-[20px] z-10">
      <div className="w-20 h-20 bg-[#a60811] rounded-full flex items-center justify-center">
        <span className="text-white font-bold text-center text-sm">
          Stok<br />Yok
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  CampaignProductCard                                                 */
/* ------------------------------------------------------------------ */

export function CampaignProductCard({ product, campaign }: CampaignProductCardProps) {
  const router = useRouter()
  const { isAuthenticated, isAdmin } = useAuth()
  const showPrice = isAuthenticated || isAdmin
  const imageUrl = product.images?.[0] ?? null

  return (
    <article
      className={cn(
        "group relative bg-[#f4f7fa] rounded-[20px] flex flex-col overflow-hidden",
        "hover:shadow-[0_8px_25px_rgba(187,187,187,0.5)] hover:-translate-y-1",
        "transition-all duration-300 linear"
      )}
    >
      {/* Discount Badge */}
      <DiscountBadge discountPct={campaign?.discountPct} label={campaign?.label} />

      {/* Product Image */}
      <Link
        href={`/katalog/${product.slug}`}
        className="block relative aspect-square bg-white overflow-hidden rounded-t-[20px]"
        tabIndex={-1}
        aria-hidden
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-6 transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#f4f7fa]">
            <ImageOff className="h-14 w-14 text-[#e0e0e0]" aria-hidden />
          </div>
        )}

        {/* Sold Out Overlay */}
        <SoldOutOverlay inStock={product.stockStatus} />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

        {/* Hover Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
          <button
            type="button"
            className="w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center text-[#0040a4] hover:bg-[#0040a4] hover:text-white transition-all duration-200"
            aria-label={`${product.name} favorilere ekle`}
          >
            <Heart className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => router.push(`/katalog/${product.slug}`)}
            className="w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center text-[#0040a4] hover:bg-[#0040a4] hover:text-white transition-all duration-200"
            aria-label={`${product.name} hızlı bak`}
          >
            <Eye className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </Link>

      {/* Card Content */}
      <div className="flex flex-col flex-1 p-[10px] gap-2">
        {/* Brand */}
        {product.brand ? (
          <p className="text-[11px] font-bold text-[#bebebe] uppercase tracking-wider truncate">
            {product.brand.name}
          </p>
        ) : (
          <span className="h-4" />
        )}

        {/* Product Name */}
        <Link
          href={`/katalog/${product.slug}`}
          className="text-[13px] font-semibold text-[#0040a4] leading-snug line-clamp-2 hover:text-[#0040a4] transition-colors min-h-[40px]"
        >
          {product.name}
        </Link>

        {/* Category chip */}
        {product.category && (
          <div>
            <span className="inline-flex items-center gap-1 text-[10px] text-[#64748b] bg-[#eeeeee] px-2 py-0.5 rounded max-w-full truncate">
              <Tag className="h-2.5 w-2.5 shrink-0" aria-hidden />
              {product.category.name}
            </span>
          </div>
        )}

        {/* Price area - B2B model */}
        <div className="mt-auto">
          {campaign?.discountPct && campaign.discountPct > 0 ? (
            <p className="text-[12px] text-[#3b7300] font-bold mb-1.5">
              %{Math.round(Number(campaign.discountPct))} özel indirim
            </p>
          ) : null}

          {showPrice && ((product as any).manualPrice != null || (product as any).salePriceExVat != null) ? (
            <Link
              href={`/katalog/${product.slug}`}
              className="flex flex-col items-center justify-center gap-0.5 py-2.5 px-4 rounded-lg w-full bg-[#0040a4] hover:bg-[#003080] transition-all duration-300"
            >
              {(() => {
                const p = product as any
                const price = p.manualPrice != null ? p.manualPrice : p.salePriceExVat
                const curr = p.manualPrice != null ? (p.manualPriceCurrency || "USD") : (p.currency || "USD")
                const vatRate = 0.20
                const priceIncVat = price * (1 + vatRate)
                return (
                  <>
                    <span className="text-[14px] font-bold text-white">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: curr, minimumFractionDigits: 2 }).format(price)}
                      <span className="text-[10px] font-normal text-white/70 ml-1">+KDV</span>
                    </span>
                    <span className="text-[10px] text-white/70">
                      KDV Dahil: {new Intl.NumberFormat("en-US", { style: "currency", currency: curr, minimumFractionDigits: 2 }).format(priceIncVat)}
                    </span>
                  </>
                )
              })()}
            </Link>
          ) : showPrice ? (
            <Link
              href={`/katalog/${product.slug}`}
              className="flex items-center justify-center gap-1.5 h-10 px-4 text-[11px] font-semibold rounded-lg w-full bg-[#0040a4] text-white hover:bg-[#003080] transition-all duration-300"
            >
              Fiyatı Gör
            </Link>
          ) : (
            <Link
              href="/login"
              className={cn(
                "flex items-center justify-center gap-1.5 h-10 px-4 text-[11px] font-semibold rounded-lg w-full",
                "border border-[#0040a4]/30 bg-[#0040a4]/5 text-[#0040a4] hover:bg-[#0040a4]/10 hover:underline transition-all duration-300"
              )}
            >
              <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Özel Fiyatlar İçin Bayi Girişi Yapınız
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
