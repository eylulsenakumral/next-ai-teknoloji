"use client"

import { useState } from "react"
import Link from "next/link"
import { Package, Lock, Heart, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { formatCurrency } from "@/lib/utils/format"

interface PublicProductCardProduct {
  id: string
  name: string
  slug: string
  images: string[]
  brand: { name: string; slug: string } | null
  category: { name: string; slug: string } | null
  stockStatus: boolean
  price?: number | null
  currency?: string
}

interface PublicProductCardProps {
  product: PublicProductCardProduct
}

function ProductImage({ src, alt }: { src?: string; alt: string }) {
  const [errored, setErrored] = useState(false)

  if (!src || errored) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <Package className="h-12 w-12 text-[#eeeeee]" aria-hidden />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
      onError={() => setErrored(true)}
    />
  )
}

export function PublicProductCard({ product }: PublicProductCardProps) {
  const mainImage = product.images[0]
  const href = `/katalog/${product.slug}`
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth()

  // Show price for authenticated dealers and admin users
  const showPrice = (isAuthenticated || isAdmin) && product.price !== null && product.price !== undefined

  return (
    <article
      className={cn(
        "group relative flex flex-col bg-[#f3f3f3] rounded-[20px] overflow-hidden",
        "hover:shadow-[0_8px_25px_rgba(187,187,187,0.5)] hover:-translate-y-1",
        "transition-all duration-300 linear"
      )}
    >
      {/* Image */}
      <Link
        href={href}
        className="relative block overflow-hidden bg-white rounded-t-[20px]"
        style={{ aspectRatio: "1 / 1" }}
        aria-label={product.name}
      >
        <ProductImage src={mainImage} alt={product.name} />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />

        {/* Hover Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
          <button
            type="button"
            className="w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center text-[#1e1e1e] hover:bg-[#0040a4] hover:text-white transition-all duration-200"
            aria-label={`${product.name} favorilere ekle`}
          >
            <Heart className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className="w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center text-[#1e1e1e] hover:bg-[#0040a4] hover:text-white transition-all duration-200"
            aria-label={`${product.name} hızlı bak`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              window.location.href = href
            }}
          >
            <Eye className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {/* Stock Badge */}
        {!product.stockStatus && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold text-white bg-[#a60811]">
              Tükendi
            </span>
          </div>
        )}

        {/* Sold Out Overlay */}
        {!product.stockStatus && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-t-[20px]">
            <div className="w-20 h-20 bg-[#a60811] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-center text-sm">
                Sold<br />Out
              </span>
            </div>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col gap-1 p-[10px]">
        {/* Brand */}
        {product.brand && (
          <p className="text-[11px] font-bold text-[#bebebe] uppercase tracking-wider truncate">
            {product.brand.name}
          </p>
        )}

        {/* Product Name */}
        <Link
          href={href}
          className={cn(
            "text-[13px] leading-snug line-clamp-2 hover:text-[#0040a4] transition-colors min-h-[2.4rem]",
            product.stockStatus ? "font-semibold text-[#1e1e1e]" : "text-[#767676]"
          )}
        >
          {product.name}
        </Link>

        {/* Price or Login CTA */}
        {!authLoading && (
          <div className="mt-1">
            {showPrice && product.price !== null && product.price !== undefined ? (
              <p className="text-[16px] font-bold text-[#3b7300] leading-tight">
                {formatCurrency(product.price, product.currency || "TRY")}
              </p>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#0040a4]/30 bg-[#0040a4]/5 px-2 py-1 text-[11px] font-medium text-[#0040a4] hover:bg-[#0040a4]/10 transition-colors"
              >
                <Lock className="h-3.5 w-3.5" aria-hidden />
                Özel Fiyatlar İçin Bayi Girişi Yapınız
              </Link>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
