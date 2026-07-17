"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Package, ShoppingCart, Eye, Heart, Check, Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils/format"
import { useCart } from "@/hooks/use-cart"
import { toast } from "@/components/ui/toaster"
import type { CatalogProduct, BrandItem, CategoryNode } from "@/types/catalog"

interface ProductImageProps {
  src?: string
  alt: string
  className?: string
}

function ProductImage({ src, alt, className }: ProductImageProps) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center bg-white", className)}>
        <Package className="h-14 w-14 text-[var(--color-border)]" aria-hidden />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn(
        "h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-110",
        className
      )}
      onError={() => setError(true)}
    />
  )
}

/** Flatten CategoryNode tree into a depth-aware list for select options */
function flattenCategories(
  nodes: CategoryNode[],
  depth = 0
): Array<{ id: string; name: string; depth: number }> {
  const result: Array<{ id: string; name: string; depth: number }> = []
  for (const node of nodes) {
    result.push({ id: node.id, name: node.name, depth })
    if (node.children?.length) {
      result.push(...flattenCategories(node.children, depth + 1))
    }
  }
  return result
}

async function updateProduct(
  productId: string,
  data: { brandId?: string | null; categoryId?: string | null }
) {
  const res = await fetch(`/api/catalog/products/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return res.ok
}

interface ProductCardProps {
  product: CatalogProduct
  onAddToCart?: (product: CatalogProduct) => void
  brands?: BrandItem[]
  categories?: CategoryNode[]
}

export function ProductCard({ product, onAddToCart, brands, categories }: ProductCardProps) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "super_admin"
  const mainImage = product.images[0]
  const { addItem, items, openCart } = useCart()

  const [updating, setUpdating] = useState(false)
  const [flash, setFlash] = useState<Record<string, "ok" | "err">>({})
  const [qty, setQty] = useState(product.minOrderQuantity || 1)
  const [justAdded, setJustAdded] = useState(false)

  const cartItem = items.find((i) => i.productId === product.id)
  const cartQty = cartItem?.quantity ?? 0

  function handleAddToCart() {
    if (!product.stock.isAvailable || !product.pricing) return

    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      brandName: product.brand?.name ?? "",
      imageUrl: product.images[0] ?? "",
      unitPriceExVat: product.pricing.salePriceExVat,
      vatRate: product.pricing.vatRate,
      minOrderQuantity: product.minOrderQuantity || 1,
      stockQuantity: product.stock.quantity,
      quantity: qty,
    })

    toast({
      title: "Sepete eklendi",
      description: `${product.name} (${qty} adet) sepetinize eklendi.`,
    })

    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2000)
  }

  const flatCategories = categories ? flattenCategories(categories) : []

  async function handleFieldChange(field: "brandId" | "categoryId", value: string) {
    setUpdating(true)
    const ok = await updateProduct(product.id, { [field]: value || null })
    setFlash((prev) => ({ ...prev, [field]: ok ? "ok" : "err" }))
    setTimeout(() => {
      setFlash((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }, 1500)
    setUpdating(false)
  }

  const showDropdowns = isAdmin && ((brands && brands.length > 0) || (categories && categories.length > 0))

  return (
    <article
      className={cn(
        "group relative flex flex-col bg-[var(--color-surface-muted)] rounded-[20px] overflow-hidden",
        "hover:shadow-[0_8px_25px_rgba(187,187,187,0.5)] hover:-translate-y-1",
        "transition-all duration-300 linear"
      )}
    >
      {/* Product Image */}
      <Link
        href={`/urunler/${product.slug}`}
        className="relative block overflow-hidden bg-white rounded-t-[20px]"
        style={{ aspectRatio: "1 / 1" }}
        tabIndex={-1}
        aria-hidden
      >
        <ProductImage src={mainImage} alt={product.name} />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />

        {/* Hover action buttons */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
          {product.stock.isAvailable && onAddToCart && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onAddToCart(product)
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--color-foreground)] hover:bg-[var(--color-primary)] hover:text-white transition-all duration-200 shadow-md translate-y-2 group-hover:translate-y-0"
              aria-label={`${product.name} sepete ekle`}
            >
              <ShoppingCart className="h-4 w-4" aria-hidden />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              window.location.href = `/urunler/${product.slug}`
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--color-foreground)] hover:bg-[var(--color-primary)] hover:text-white transition-all duration-200 shadow-md translate-y-2 group-hover:translate-y-0"
            aria-label={`${product.name} hizli bak`}
          >
            <Eye className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--color-foreground)] hover:bg-[var(--color-primary)] hover:text-white transition-all duration-200 shadow-md translate-y-2 group-hover:translate-y-0"
            aria-label={`${product.name} favorilere ekle`}
          >
            <Heart className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </Link>

      {/* Badges - top left */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {product.isNew && (
          <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold text-white bg-[var(--color-primary)]">
            YENI
          </span>
        )}
        {product.isOutlet && (
          <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold text-white bg-[var(--color-error)]">
            OUTLET
          </span>
        )}
        {!product.stock.isAvailable && (
          <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold text-white bg-[var(--color-text-muted)]">
            TUKENDI
          </span>
        )}
      </div>

      {/* Card content - price FIRST, name AFTER */}
      <div className="flex flex-col gap-1 p-[10px]">
        {/* Price - FIRST */}
        {product.pricing ? (
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <p className="text-[16px] font-bold text-[var(--color-price)] leading-tight">
                {formatCurrency(product.pricing.salePriceExVat, product.pricing.currency)}
                <span className="text-[10px] text-gray-400 font-normal ml-0.5">+KDV</span>
              </p>
            </div>
            <p className="text-[11px] text-gray-400 leading-tight">
              {formatCurrency(product.pricing.salePriceIncVat, product.pricing.currency)}
              <span className="text-[9px]"> KDV dahil</span>
            </p>
          </div>
        ) : (
          <p className="text-[14px] text-[var(--color-text-muted)]">--</p>
        )}

        {/* Product name - AFTER */}
        <Link
          href={`/urunler/${product.slug}`}
          className="text-[13px] text-[var(--color-foreground)] leading-snug line-clamp-2 hover:text-[var(--color-primary)] transition-colors min-h-[2.4rem] font-medium"
        >
          {product.name}
        </Link>

        {/* Stock status - only critical cases */}
        {!product.stock.isAvailable ? (
          <p className="text-[11px] text-[var(--color-error)] font-medium">Stok Yok</p>
        ) : product.stock.quantity < 5 ? (
          <p className="text-[11px] text-amber-600 font-medium">Son {product.stock.quantity} adet</p>
        ) : null}

        {/* Inline brand/category dropdowns */}
        {showDropdowns && (
          <div className="flex flex-col gap-0.5 mt-1" onClick={(e) => e.stopPropagation()}>
            {brands && brands.length > 0 && (
              <select
                value={product.brand?.id ?? ""}
                disabled={updating}
                onChange={(e) => handleFieldChange("brandId", e.target.value)}
                className={cn(
                  "w-full text-xs py-0.5 px-1 rounded border bg-transparent outline-none cursor-pointer",
                  "border-transparent hover:border-gray-300 focus:border-[var(--color-primary)] transition-colors",
                  flash["brandId"] === "ok" && "border-green-500 text-green-700",
                  flash["brandId"] === "err" && "border-red-500 text-red-600",
                )}
                aria-label="Marka sec"
              >
                <option value="">-- Marka Sec --</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
            {flatCategories.length > 0 && (
              <select
                value={product.category?.id ?? ""}
                disabled={updating}
                onChange={(e) => handleFieldChange("categoryId", e.target.value)}
                className={cn(
                  "w-full text-xs py-0.5 px-1 rounded border bg-transparent outline-none cursor-pointer",
                  "border-transparent hover:border-gray-300 focus:border-[var(--color-primary)] transition-colors text-[var(--color-text-muted)]",
                  flash["categoryId"] === "ok" && "border-green-500 text-green-700",
                  flash["categoryId"] === "err" && "border-red-500 text-red-600",
                )}
                aria-label="Kategori sec"
              >
                <option value="">-- Kategori Sec --</option>
                {flatCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.depth > 0 ? `${"  ".repeat(c.depth)}-- ` : ""}{c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Sepete ekle bölümü */}
        {product.stock.isAvailable && product.pricing ? (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--color-border)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center rounded-lg border border-[var(--color-border)] overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setQty((prev) => Math.max(product.minOrderQuantity || 1, prev - 1))}
                disabled={qty <= (product.minOrderQuantity || 1)}
                className="h-8 w-8 flex items-center justify-center hover:bg-[#f5f5f5] disabled:opacity-30 transition-colors"
                aria-label="Azalt"
              >
                <Minus className="h-3 w-3" aria-hidden />
              </button>
              <span className="h-8 w-10 flex items-center justify-center text-[13px] font-medium border-x border-[var(--color-border)]">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((prev) => Math.min(prev + 1, product.stock.quantity))}
                disabled={qty >= product.stock.quantity}
                className="h-8 w-8 flex items-center justify-center hover:bg-[#f5f5f5] disabled:opacity-30 transition-colors"
                aria-label="Artır"
              >
                <Plus className="h-3 w-3" aria-hidden />
              </button>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              className={cn(
                "flex-1 h-8 flex items-center justify-center gap-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200",
                justAdded
                  ? "bg-[var(--color-price)] text-white"
                  : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
              )}
              aria-label={`${product.name} sepete ekle`}
            >
              {justAdded ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  Eklendi
                </>
              ) : (
                <>
                  <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
                  Sepete Ekle
                </>
              )}
            </button>
          </div>
        ) : !product.stock.isAvailable ? (
          <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
            <button
              type="button"
              disabled
              className="w-full h-8 flex items-center justify-center gap-1.5 rounded-lg text-[12px] font-semibold bg-[#e5e5e5] text-[#999] cursor-not-allowed"
            >
              Stokta Yok
            </button>
          </div>
        ) : null}

        {cartQty > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); openCart() }}
            className="text-[11px] text-center text-[var(--color-primary)] hover:underline mt-1"
          >
            Sepette {cartQty} adet
          </button>
        )}
      </div>
    </article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col bg-[var(--color-surface-muted)] rounded-[20px] overflow-hidden animate-pulse">
      <div className="aspect-square bg-[#f5f5f5] rounded-t-[20px]" />
      <div className="p-[10px] space-y-2">
        <div className="h-4 w-24 bg-[#e5e5e5] rounded" />
        <div className="h-3.5 w-full bg-[#e5e5e5] rounded" />
        <div className="h-3.5 w-3/4 bg-[#e5e5e5] rounded" />
      </div>
    </div>
  )
}
