import Image from "next/image"
import Link from "next/link"
import { ImageOff, ArrowRight, Heart, Eye } from "lucide-react"
import type { PublicProduct } from "@/components/public/public-product-card"

/* ------------------------------------------------------------------ */
/*  ProductCardHorizontal                                               */
/* ------------------------------------------------------------------ */

export function ProductCardHorizontal({ product }: { product: PublicProduct }) {
  const imageUrl = product.images?.[0] ?? null

  return (
    <article
      className="group flex gap-4 bg-[#f4f7fa] rounded-[20px] p-3 hover:shadow-[0_8px_25px_rgba(187,187,187,0.5)] hover:-translate-y-0.5 transition-all duration-300 linear overflow-hidden"
    >
      {/* Image left */}
      <div className="relative w-24 h-24 bg-white rounded-[14px] flex-shrink-0 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="96px"
            className="object-contain p-2 transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageOff className="h-8 w-8 text-[#e0e0e0]" aria-hidden />
          </div>
        )}

        {/* Stock Badge */}
        {!product.stockStatus && (
          <div className="absolute top-1 left-1 z-10">
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[8px] font-bold text-white bg-[#a60811]">
              Tukendi
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-[14px]" />

        {/* Hover actions */}
        <div className="absolute top-1 right-1 flex flex-col gap-1 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button
            type="button"
            className="w-7 h-7 bg-white rounded-full shadow flex items-center justify-center text-[#453e71] hover:bg-[#0040a4] hover:text-white transition-all duration-200"
            aria-label={`${product.name} favorilere ekle`}
          >
            <Heart className="h-3 w-3" aria-hidden />
          </button>
          <Link
            href={`/katalog/${product.slug}`}
            className="w-7 h-7 bg-white rounded-full shadow flex items-center justify-center text-[#453e71] hover:bg-[#0040a4] hover:text-white transition-all duration-200"
            aria-label={`${product.name} detay`}
          >
            <Eye className="h-3 w-3" aria-hidden />
          </Link>
        </div>
      </div>

      {/* Details right */}
      <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
        <div>
          {product.brand && (
            <p className="text-[10px] font-bold text-[#bebebe] uppercase tracking-wider truncate">
              {product.brand.name}
            </p>
          )}
          <Link
            href={`/katalog/${product.slug}`}
            className="block font-semibold text-[#453e71] hover:text-[#0040a4] transition-colors leading-snug line-clamp-2 text-[13px] mt-0.5"
          >
            {product.name}
          </Link>
        </div>

        <div className="flex items-center justify-between mt-2">
          {product.category && (
            <span className="text-[10px] text-[#64748b] bg-[#eeeeee] px-2 py-0.5 rounded truncate max-w-[120px]">
              {product.category.name}
            </span>
          )}
          <Link
            href={`/katalog/${product.slug}`}
            className="rounded-full bg-[#0040a4] text-white w-10 h-10 flex items-center justify-center hover:bg-[#453e71] transition-colors flex-shrink-0 ml-auto"
            aria-label={`${product.name} detayina git`}
          >
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  )
}
