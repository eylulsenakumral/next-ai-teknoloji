"use client"

import Link from "next/link"
import Image from "next/image"
import { CheckCircle2, XCircle, MessageCircle, ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface PublicProduct {
  id: string
  name: string
  slug: string
  images: string[]
  description?: string | null
  brand: { name: string; slug: string } | null
  category: { name: string; slug: string } | null
  stockStatus: boolean
}

/* ------------------------------------------------------------------ */
/*  StockBadge                                                          */
/* ------------------------------------------------------------------ */

function StockBadge({ inStock }: { inStock: boolean }) {
  if (inStock) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"
        aria-label="Stokta mevcut"
      >
        <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />
        Stokta
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full"
      aria-label="Stok tükendi"
    >
      <XCircle className="h-3 w-3 shrink-0" aria-hidden />
      Tükendi
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Card (Grid view)                                                    */
/* ------------------------------------------------------------------ */

export function PublicProductCard({ product }: { product: PublicProduct }) {
  const imageUrl = product.images?.[0] ?? null
  const shortDesc = product.description
    ? product.description.slice(0, 80).trim() + (product.description.length > 80 ? "…" : "")
    : null

  return (
    <article
      className={cn(
        "group bg-[#f3f3f3] rounded-2xl flex flex-col",
        "hover:shadow-lg transition-all duration-300"
      )}
    >
      {/* Ürün Görseli */}
      <Link
        href={`/katalog/${product.slug}`}
        className="block relative aspect-square bg-white overflow-hidden rounded-t-2xl"
        tabIndex={-1}
        aria-hidden
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#f9f9f9]">
            <ImageOff className="h-14 w-14 text-[#e0e0e0]" aria-hidden />
          </div>
        )}

        {/* Stok overlay badge (üst köşe) */}
        <div className="absolute top-2 left-2">
          <StockBadge inStock={product.stockStatus} />
        </div>
      </Link>

      {/* Kart İçeriği */}
      <div className="flex flex-col flex-1 p-3.5 gap-2">
        {/* Marka */}
        {product.brand ? (
          <p className="text-[11px] font-bold text-[#999999] uppercase tracking-wider truncate">
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

        {/* Kısa açıklama */}
        {shortDesc && (
          <p className="text-[12px] text-[#999999] leading-snug line-clamp-2 flex-1">
            {shortDesc}
          </p>
        )}

        {/* Kategori chip */}
        {product.category && (
          <div>
            <span className="inline-block text-[10px] text-[#767676] bg-[#f5f5f5] px-2 py-0.5 rounded max-w-full truncate">
              {product.category.name}
            </span>
          </div>
        )}

        {/* CTA */}
        <a
          href={`https://wa.me/905529895959?text=${encodeURIComponent(`Merhaba, ${product.name} ürünü hakkında bilgi almak istiyorum.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "mt-auto flex items-center justify-center gap-2 h-9 px-4 text-[12px] font-bold capitalize tracking-wider transition-all duration-300 rounded-lg",
            "bg-[#2189ff] text-white hover:bg-[#1e1e1e]",
            "w-full"
          )}
        >
          <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Teklif İste
        </a>
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ */
/*  List Item (List view)                                               */
/* ------------------------------------------------------------------ */

export function PublicProductListItem({ product }: { product: PublicProduct }) {
  const imageUrl = product.images?.[0] ?? null
  const shortDesc = product.description
    ? product.description.slice(0, 120).trim() + (product.description.length > 120 ? "…" : "")
    : null

  return (
    <article className="group flex items-start gap-4 p-4 bg-[#f3f3f3] rounded-lg hover:shadow-md transition-all duration-300">
      {/* Görsel */}
      <Link
        href={`/katalog/${product.slug}`}
        className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-white border border-[#eeeeee] overflow-hidden"
        tabIndex={-1}
        aria-hidden
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="96px"
            className="object-contain p-2 transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#f9f9f9]">
            <ImageOff className="h-8 w-8 text-[#e0e0e0]" aria-hidden />
          </div>
        )}
      </Link>

      {/* Bilgiler */}
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          {product.brand && (
            <p className="text-[11px] font-bold text-[#999999] uppercase tracking-wider">
              {product.brand.name}
            </p>
          )}
          <Link
            href={`/katalog/${product.slug}`}
            className="block text-[14px] font-semibold text-[#1e1e1e] hover:text-[#2189ff] transition-colors leading-snug line-clamp-2"
          >
            {product.name}
          </Link>
          {shortDesc && (
            <p className="text-[12px] text-[#999999] leading-snug line-clamp-1">
              {shortDesc}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {product.category && (
              <span className="text-[11px] text-[#767676] bg-[#f5f5f5] px-2 py-0.5 rounded">
                {product.category.name}
              </span>
            )}
            <StockBadge inStock={product.stockStatus} />
          </div>
        </div>

        {/* CTA */}
        <div className="shrink-0">
          <a
            href={`https://wa.me/905529895959?text=${encodeURIComponent(`Merhaba, ${product.name} ürünü hakkında bilgi almak istiyorum.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#2189ff] text-[12px] font-bold text-white capitalize tracking-wider hover:bg-[#1e1e1e] transition-all duration-300 whitespace-nowrap rounded-lg"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            Teklif İste
          </a>
        </div>
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ */
/*  Skeletons                                                           */
/* ------------------------------------------------------------------ */

export function PublicProductCardSkeleton() {
  return (
    <div className="bg-[#f3f3f3] rounded-2xl flex flex-col animate-pulse">
      <Skeleton className="aspect-square w-full rounded-t-2xl" />
      <div className="p-3.5 space-y-2.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-5 w-20 rounded" />
        <Skeleton className="h-9 w-full mt-1" />
      </div>
    </div>
  )
}

export function PublicProductListItemSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 animate-pulse bg-[#f3f3f3] rounded-lg">
      <Skeleton className="w-24 h-24 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  )
}
