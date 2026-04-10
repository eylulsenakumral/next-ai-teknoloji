"use client"

import { useState } from "react"
import Link from "next/link"
import { Package, LogIn } from "lucide-react"
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
      className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
      onError={() => setErrored(true)}
    />
  )
}

export function PublicProductCard({ product }: PublicProductCardProps) {
  const mainImage = product.images[0]
  const href = `/katalog/${product.slug}`
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // Show price only for authenticated dealers
  const showPrice = isAuthenticated && product.price !== null && product.price !== undefined

  return (
    <article className="group relative flex flex-col bg-white">
      {/* Görsel */}
      <Link
        href={href}
        className="relative block overflow-hidden bg-[#f9f9f9] rounded-xl"
        style={{ aspectRatio: "1 / 1" }}
        aria-label={product.name}
      >
        <ProductImage src={mainImage} alt={product.name} />

        {/* Hover overlay */}
        <div
          className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
          aria-hidden
        />

        {/* Stok badge */}
        {!product.stockStatus && (
          <span className="absolute top-2 left-2 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white bg-[#767676]">
            TÜKENDI
          </span>
        )}
      </Link>

      {/* İçerik */}
      <div className="flex flex-col gap-1 pt-2.5 pb-1 px-0.5">
        {/* Marka */}
        {product.brand && (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#00179e] truncate">
            {product.brand.name}
          </p>
        )}

        {/* Ürün adı */}
        <Link
          href={href}
          className={cn(
            "text-[13px] leading-snug line-clamp-2 hover:text-[#00179e] transition-colors min-h-[2.4rem]",
            product.stockStatus ? "text-[#333333]" : "text-[#767676]"
          )}
        >
          {product.name}
        </Link>

        {/* Fiyat veya Giriş Çağrısı */}
        {!authLoading && (
          <div className="mt-1">
            {showPrice && product.price !== null && product.price !== undefined ? (
              <p className="text-[16px] font-bold text-[#333333] leading-tight">
                {formatCurrency(product.price, product.currency || "TRY")}
              </p>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#00179e]/30 bg-[#00179e]/5 px-2 py-1 text-[11px] font-medium text-[#00179e] hover:bg-[#00179e]/10 transition-colors"
              >
                <LogIn className="h-3 w-3" aria-hidden />
                {isAuthenticated ? "Fiyat görüntülenemiyor" : "Fiyat için giriş yapın"}
              </Link>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
