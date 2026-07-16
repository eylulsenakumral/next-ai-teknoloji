"use client"

import { useState } from "react"
import Link from "next/link"
import { Package, ShoppingCart, Check, Minus, Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils/format"
import { useCart } from "@/hooks/use-cart"
import { toast } from "@/components/ui/toaster"
import type { CatalogProduct, BrandItem, CategoryNode } from "@/types/catalog"

function ProductImage({ src, alt }: { src?: string; alt: string }) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#f1f5f9]">
        <Package className="h-8 w-8 text-slate-300" aria-hidden />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-contain p-2"
      onError={() => setError(true)}
    />
  )
}

function StockIndicator({ quantity, isAvailable }: { quantity: number; isAvailable: boolean }) {
  if (!isAvailable) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-500">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" aria-hidden />
        Stok Yok
      </span>
    )
  }
  if (quantity < 5) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" aria-hidden />
        Sınırlı ({quantity} adet)
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" aria-hidden />
      Stokta ({quantity} adet)
    </span>
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

interface ProductListItemProps {
  product: CatalogProduct
  onAddToCart?: (product: CatalogProduct) => void
  brands?: BrandItem[]
  categories?: CategoryNode[]
}

export function ProductListItem({ product, onAddToCart, brands, categories }: ProductListItemProps) {
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

    toast({ title: "Sepete eklendi", description: `${product.name} (${qty} adet) sepetinize eklendi.` })
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

  const showDropdowns = (brands && brands.length > 0) || (categories && categories.length > 0)

  return (
    <article className="flex gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-300 hover:shadow-md transition-all duration-200">
      {/* Görsel */}
      <Link
        href={`/urunler/${product.slug}`}
        className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-slate-100"
        tabIndex={-1}
        aria-hidden
      >
        <ProductImage src={mainImage} alt={product.name} />
      </Link>

      {/* Bilgiler */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Marka — inline dropdown ya da link */}
        {showDropdowns && brands && brands.length > 0 ? (
          <select
            value={product.brand?.id ?? ""}
            disabled={updating}
            onChange={(e) => handleFieldChange("brandId", e.target.value)}
            className={cn(
              "text-xs py-0.5 px-1 rounded border bg-transparent outline-none cursor-pointer w-fit max-w-full",
              "border-transparent hover:border-slate-300 focus:border-sky-400 transition-colors",
              "font-semibold text-sky-600",
              flash["brandId"] === "ok" && "border-green-500 text-green-700",
              flash["brandId"] === "err" && "border-red-500 text-red-600",
            )}
            aria-label="Marka seç"
          >
            <option value="">— Marka Seç —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        ) : product.brand ? (
          <Link
            href={`/urunler?brandId=${product.brand.id}`}
            className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 uppercase tracking-wide transition-colors"
          >
            {product.brand.name}
          </Link>
        ) : null}

        {/* Ürün adı */}
        <Link
          href={`/urunler/${product.slug}`}
          className="font-medium text-sm text-slate-800 leading-snug hover:text-sky-600 transition-colors line-clamp-2"
        >
          {product.name}
        </Link>

        {/* Barkod / SKU */}
        <div className="flex flex-wrap gap-3 items-center mt-0.5">
          {product.barcode && (
            <span className="text-[11px] text-slate-400">
              Barkod: <span className="font-mono text-slate-500">{product.barcode}</span>
            </span>
          )}
          {product.sku && (
            <span className="text-[11px] text-slate-400">
              SKU: <span className="font-mono text-slate-500">{product.sku}</span>
            </span>
          )}
          {product.warrantyMonths && (
            <span className="text-[11px] text-slate-400">
              {product.warrantyMonths} ay garanti
            </span>
          )}
        </div>

        {/* Kategori inline dropdown */}
        {showDropdowns && flatCategories.length > 0 && (
          <select
            value={product.category?.id ?? ""}
            disabled={updating}
            onChange={(e) => handleFieldChange("categoryId", e.target.value)}
            className={cn(
              "text-xs py-0.5 px-1 rounded border bg-transparent outline-none cursor-pointer w-fit max-w-full mt-0.5",
              "border-transparent hover:border-slate-300 focus:border-sky-400 transition-colors text-slate-400",
              flash["categoryId"] === "ok" && "border-green-500 text-green-700",
              flash["categoryId"] === "err" && "border-red-500 text-red-600",
            )}
            aria-label="Kategori seç"
          >
            <option value="">— Kategori Seç —</option>
            {flatCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.depth > 0 ? `${"  ".repeat(c.depth)}↳ ` : ""}{c.name}
              </option>
            ))}
          </select>
        )}

        {/* Stok + badge */}
        <div className="flex items-center gap-2 mt-1">
          <StockIndicator
            quantity={product.stock.quantity}
            isAvailable={product.stock.isAvailable}
          />
          <div className="flex gap-1">
            {product.isNew && (
              <span className="inline-flex items-center rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                YENİ
              </span>
            )}
            {product.isOutlet && (
              <span className="inline-flex items-center rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                OUTLET
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Fiyat + Sepet */}
      <div className="shrink-0 flex flex-col items-end justify-between gap-2">
        {product.pricing ? (
          <div className="text-right">
            <p className="text-[11px] text-slate-400 leading-none">
              {formatCurrency(product.pricing.salePriceExVat, product.pricing.currency)} KDV Hariç
            </p>
            <p className="text-xl font-bold text-[#1e3a5f] leading-tight mt-0.5">
              {formatCurrency(product.pricing.salePriceIncVat, product.pricing.currency)}
            </p>
            <p className="text-[11px] text-slate-400 leading-none">KDV Dahil</p>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Fiyat yok</span>
        )}

        {product.stock.isAvailable && product.pricing ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setQty((prev) => Math.max(product.minOrderQuantity || 1, prev - 1))}
                disabled={qty <= (product.minOrderQuantity || 1)}
                className="h-7 w-7 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 transition-colors"
                aria-label="Azalt"
              >
                <Minus className="h-3 w-3" aria-hidden />
              </button>
              <span className="h-7 w-8 flex items-center justify-center text-[12px] font-medium border-x border-slate-200">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((prev) => Math.min(prev + 1, product.stock.quantity))}
                disabled={qty >= product.stock.quantity}
                className="h-7 w-7 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 transition-colors"
                aria-label="Artır"
              >
                <Plus className="h-3 w-3" aria-hidden />
              </button>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              className={cn(
                "h-7 px-3 flex items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200",
                justAdded ? "bg-[var(--color-success)] text-white" : "bg-[#1e3a5f] hover:bg-[var(--color-primary)] text-white"
              )}
              aria-label={`${product.name} sepete ekle`}
            >
              {justAdded ? (
                <><Check className="h-3 w-3" aria-hidden /> Eklendi</>
              ) : (
                <><ShoppingCart className="h-3 w-3" aria-hidden /> Sepete Ekle</>
              )}
            </button>
          </div>
        ) : !product.stock.isAvailable ? (
          <button
            type="button"
            disabled
            className="h-7 px-3 flex items-center justify-center rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
          >
            Stokta Yok
          </button>
        ) : null}

        {cartQty > 0 && (
          <button
            type="button"
            onClick={() => openCart()}
            className="text-[10px] text-[#1e3a5f] hover:underline"
          >
            Sepette {cartQty} adet
          </button>
        )}
      </div>
    </article>
  )
}

export function ProductListItemSkeleton() {
  return (
    <div className="flex gap-4 p-4 rounded-xl border border-slate-200 bg-white">
      <Skeleton className="w-24 h-24 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}
