"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  Shield,
  Tag,
  Hash,
  Barcode,
  Package,
  AlertCircle,
  ChevronRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Breadcrumb } from "@/components/products/breadcrumb"
import { ProductGallery } from "@/components/products/product-gallery"
import { AddToCartButton } from "@/components/products/add-to-cart-button"
import { ProductCard } from "@/components/products/product-card"
import { formatCurrency } from "@/lib/utils/format"
import type { CatalogProductDetail, CatalogProduct } from "@/types/catalog"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CategoryBase {
  id: string
  name: string
  slug: string
  parentId?: string | null
}

interface CategoryParent extends CategoryBase {
  parent?: CategoryBase | null
}

interface CategoryWithParent extends CategoryBase {
  parent?: CategoryParent | null
}

interface ProductDetailResponse {
  product: Omit<CatalogProductDetail, "category"> & {
    category: CategoryWithParent | null
  }
  relatedProducts: CatalogProduct[]
}

/* ------------------------------------------------------------------ */
/*  StockBadge                                                         */
/* ------------------------------------------------------------------ */

function StockBadge({
  quantity,
  isAvailable,
}: {
  quantity: number
  isAvailable: boolean
}) {
  if (!isAvailable) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 ring-1 ring-inset ring-red-200">
        <span
          className="h-2 w-2 rounded-full bg-red-500"
          aria-hidden
        />
        Stok Yok
      </span>
    )
  }

  if (quantity < 5) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
        <span
          className="h-2 w-2 rounded-full bg-amber-500"
          aria-hidden
        />
        Sınırlı Stok
        <span className="font-normal text-amber-600">
          ({quantity} adet)
        </span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
      <span
        className="h-2 w-2 rounded-full bg-emerald-500"
        aria-hidden
      />
      Stokta Mevcut
      <span className="font-normal text-emerald-600">
        ({quantity} adet)
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Skeleton Loading                                                   */
/* ------------------------------------------------------------------ */

function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-300">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-3 w-3 rounded" />
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-3 w-3 rounded" />
        <Skeleton className="h-4 w-32 rounded" />
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery skeleton */}
        <div className="space-y-3">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-16 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Info panel skeleton */}
        <div className="space-y-5">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-8 w-4/5 rounded" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-14 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-5 w-full rounded" />
            <Skeleton className="h-5 w-full rounded" />
            <Skeleton className="h-5 w-full rounded" />
            <Skeleton className="h-5 w-full rounded" />
          </div>
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Error State                                                        */
/* ------------------------------------------------------------------ */

function ErrorState({ message }: { message: string }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex flex-col items-center justify-center text-center gap-4 rounded-2xl border border-red-100 bg-red-50/50 p-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-600" aria-hidden />
        </div>
        <h2 className="text-xl font-bold text-[#333333]">{message}</h2>
        <p className="text-sm text-[#767676] max-w-md">
          Aradığınız ürün bulunamadı veya geçici bir sorun oluştu.
          Ürün kataloğundan devam edebilirsiniz.
        </p>
        <Link
          href="/urunler"
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#00179e] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#00179e]/90"
        >
          Ürün Kataloğuna Dön
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildBreadcrumbItems(
  category: CategoryWithParent | null,
  productName: string
) {
  const items: Array<{ label: string; href?: string }> = []

  if (category?.parent?.parent) {
    items.push({
      label: category.parent.parent.name,
      href: `/urunler?kategori=${category.parent.parent.slug}`,
    })
  }
  if (category?.parent) {
    items.push({
      label: category.parent.name,
      href: `/urunler?kategori=${category.parent.slug}`,
    })
  }
  if (category) {
    items.push({
      label: category.name,
      href: `/urunler?kategori=${category.slug}`,
    })
  }
  items.push({ label: productName })

  return items
}

function parseSpecs(
  specs: Record<string, unknown> | null | undefined
): Record<string, string> | null {
  if (!specs || typeof specs !== "object") return null
  const entries = Object.entries(specs)
  if (entries.length === 0) return null
  return specs as Record<string, string>
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [data, setData] = useState<ProductDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    setIsLoading(true)
    setError(null)

    fetch(`/api/catalog/products/${slug}`)
      .then((res) => {
        if (res.status === 404) throw new Error("Ürün bulunamadı.")
        if (!res.ok) throw new Error("Bir hata oluştu.")
        return res.json()
      })
      .then((json: ProductDetailResponse) => setData(json))
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [slug])

  /* Loading */
  if (isLoading) return <ProductDetailSkeleton />

  /* Error */
  if (error) return <ErrorState message={error} />

  /* No data */
  if (!data) return null

  const { product, relatedProducts } = data
  const breadcrumbItems = buildBreadcrumbItems(product.category, product.name)
  const specsData = parseSpecs(product.specs)
  const currency = product.pricing?.currency ?? "USD"

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      {/* ── Breadcrumb ── */}
      <Breadcrumb items={breadcrumbItems} />

      {/* ── Main: Gallery + Info Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Sol: Galeri */}
        <section
          aria-label="Ürün görselleri"
          className="lg:sticky lg:top-4 lg:self-start"
        >
          <ProductGallery
            images={product.images}
            productName={product.name}
          />
        </section>

        {/* Sag: Urun Bilgileri */}
        <section aria-label="Ürün bilgileri" className="space-y-6">
          {/* Marka */}
          {product.brand && (
            <Link
              href={`/urunler?brandId=${product.brand.id}`}
              className="inline-block text-sm font-semibold uppercase tracking-wider text-[#00179e] hover:text-[#00179e]/80 transition-colors"
            >
              {product.brand.name}
            </Link>
          )}

          {/* Urun adi */}
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-[#333333]">
            {product.name}
          </h1>

          {/* Badge'ler */}
          <div className="flex flex-wrap gap-2">
            {product.isNew && (
              <Badge className="rounded-full bg-[#00179e] px-3 py-1 text-xs font-semibold hover:bg-[#00179e]/90">
                Yeni
              </Badge>
            )}
            {product.isOutlet && (
              <Badge className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold hover:bg-red-600/90">
                Outlet
              </Badge>
            )}
            {product.isFeatured && (
              <Badge className="rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold hover:bg-violet-600/90">
                Öne Çıkan
              </Badge>
            )}
          </div>

          {/* Urun kodlari */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-[#f0f0f0] bg-[#f9f9f9] p-4 text-sm">
            {product.barcode && (
              <div className="flex items-center gap-2 text-[#767676]">
                <Barcode className="h-4 w-4 shrink-0" aria-hidden />
                <span>Barkod:</span>
                <span className="font-mono text-[#333333]">
                  {product.barcode}
                </span>
              </div>
            )}
            {product.sku && (
              <div className="flex items-center gap-2 text-[#767676]">
                <Hash className="h-4 w-4 shrink-0" aria-hidden />
                <span>SKU:</span>
                <span className="font-mono text-[#333333]">
                  {product.sku}
                </span>
              </div>
            )}
            {product.modelCode && (
              <div className="flex items-center gap-2 text-[#767676]">
                <Tag className="h-4 w-4 shrink-0" aria-hidden />
                <span>Model:</span>
                <span className="font-mono text-[#333333]">
                  {product.modelCode}
                </span>
              </div>
            )}
            {product.warrantyMonths && (
              <div className="flex items-center gap-2 text-[#767676]">
                <Shield className="h-4 w-4 shrink-0" aria-hidden />
                <span>Garanti:</span>
                <span className="text-[#333333]">
                  {product.warrantyMonths} ay
                </span>
              </div>
            )}
          </div>

          {/* Stok durumu */}
          <StockBadge
            quantity={product.stock.quantity}
            isAvailable={product.stock.isAvailable}
          />

          {/* Fiyat kutusu */}
          {product.pricing ? (
            <div className="rounded-2xl border-2 border-[#00179e]/10 bg-gradient-to-br from-[#f9f9f9] to-white p-5 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-[#767676]">KDV Haric</span>
                <span className="text-lg font-bold text-[#333333]">
                  {formatCurrency(product.pricing.salePriceExVat, currency)}
                </span>
              </div>
              <div className="h-px bg-[#f0f0f0]" />
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-[#767676]">
                  KDV Dahil (%{product.pricing.vatRate})
                </span>
                <span className="text-3xl font-extrabold text-[#00179e]">
                  {formatCurrency(product.pricing.salePriceIncVat, currency)}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#f0f0f0] bg-[#f9f9f9] p-5 text-sm text-[#767676] flex items-center gap-2">
              <Package className="h-4 w-4" aria-hidden />
              Fiyat bilgisi şu an mevcut değil. Lütfen iletişime geçin.
            </div>
          )}

          {/* Sepete ekle */}
          <AddToCartButton
            productId={product.id}
            productName={product.name}
            productSlug={product.slug}
            brandName={product.brand?.name ?? ""}
            imageUrl={product.images?.[0] ?? ""}
            unitPriceExVat={product.pricing?.salePriceExVat ?? 0}
            vatRate={product.pricing?.vatRate ?? 20}
            stockQuantity={product.stock.quantity}
            minOrderQuantity={product.minOrderQuantity}
            isAvailable={product.stock.isAvailable}
          />

          {/* Kisa aciklama */}
          {product.shortDescription && (
            <p className="text-sm leading-relaxed text-[#767676] border-l-2 border-[#00179e]/20 pl-4">
              {product.shortDescription}
            </p>
          )}
        </section>
      </div>

      {/* ── Tabs: Teknik Ozellikler & Aciklama ── */}
      <Tabs
        defaultValue={specsData ? "specs" : "description"}
        className="space-y-4"
      >
        <TabsList className="inline-flex gap-1 rounded-xl bg-[#f9f9f9] p-1">
          <TabsTrigger
            value="specs"
            className="rounded-lg px-5 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-[#00179e] data-[state=active]:shadow-sm"
          >
            Teknik Özellikler
          </TabsTrigger>
          {product.description && (
            <TabsTrigger
              value="description"
              className="rounded-lg px-5 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-[#00179e] data-[state=active]:shadow-sm"
            >
              Açıklama
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="specs">
          {specsData ? (
            <div className="overflow-hidden rounded-2xl border border-[#f0f0f0]">
              <table
                className="w-full text-sm"
                aria-label="Teknik özellikler"
              >
                <thead className="sr-only">
                  <tr>
                    <th>Özellik</th>
                    <th>Değer</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(specsData).map(
                    ([key, value], index) => (
                      <tr
                        key={key}
                        className={
                          index % 2 === 0
                            ? "bg-[#f9f9f9]"
                            : "bg-white"
                        }
                      >
                        <td className="w-1/3 border-r border-[#f0f0f0] px-5 py-3 font-medium text-[#767676]">
                          {key}
                        </td>
                        <td className="px-5 py-3 text-[#333333]">
                          {String(value)}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#f0f0f0] bg-[#f9f9f9] p-10 text-center">
              <p className="text-sm text-[#767676]">
                Bu ürün için teknik özellik bilgisi henüz eklenmemiş.
              </p>
            </div>
          )}
        </TabsContent>

        {product.description && (
          <TabsContent value="description">
            <div className="prose prose-sm max-w-none rounded-2xl border border-[#f0f0f0] bg-white p-6 text-[#333333]">
              <p className="whitespace-pre-wrap leading-relaxed">
                {product.description}
              </p>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* ── Benzer Urunler ── */}
      {relatedProducts.length > 0 && (
        <section aria-label="Benzer ürünler" className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#333333]">
              Benzer Ürünler
            </h2>
            <div className="flex-1 h-px bg-[#f0f0f0]" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {relatedProducts.map((rp) => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
