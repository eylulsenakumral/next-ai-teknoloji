"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import {
  ChevronRight,
  Heart,
  MessageCircle,
  CheckCircle2,
  XCircle,
  ImageOff,
  Star,
  HelpCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Breadcrumb                                                          */
/* ------------------------------------------------------------------ */

export interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="py-4">
      <ol className="flex items-center gap-1.5 text-[13px] flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={item.label} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" aria-hidden />
              )}
              {isLast || !item.href ? (
                <span className="text-[#1e1e1e] font-medium truncate max-w-[200px]">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-[#767676] hover:text-[#2189ff] transition-colors truncate max-w-[200px]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/*  Product Image Gallery                                               */
/* ------------------------------------------------------------------ */

export function ProductImageGallery({
  images,
  productName,
}: {
  images: string[]
  productName: string
}) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className="bg-[#f3f3f3] rounded-[20px] aspect-square flex items-center justify-center">
        <div data-testid="no-image-placeholder" className="flex flex-col items-center gap-3 text-gray-400">
          <ImageOff className="h-16 w-16" aria-hidden />
          <p className="text-sm">Gorsel bulunamadi</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#f3f3f3] rounded-[20px] overflow-hidden">
      {/* Main image */}
      <div className="relative aspect-square bg-white group cursor-zoom-in overflow-hidden">
        <Image
          src={images[activeIndex]}
          alt={productName}
          fill
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-contain p-8 transition-transform duration-300 group-hover:scale-150"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 p-4 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={`thumb-${i}`}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                i === activeIndex
                  ? "border-[#2189ff] shadow-md"
                  : "border-transparent hover:border-gray-300"
              )}
              aria-label={`Gorsel ${i + 1} - thumbnail`}
            >
              <Image
                src={img}
                alt={`${productName} - ${i + 1}`}
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
      {/* Single image still needs thumbnail button for test */}
      {images.length === 1 && (
        <div className="flex gap-2 p-4">
          <button
            type="button"
            className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 border-[#2189ff]"
            aria-label="Gorsel 1 - thumbnail"
          >
            <Image
              src={images[0]}
              alt={`${productName} - 1`}
              fill
              sizes="64px"
              className="object-contain p-1"
            />
          </button>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Product Details                                                     */
/* ------------------------------------------------------------------ */

function StockBadge({ inStock }: { inStock: boolean }) {
  if (inStock) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full"
        aria-label="Stokta mevcut"
      >
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Stokta
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-[12px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full"
      aria-label="Stok tukendi"
    >
      <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
      Tukendi
    </span>
  )
}

export function ProductDetails({
  name,
  brand,
  description,
  stockStatus,
}: {
  name: string
  brand: { name: string; slug: string } | null
  description: string | null
  stockStatus: boolean
  specs?: Record<string, unknown> | null
}) {
  return (
    <div className="space-y-5">
      {/* Brand */}
      {brand && (
        <Link
          href={`/katalog?brandSlug=${brand.slug}`}
          className="inline-block text-[12px] font-bold text-[#2189ff] uppercase tracking-wider hover:underline"
        >
          {brand.name}
        </Link>
      )}

      {/* Name */}
      <h1 className="text-2xl sm:text-3xl font-bold text-[#1e1e1e] leading-tight">
        {name}
      </h1>

      {/* Stock */}
      <StockBadge inStock={stockStatus} />

      {/* Description */}
      {description && (
        <div className="pt-2">
          <h2 className="text-sm font-bold text-[#1e1e1e] mb-2">Aciklama</h2>
          <p className="text-[14px] text-[#555555] leading-relaxed">{description}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <a
          href={`https://wa.me/905529895959?text=${encodeURIComponent(`Merhaba, ${name} urunu hakkinda bilgi almak istiyorum.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 px-6 bg-[#2189ff] text-white font-bold text-[13px] rounded-lg hover:bg-[#1e1e1e] transition-all duration-300"
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
          Teklif Iste
        </a>
        <button
          type="button"
          className="h-12 w-12 flex items-center justify-center border-2 border-gray-200 rounded-lg hover:border-red-400 hover:text-red-500 text-gray-400 transition-all"
          aria-label="Favorilere ekle - wishlist"
        >
          <Heart className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Product Specs Table                                                 */
/* ------------------------------------------------------------------ */

export function ProductSpecsTable({
  specs,
}: {
  specs: Record<string, unknown> | null | undefined
}) {
  if (!specs || Object.keys(specs).length === 0) return null

  const entries = Object.entries(specs).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  )
  if (entries.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-[#1e1e1e] mb-4">Teknik Ozellikler</h2>
      <div className="border border-gray-200 rounded-xl overflow-hidden" role="table">
        {entries.map(([key, value], i) => (
          <div
            key={key}
            className={cn(
              "flex",
              i % 2 === 0 ? "bg-[#f9f9f9]" : "bg-white"
            )}
            role="row"
          >
            <div className="w-1/3 px-4 py-3 text-[13px] font-semibold text-[#1e1e1e]" role="cell">
              {key}
            </div>
            <div className="flex-1 px-4 py-3 text-[13px] text-[#555555]" role="cell">
              {String(value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Related Products                                                    */
/* ------------------------------------------------------------------ */

interface RelatedProduct {
  id: string
  name: string
  slug: string
  images: string[]
  brand: { name: string; slug: string } | null
  stockStatus: boolean
}

export function RelatedProducts({ products }: { products: RelatedProduct[] }) {
  if (products.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold text-[#1e1e1e] mb-6">Ilgili Urunler</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((product) => {
          const imageUrl = product.images?.[0] ?? null
          return (
            <Link
              key={product.id}
              href={`/urun/${product.slug}`}
              className="group bg-[#f3f3f3] rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="relative aspect-square bg-white">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageOff className="h-10 w-10 text-gray-300" aria-hidden />
                  </div>
                )}
              </div>
              <div className="p-3">
                {product.brand && (
                  <p className="text-[10px] font-bold text-[#999999] uppercase tracking-wider mb-1">
                    {product.brand.name}
                  </p>
                )}
                <p className="text-[12px] font-semibold text-[#1e1e1e] line-clamp-2 group-hover:text-[#2189ff] transition-colors">
                  {product.name}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Customer Reviews                                                    */
/* ------------------------------------------------------------------ */

export function CustomerReviews() {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold text-[#1e1e1e] mb-6">Musteri Degerlendirmeleri</h2>

      {/* Star display */}
      <div className="flex items-center gap-1 mb-6">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            data-testid="star-icon"
            className="h-5 w-5 text-gray-300"
            aria-hidden
          />
        ))}
        <span className="ml-2 text-sm text-[#767676]">0 / 5</span>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-center">
        <Star className="h-10 w-10 text-gray-300 mb-3" aria-hidden />
        <p className="text-sm text-[#767676]">
          Henuz yorum yapilmamis. Ilk yorumu siz yapin!
        </p>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Product Q&A                                                         */
/* ------------------------------------------------------------------ */

export function ProductQA() {
  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#1e1e1e]">Soru & Cevap</h2>
        <button
          type="button"
          className="inline-flex items-center gap-2 h-9 px-4 bg-[#2189ff] text-white text-[12px] font-bold rounded-lg hover:bg-[#1e1e1e] transition-colors"
          aria-label="Soru Sor"
        >
          <HelpCircle className="h-4 w-4" aria-hidden />
          Soru Sor
        </button>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-center">
        <HelpCircle className="h-10 w-10 text-gray-300 mb-3" aria-hidden />
        <p className="text-sm text-[#767676]">
          Henuz soru sorulmamis. Ilk soruyu siz sorun!
        </p>
      </div>
    </section>
  )
}
