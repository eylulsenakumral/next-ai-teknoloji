"use client"

import Link from "next/link"
import Image from "next/image"
import { MessageCircle, ImageOff, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
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

function SaleBadge({ discountPct, label }: { discountPct?: number | null; label?: string | null }) {
  if (discountPct && discountPct > 0) {
    return (
      <span className="absolute top-2 right-2 z-10 bg-[#2189ff] text-white text-[11px] font-bold px-2 py-0.5 rounded-md leading-tight">
        %{Math.round(Number(discountPct))} İndirim
      </span>
    )
  }
  if (label) {
    const isOutlet = label.toUpperCase().includes("OUTLET")
    return (
      <span
        className={cn(
          "absolute top-2 right-2 z-10 text-white text-[11px] font-bold px-2 py-0.5 rounded-md leading-tight",
          isOutlet ? "bg-[#a60811]" : "bg-[#2189ff]"
        )}
      >
        {label}
      </span>
    )
  }
  return null
}

/* ------------------------------------------------------------------ */
/*  CampaignProductCard                                                 */
/* ------------------------------------------------------------------ */

export function CampaignProductCard({ product, campaign }: CampaignProductCardProps) {
  const imageUrl = product.images?.[0] ?? null

  return (
    <article
      className={cn(
        "group relative bg-[#f3f3f3] rounded-[20px] flex flex-col",
        "hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      )}
    >
      {/* Sale Badge */}
      <SaleBadge discountPct={campaign?.discountPct} label={campaign?.label} />

      {/* Ürün Görseli */}
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
            className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#f9f9f9]">
            <ImageOff className="h-14 w-14 text-[#e0e0e0]" aria-hidden />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </Link>

      {/* Kart İçeriği */}
      <div className="flex flex-col flex-1 px-3.5 pt-[10px] pb-3.5 gap-2">
        {/* Marka */}
        {product.brand ? (
          <p className="text-[11px] font-bold text-[#bebebe] uppercase tracking-wider truncate">
            {product.brand.name}
          </p>
        ) : (
          <span className="h-4" />
        )}

        {/* Ürün Adı */}
        <Link
          href={`/katalog/${product.slug}`}
          className="text-[13px] font-semibold text-[#1e1e1e] leading-snug line-clamp-2 hover:text-[#2189ff] transition-colors min-h-[40px]"
        >
          {product.name}
        </Link>

        {/* Kategori chip */}
        {product.category && (
          <div>
            <span className="inline-flex items-center gap-1 text-[10px] text-[#767676] bg-[#eeeeee] px-2 py-0.5 rounded max-w-full truncate">
              <Tag className="h-2.5 w-2.5 shrink-0" aria-hidden />
              {product.category.name}
            </span>
          </div>
        )}

        {/* Fiyat alanı - B2B model */}
        <div className="mt-auto">
          {campaign?.discountPct && campaign.discountPct > 0 ? (
            <p className="text-[12px] text-[#3b7300] font-bold mb-1">
              %{Math.round(Number(campaign.discountPct))} özel indirim
            </p>
          ) : null}

          {/* CTA */}
          <a
            href={`https://wa.me/905529895959?text=${encodeURIComponent(`Merhaba, ${product.name} ürünü hakkında bilgi almak istiyorum.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center justify-center gap-2 h-9 px-4 text-[12px] font-bold capitalize tracking-wider transition-all duration-300 rounded-lg",
              "bg-[#2189ff] text-white hover:bg-[#1e1e1e]",
              "w-full"
            )}
          >
            <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Teklif İste
          </a>
        </div>
      </div>
    </article>
  )
}
