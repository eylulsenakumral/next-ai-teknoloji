"use client"

import { useState } from "react"
import Link from "next/link"
import { Package, Lock, Heart, Eye, ShoppingCart, Check, Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"
import { toast } from "@/components/ui/toaster"
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
  hidePrice?: boolean
  originalPrice?: number | null
}

interface PublicProductCardProps {
  product: PublicProductCardProduct
}

function ProductImage({ src, alt }: { src?: string; alt: string }) {
  const [errored, setErrored] = useState(false)

  if (!src || errored) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <Package className="h-12 w-12 text-[var(--color-border)]" aria-hidden />
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
  const { addItem, items, openCart } = useCart()

  const [qty, setQty] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const cartItem = items.find((i) => i.productId === product.id)
  const cartQty = cartItem?.quantity ?? 0

  // Show price for authenticated dealers and admin users
  const showPrice = (isAuthenticated || isAdmin) && product.price !== null && product.price !== undefined && !product.hidePrice

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
        "group relative flex flex-col bg-[var(--color-surface-muted)] rounded-[20px] overflow-hidden",
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
            className="w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center text-[var(--color-foreground)] hover:bg-[var(--color-primary)] hover:text-white transition-all duration-200"
            aria-label={`${product.name} favorilere ekle`}
          >
            <Heart className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className="w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center text-[var(--color-foreground)] hover:bg-[var(--color-primary)] hover:text-white transition-all duration-200"
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
            <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold text-white bg-[var(--color-error)]">
              Tükendi
            </span>
          </div>
        )}

        {/* Sold Out Overlay */}
        {!product.stockStatus && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-t-[20px]">
            <div className="w-20 h-20 bg-[var(--color-error)] rounded-full flex items-center justify-center">
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
            "text-[13px] leading-snug line-clamp-2 hover:text-[var(--color-primary)] transition-colors min-h-[2.4rem]",
            product.stockStatus ? "font-semibold text-[var(--color-foreground)]" : "text-[var(--color-text-muted)]"
          )}
        >
          {product.name}
        </Link>

        {/* Price or Login CTA */}
        {!authLoading && (
          <div className="mt-1">
            {showPrice && product.price !== null && product.price !== undefined ? (
              <div>
                {product.originalPrice != null && product.originalPrice > product.price && (
                  <span className="text-[12px] text-[#999] line-through block">
                    {formatCurrency(product.originalPrice, product.currency || "TRY")}
                  </span>
                )}
                <p className="text-[16px] font-bold text-[#3b7300] leading-tight">
                  {formatCurrency(product.price, product.currency || "TRY")}
                </p>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 px-2 py-1 text-[11px] font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
              >
                <Lock className="h-3.5 w-3.5" aria-hidden />
                Özel Fiyatlar İçin Bayi Girişi Yapınız
              </Link>
            )}
          </div>
        )}

        {/* Sepete Ekle */}
        {!authLoading && showPrice && product.stockStatus ? (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--color-border)]">
            <div className="flex items-center rounded-lg border border-[var(--color-border)] overflow-hidden shrink-0">
              <button type="button" onClick={() => setQty((p) => Math.max(1, p - 1))} disabled={qty <= 1} className="h-7 w-7 flex items-center justify-center hover:bg-[#f5f5f5] disabled:opacity-30 transition-colors" aria-label="Azalt"><Minus className="h-3 w-3" aria-hidden /></button>
              <span className="h-7 w-8 flex items-center justify-center text-[12px] font-medium border-x border-[var(--color-border)]">{qty}</span>
              <button type="button" onClick={() => setQty((p) => p + 1)} className="h-7 w-7 flex items-center justify-center hover:bg-[#f5f5f5] transition-colors" aria-label="Artır"><Plus className="h-3 w-3" aria-hidden /></button>
            </div>
            <button type="button" onClick={handleAddToCart} className={cn("flex-1 h-7 flex items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200", justAdded ? "bg-[#3b7300] text-white" : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]")} aria-label={`${product.name} sepete ekle`}>
              {justAdded ? <><Check className="h-3 w-3" aria-hidden /> Eklendi</> : <><ShoppingCart className="h-3 w-3" aria-hidden /> Sepete Ekle</>}
            </button>
          </div>
        ) : !authLoading && (isAuthenticated || isAdmin) && !product.stockStatus ? (
          <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
            <button type="button" disabled className="w-full h-7 flex items-center justify-center rounded-lg text-[11px] font-semibold bg-[#e5e5e5] text-[#999] cursor-not-allowed">Stokta Yok</button>
          </div>
        ) : null}

        {cartQty > 0 && (
          <button type="button" onClick={() => openCart()} className="text-[10px] text-center text-[var(--color-primary)] hover:underline mt-1">Sepette {cartQty} adet</button>
        )}
      </div>
    </article>
  )
}
