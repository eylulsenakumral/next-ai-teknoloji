"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Lock, ImageOff, Heart, Eye, ShoppingCart, Check, Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"
import { toast } from "@/components/ui/toaster"

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
  stockCount?: number
  price?: number | null
  currency?: string | null
  priceTry?: number | null
  usdTryRate?: number | null
  campaignDiscountPct?: string | number | null
  hidePrice?: boolean
}

/* ------------------------------------------------------------------ */
/*  Card (Grid view) - DT Elektrix Style                                */
/* ------------------------------------------------------------------ */

export function PublicProductCard({ product }: { product: PublicProduct }) {
  const router = useRouter()
  const imageUrl = product.images?.[0] ?? null
  const secondImage = product.images?.[1] ?? null
  const { isAuthenticated, isAdmin } = useAuth()
  const hideLoginCTA = isAuthenticated || isAdmin
  const { addItem, items, openCart } = useCart()

  const [qty, setQty] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const cartItem = items.find((i) => i.productId === product.id)
  const cartQty = cartItem?.quantity ?? 0

  function handleAddToCart() {
    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      brandName: product.brand?.name ?? "",
      imageUrl: product.images[0] ?? "",
      unitPriceExVat: product.price ?? 0,
      vatRate: 20,
      minOrderQuantity: 1,
      stockQuantity: 999,
      quantity: qty,
    })
    toast({ title: "Sepete eklendi", description: `${product.name} (${qty} adet) sepetinize eklendi.` })
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2000)
  }

  return (
    <article
      className={cn(
        "group relative bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 flex flex-col h-full",
        "hover:shadow-2xl transition-all duration-500"
      )}
    >
      {/* Image Container */}
      <Link
        href={`/katalog/${product.slug}`}
        className="block relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden"
        tabIndex={-1}
        aria-hidden
      >
        {/* Primary Image */}
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className={cn(
              "object-contain p-6 transition-all duration-700",
              secondImage ? "group-hover:opacity-0" : "group-hover:scale-110"
            )}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageOff className="h-14 w-14 text-gray-200" aria-hidden />
          </div>
        )}

        {/* Second Image on Hover */}
        {secondImage && (
          <Image
            src={secondImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-contain p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          />
        )}

        {/* Badges - Top Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {!product.stockStatus ? (
            <span className="px-3 py-1 bg-[#a60811] text-white text-xs font-bold rounded-full">
              Tükendi
            </span>
          ) : product.stockCount !== undefined && product.stockCount > 0 ? (
            <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full">
              {product.stockCount} adet
            </span>
          ) : null}
        </div>

        {/* Action Buttons - Top Right (hover) */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            type="button"
            className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-[#0040a4] hover:text-white transition-colors"
            aria-label={`${product.name} favorilere ekle`}
          >
            <Heart className="w-5 h-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => router.push(`/katalog/${product.slug}`)}
            className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-[#0040a4] hover:text-white transition-colors"
            aria-label={`${product.name} hızlı bak`}
          >
            <Eye className="w-5 h-5" aria-hidden />
          </button>
        </div>

        {/* Ürünü İncele - Slide Up from Bottom */}
        {product.stockStatus && (
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
            <button
              type="button"
              onClick={() => router.push(`/katalog/${product.slug}`)}
              className="w-full py-3 bg-[#0040a4] text-white font-semibold rounded-lg hover:bg-[#003080] transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" aria-hidden />
              Ürünü İncele
            </button>
          </div>
        )}

        {/* Sold Out Overlay */}
        {!product.stockStatus && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-20 h-20 bg-[#a60811] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">Tükendi</span>
            </div>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category — always reserve space */}
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 truncate h-4">
          {product.category?.name || ""}
        </p>

        {/* Product Name — always 2 lines */}
        <Link
          href={`/katalog/${product.slug}`}
          className="block font-semibold text-base mb-2 line-clamp-2 hover:text-[#0040a4] transition-colors min-h-[48px]"
        >
          {product.name}
        </Link>

        {/* Brand — always reserve space */}
        <p className="text-xs text-gray-400 mb-3 truncate h-4">
          {product.brand?.name || ""}
        </p>

        {/* Price / Login CTA */}
        <div className="mt-auto pt-3">
        {hideLoginCTA && product.hidePrice ? (
          <p className="text-[12px] font-semibold text-[#a60811] leading-snug">
            Müşteri Temsilcinizden Özel Fiyat Alınız
          </p>
        ) : hideLoginCTA && product.price != null ? (
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-[#0040a4]">
                {new Intl.NumberFormat("tr-TR", { style: "currency", currency: product.currency || "TRY", minimumFractionDigits: 2 }).format(product.price)}
                <span className="text-[10px] font-normal text-gray-400 ml-1">+KDV</span>
              </span>
              <span className="text-[11px] text-gray-500">
                {new Intl.NumberFormat("tr-TR", { style: "currency", currency: product.currency || "TRY", minimumFractionDigits: 2 }).format(product.price * 1.20)} KDV Dahil
              </span>
            </div>
            {product.currency !== "TRY" && product.priceTry != null && (
              <div className="flex flex-col items-end">
                <span className="text-[13px] font-semibold text-gray-600">
                  {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(product.priceTry)}
                  <span className="text-[10px] font-normal text-gray-400 ml-1">+KDV</span>
                </span>
                <span className="text-[11px] text-gray-500">
                  {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(product.priceTry * 1.20)} KDV Dahil
                </span>
              </div>
            )}
          </div>
        ) : !hideLoginCTA ? (
          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 h-10 px-4 text-xs font-semibold rounded-lg border border-[#0040a4]/30 bg-[#0040a4]/5 text-[#0040a4] hover:bg-[#0040a4]/10 transition-colors"
          >
            <Lock className="h-3.5 w-3.5" aria-hidden />
            Bayi Fiyatı İçin Giriş Yapın
          </Link>
        ) : null}

        {/* Sepete Ekle - sadece login + fiyat varsa + stok varsa */}
        {hideLoginCTA && product.price != null && !product.hidePrice && product.stockStatus ? (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setQty((p) => Math.max(1, p - 1))}
                disabled={qty <= 1}
                className="h-7 w-7 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-colors"
                aria-label="Azalt"
              >
                <Minus className="h-3 w-3" aria-hidden />
              </button>
              <span className="h-7 w-8 flex items-center justify-center text-[12px] font-medium border-x border-gray-200">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((p) => p + 1)}
                className="h-7 w-7 flex items-center justify-center hover:bg-gray-50 transition-colors"
                aria-label="Artır"
              >
                <Plus className="h-3 w-3" aria-hidden />
              </button>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              className={cn(
                "flex-1 h-7 flex items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200",
                justAdded ? "bg-[#3b7300] text-white" : "bg-[#0040a4] text-white hover:bg-[#003080]"
              )}
              aria-label={`${product.name} sepete ekle`}
            >
              {justAdded ? <><Check className="h-3 w-3" aria-hidden /> Eklendi</> : <><ShoppingCart className="h-3 w-3" aria-hidden /> Sepete Ekle</>}
            </button>
          </div>
        ) : hideLoginCTA && !product.stockStatus ? (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button type="button" disabled className="w-full h-7 flex items-center justify-center rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-400 cursor-not-allowed">Stokta Yok</button>
          </div>
        ) : null}

        {cartQty > 0 && (
          <button type="button" onClick={() => openCart()} className="text-[10px] text-center text-[#0040a4] hover:underline mt-1">Sepette {cartQty} adet</button>
        )}
        </div>
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ */
/*  List Item (List view) - DT Elektrix Style                          */
/* ------------------------------------------------------------------ */

export function PublicProductListItem({ product }: { product: PublicProduct }) {
  const imageUrl = product.images?.[0] ?? null
  const { isAuthenticated, isAdmin } = useAuth()
  const hideLoginCTA = isAuthenticated || isAdmin
  const { addItem } = useCart()

  const [qty, setQty] = useState(1)
  const [justAdded, setJustAdded] = useState(false)

  function handleAddToCart() {
    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      brandName: product.brand?.name ?? "",
      imageUrl: product.images[0] ?? "",
      unitPriceExVat: product.price ?? 0,
      vatRate: 20,
      minOrderQuantity: 1,
      stockQuantity: 999,
      quantity: qty,
    })
    toast({ title: "Sepete eklendi", description: `${product.name} (${qty} adet) sepetinize eklendi.` })
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2000)
  }

  return (
    <article
      className={cn(
        "group bg-white rounded-2xl overflow-hidden flex border border-gray-100 shadow-sm",
        "hover:shadow-xl transition-all duration-300"
      )}
    >
      {/* Image */}
      <Link
        href={`/katalog/${product.slug}`}
        className="relative w-28 sm:w-36 shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden"
        tabIndex={-1}
        aria-hidden
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="144px"
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageOff className="h-8 w-8 text-gray-200" aria-hidden />
          </div>
        )}
        {!product.stockStatus && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#a60811] text-white text-[10px] font-bold rounded-full z-10">
            Tükendi
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5">
        <div className="flex-1 min-w-0 space-y-1.5">
          {product.category && (
            <p className="text-[11px] text-gray-400 uppercase tracking-wider truncate">
              {product.category.name}
            </p>
          )}
          <Link
            href={`/katalog/${product.slug}`}
            className="block text-[15px] font-semibold text-[#1e1e1e] hover:text-[#0040a4] transition-colors leading-snug line-clamp-2"
          >
            {product.name}
          </Link>
          {product.brand && (
            <p className="text-xs text-gray-400 truncate">{product.brand.name}</p>
          )}
        </div>

        {hideLoginCTA && product.hidePrice ? (
          <div className="shrink-0">
            <p className="text-[12px] font-semibold text-[#a60811] leading-snug whitespace-nowrap">
              Müşteri Temsilcinizden<br />Özel Fiyat Alınız
            </p>
          </div>
        ) : hideLoginCTA && product.price != null ? (
          <div className="shrink-0 flex items-start gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[15px] font-bold text-[#0040a4]">
                {new Intl.NumberFormat("tr-TR", { style: "currency", currency: product.currency || "TRY", minimumFractionDigits: 2 }).format(product.price)}
                <span className="text-[10px] font-normal text-gray-400 ml-1">+KDV</span>
              </span>
              <span className="text-[11px] text-gray-500">
                {new Intl.NumberFormat("tr-TR", { style: "currency", currency: product.currency || "TRY", minimumFractionDigits: 2 }).format(product.price * 1.20)} KDV Dahil
              </span>
            </div>
            {product.currency !== "TRY" && product.priceTry != null && (
              <div className="flex flex-col items-end">
                <span className="text-[13px] font-semibold text-gray-600">
                  {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(product.priceTry)}
                  <span className="text-[10px] font-normal text-gray-400 ml-1">+KDV</span>
                </span>
                <span className="text-[11px] text-gray-500">
                  {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(product.priceTry * 1.20)} KDV Dahil
                </span>
              </div>
            )}
          </div>
        ) : !hideLoginCTA ? (
          <div className="shrink-0">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 h-10 px-5 text-xs font-semibold rounded-lg border border-[#0040a4]/30 bg-[#0040a4]/5 text-[#0040a4] hover:bg-[#0040a4]/10 transition-colors"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Bayi Fiyatı İçin Giriş Yapın
            </Link>
          </div>
        ) : null}

        {/* Sepete Ekle - list view */}
        {hideLoginCTA && product.price != null && !product.hidePrice && product.stockStatus ? (
          <div className="shrink-0 flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
              <button type="button" onClick={() => setQty((p) => Math.max(1, p - 1))} disabled={qty <= 1} className="h-8 w-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-colors" aria-label="Azalt"><Minus className="h-3 w-3" aria-hidden /></button>
              <span className="h-8 w-9 flex items-center justify-center text-[12px] font-medium border-x border-gray-200">{qty}</span>
              <button type="button" onClick={() => setQty((p) => p + 1)} className="h-8 w-8 flex items-center justify-center hover:bg-gray-50 transition-colors" aria-label="Artır"><Plus className="h-3 w-3" aria-hidden /></button>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              className={cn(
                "h-8 px-4 flex items-center justify-center gap-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200",
                justAdded ? "bg-[#3b7300] text-white" : "bg-[#0040a4] text-white hover:bg-[#003080]"
              )}
              aria-label={`${product.name} sepete ekle`}
            >
              {justAdded ? <><Check className="h-3.5 w-3.5" aria-hidden /> Eklendi</> : <><ShoppingCart className="h-3.5 w-3.5" aria-hidden /> Sepete Ekle</>}
            </button>
          </div>
        ) : hideLoginCTA && !product.stockStatus ? (
          <div className="shrink-0">
            <button type="button" disabled className="h-8 px-4 flex items-center justify-center rounded-lg text-[12px] font-semibold bg-gray-100 text-gray-400 cursor-not-allowed">Stokta Yok</button>
          </div>
        ) : null}
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ */
/*  Skeletons                                                           */
/* ------------------------------------------------------------------ */

export function PublicProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      <div className="aspect-square w-full bg-gradient-to-br from-gray-50 to-gray-100 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 rounded bg-gray-100 animate-pulse" />
        <div className="h-5 w-full rounded bg-gray-100 animate-pulse" />
        <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
        <div className="h-10 w-full rounded-lg bg-gray-100 animate-pulse" />
      </div>
    </div>
  )
}

export function PublicProductListItemSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      <div className="flex items-stretch">
        <div className="w-28 sm:w-36 h-28 sm:h-36 shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 animate-pulse" />
        <div className="flex-1 p-4 sm:p-5 space-y-3">
          <div className="h-3 w-16 rounded bg-gray-100 animate-pulse" />
          <div className="h-5 w-full rounded bg-gray-100 animate-pulse" />
          <div className="h-4 w-1/2 rounded bg-gray-100 animate-pulse" />
          <div className="h-10 w-32 rounded-lg bg-gray-100 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
