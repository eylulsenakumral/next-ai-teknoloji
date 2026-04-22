"use client"

import Link from "next/link"
import Image from "next/image"
import {
  Package,
  ImageOff,
  Lock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

/* ------------------------------------------------------------------ */
/*  Category Banner                                                     */
/* ------------------------------------------------------------------ */

export function CategoryBanner({
  title,
  image,
  productCount,
}: {
  title: string
  image: string
  productCount?: number
}) {
  return (
    <div className="relative h-[200px] sm:h-[260px] overflow-hidden">
      <Image
        src={image}
        alt={title}
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/80 to-[#0a1628]/40" />
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            {title}
          </h1>
          {productCount !== undefined && (
            <p className="text-sm text-white/70">
              {productCount} ürün bulundu
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Filter Sidebar                                                      */
/* ------------------------------------------------------------------ */

export function FilterSidebar({
  brands,
  selectedBrands,
  priceRange,
  onBrandChange,
  onPriceChange,
}: {
  brands: { id: string; name: string; slug: string }[]
  selectedBrands: string[]
  priceRange: [number, number]
  onBrandChange: (slug: string) => void
  onPriceChange: (range: [number, number]) => void
}) {
  return (
    <aside className="w-[250px] shrink-0 space-y-6" aria-label="Filtreler">
      {/* Price Range */}
      <div>
        <h3 className="text-[12px] font-bold text-[#1e1e1e] uppercase tracking-wider mb-3">
          Fiyat Aralığı
        </h3>
        <div className="flex gap-2">
          <div>
            <label htmlFor="price-min" className="sr-only">
              Min Fiyat
            </label>
            <input
              id="price-min"
              type="number"
              aria-label="Min Fiyat"
              value={priceRange[0]}
              onChange={(e) =>
                onPriceChange([Number(e.target.value), priceRange[1]])
              }
              className="w-full h-9 border border-gray-200 rounded-lg px-3 text-[13px] text-[#1e1e1e] focus:outline-none focus:border-[#0040a4]"
              placeholder="Min"
            />
          </div>
          <span className="text-gray-400 self-center">-</span>
          <div>
            <label htmlFor="price-max" className="sr-only">
              Max Fiyat
            </label>
            <input
              id="price-max"
              type="number"
              aria-label="Max Fiyat"
              value={priceRange[1]}
              onChange={(e) =>
                onPriceChange([priceRange[0], Number(e.target.value)])
              }
              className="w-full h-9 border border-gray-200 rounded-lg px-3 text-[13px] text-[#1e1e1e] focus:outline-none focus:border-[#0040a4]"
              placeholder="Max"
            />
          </div>
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <h3 className="text-[12px] font-bold text-[#1e1e1e] uppercase tracking-wider mb-3">
            Markalar
          </h3>
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {brands.map((brand) => {
              const isChecked = selectedBrands.includes(brand.slug)
              return (
                <label
                  key={brand.id}
                  className="flex items-center gap-2.5 py-1.5 px-2 cursor-pointer rounded-lg hover:bg-[#0040a4]/5 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onBrandChange(brand.slug)}
                    aria-label={brand.name}
                    className="h-3.5 w-3.5 accent-[#0040a4] rounded"
                  />
                  <span className="text-[13px] text-[#555555]">{brand.name}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </aside>
  )
}

/* ------------------------------------------------------------------ */
/*  Sort Dropdown                                                       */
/* ------------------------------------------------------------------ */

const SORT_OPTIONS = [
  { value: "popular", label: "Popülerlik" },
  { value: "price-asc", label: "Fiyat: Düşükten Yükseğe" },
  { value: "price-desc", label: "Fiyat: Yüksekten Düşüğe" },
  { value: "newest", label: "En Yeniler" },
]

export function SortDropdown({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 border border-gray-200 rounded-lg px-3 text-[13px] text-[#1e1e1e] focus:outline-none focus:border-[#0040a4] bg-white"
      aria-label="Siralama"
      role="combobox"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

/* ------------------------------------------------------------------ */
/*  Category Product Grid                                               */
/* ------------------------------------------------------------------ */

interface CategoryProduct {
  id: string
  name: string
  slug: string
  images: string[]
  brand: { name: string; slug: string } | null
  stockStatus: boolean
}

function StockBadge({ inStock }: { inStock: boolean }) {
  if (inStock) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />
        Stokta
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
      <XCircle className="h-3 w-3 shrink-0" aria-hidden />
      Tükendi
    </span>
  )
}

function CategoryProductLoginCTA() {
  const { isAuthenticated, isAdmin } = useAuth()
  if (isAuthenticated || isAdmin) return null
  return (
    <Link
      href="/login"
      className="flex items-center justify-center gap-1.5 h-8 w-full border border-[#0040a4]/30 bg-[#0040a4]/5 text-[#0040a4] text-[10px] font-semibold rounded-lg hover:bg-[#0040a4]/10 hover:underline transition-colors"
    >
      <Lock className="h-3 w-3" aria-hidden />
      Özel Fiyatlar İçin Bayi Girişi Yapınız
    </Link>
  )
}

export function CategoryProductGrid({
  products,
  totalCount,
}: {
  products: CategoryProduct[]
  totalCount?: number
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3 border-2 border-dashed border-gray-300 rounded-xl bg-[#f9f9f9]">
        <Package className="h-10 w-10 text-gray-400" aria-hidden />
        <p className="text-sm text-gray-600">Ürün bulunamadı.</p>
      </div>
    )
  }

  return (
    <div>
      {totalCount !== undefined && (
        <p className="text-[13px] text-[#555555] mb-4">
          <span className="font-bold text-[#1e1e1e]">{totalCount}</span> ürün listeleniyor
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => {
          const imageUrl = product.images?.[0] ?? null
          return (
            <article
              key={product.id}
              className="group bg-[#f3f3f3] rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <Link
                href={`/urun/${product.slug}`}
                className="block relative aspect-square bg-white overflow-hidden"
              >
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#f9f9f9]">
                    <ImageOff className="h-12 w-12 text-gray-300" aria-hidden />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <StockBadge inStock={product.stockStatus} />
                </div>
              </Link>
              <div className="p-3 space-y-1.5">
                {product.brand && (
                  <p className="text-[10px] font-bold text-[#999999] uppercase tracking-wider truncate">
                    {product.brand.name}
                  </p>
                )}
                <Link
                  href={`/urun/${product.slug}`}
                  className="block text-[12px] font-semibold text-[#1e1e1e] line-clamp-2 hover:text-[#0040a4] transition-colors leading-snug min-h-[36px]"
                >
                  {product.name}
                </Link>
                <CategoryProductLoginCTA />
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Load More Button                                                    */
/* ------------------------------------------------------------------ */

export function LoadMoreButton({
  onClick,
  hasMore,
  isLoading,
}: {
  onClick: () => void
  hasMore: boolean
  isLoading: boolean
}) {
  return (
    <div className="flex justify-center pt-6">
      <button
        type="button"
        onClick={onClick}
        disabled={!hasMore || isLoading}
        className={cn(
          "inline-flex items-center gap-2 h-11 px-8 text-[13px] font-bold rounded-lg transition-all",
          hasMore && !isLoading
            ? "bg-[#0040a4] text-white hover:bg-[#1e1e1e]"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        )}
        aria-label={isLoading ? "Yükleniyor" : "Daha Fazla Göster"}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Yükleniyor...
          </>
        ) : hasMore ? (
          "Daha Fazla Göster"
        ) : (
          "Tüm ürünler yüklendi"
        )}
      </button>
    </div>
  )
}
