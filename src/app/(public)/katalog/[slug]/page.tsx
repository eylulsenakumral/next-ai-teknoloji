import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import type { Metadata } from "next"
import Link from "next/link"
import {
  ChevronRight,
  CheckCircle2,
  XCircle,
  Home,
  Tag,
  Lock,
} from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ProductGallery } from "@/components/products/product-gallery"
import { PublicProductCard } from "@/components/public/public-product-card"
import { AskAiButton } from "@/components/public/ask-ai-button"
import { AddToCartButton } from "@/components/products/add-to-cart-button"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PublicBrand {
  name: string
  slug: string
}

interface PublicCategory {
  name: string
  slug: string
}

interface PublicRelatedProduct {
  id: string
  name: string
  slug: string
  images: string[]
  brand: PublicBrand | null
  category: PublicCategory | null
  stockStatus: boolean
  stockCount: number
  hidePrice?: boolean
  price: number | null
  currency: string
  priceTry: number | null
  usdTryRate: number
}

interface SupplierStock {
  depoName: string
  stockQuantity: number
  price: number | null
  currency: string
  priceTry: number | null
}

interface PublicProductDetail {
  id: string
  productCode: string | null
  name: string
  slug: string
  images: string[]
  description: string | null
  specifications: Record<string, unknown> | null
  sku: string | null
  barcode: string | null
  modelCode: string | null
  weight: string | null
  warrantyMonths: number | null
  brand: PublicBrand | null
  category: PublicCategory | null
  categoryPath: PublicCategory[]
  stockStatus: boolean
  stockCount: number
  hidePrice: boolean
  price: number | null
  currency: string
  priceTry: number | null
  usdTryRate: number
  suppliers: SupplierStock[]
  relatedProducts: PublicRelatedProduct[]
}

interface ApiResponse {
  data: PublicProductDetail
}

/* ------------------------------------------------------------------ */
/*  Data Fetching                                                      */
/* ------------------------------------------------------------------ */

async function getProduct(slug: string): Promise<PublicProductDetail | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

  const res = await fetch(`${baseUrl}/api/public/catalog/products/${slug}`, {
    headers: { cookie: cookieHeader },
    next: { revalidate: 300 },
  })

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Ürün yüklenemedi: ${res.status}`)

  const json: ApiResponse = await res.json()
  return json.data
}

/* ------------------------------------------------------------------ */
/*  generateMetadata                                                   */
/* ------------------------------------------------------------------ */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    return {
      title: "Ürün Bulunamadı",
      description: "Aradığınız ürün mevcut değil veya kaldırılmış.",
    }
  }

  const description =
    product.description?.slice(0, 155).replace(/\n/g, " ") ??
    `${product.name}${product.brand ? ` - ${product.brand.name}` : ""}${product.category ? ` | ${product.category.name}` : ""} ürün detayları.`

  const ogImage = product.images[0]

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function parseSpecs(
  specs: Record<string, unknown> | null | undefined
): Array<{ key: string; value: string }> | null {
  if (!specs || typeof specs !== "object") return null
  const entries = Object.entries(specs)
  if (entries.length === 0) return null
  return entries.map(([key, value]) => ({ key, value: String(value) }))
}

/* ------------------------------------------------------------------ */
/*  Breadcrumb                                                         */
/* ------------------------------------------------------------------ */

function ProductBreadcrumb({
  categoryPath,
  productName,
}: {
  categoryPath: PublicCategory[]
  productName: string
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-[12px] text-[#64748b] flex-wrap"
    >
      <Link
        href="/katalog"
        className="flex items-center gap-1 hover:text-[#5086a8] transition-colors"
      >
        <Home className="h-3 w-3" aria-hidden />
        Katalog
      </Link>
      {categoryPath.map((cat) => (
        <span key={cat.slug} className="contents">
          <ChevronRight className="h-3 w-3 text-[#dddddd]" aria-hidden />
          <Link
            href={`/katalog?categorySlug=${cat.slug}`}
            className="hover:text-[#5086a8] transition-colors"
          >
            {cat.name}
          </Link>
        </span>
      ))}
      <ChevronRight className="h-3 w-3 text-[#dddddd]" aria-hidden />
      <span className="text-[#333333] font-semibold truncate max-w-[200px] sm:max-w-none">
        {productName}
      </span>
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/*  StockBadge                                                         */
/* ------------------------------------------------------------------ */

function StockBadge({ inStock }: { inStock: boolean }) {
  if (inStock) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[13px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Stokta Mevcut
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-[13px] font-semibold text-red-700 ring-1 ring-inset ring-red-200">
      <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
      Tükendi
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  CTA — Login Prompt                                                 */
/* ------------------------------------------------------------------ */

function QuoteCTA({ productName }: { productName: string }) {
  return (
    <div className="border border-[#5086a8]/20 bg-gradient-to-br from-[#5086a8]/5 to-white p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#5086a8]/10">
          <Lock className="h-5 w-5 text-[#5086a8]" aria-hidden />
        </div>
        <div className="space-y-1">
          <p className="text-[14px] font-bold text-[#333333]">
            Özel Fiyatlar İçin Bayi Girişi Yapınız
          </p>
          <p className="text-[12px] text-[#64748b] leading-relaxed">
            Bayi girişi yaparak özel fiyatları görüntüleyebilir ve sipariş oluşturabilirsiniz.
          </p>
        </div>
      </div>

      <Link
        href="/login"
        className="flex w-full items-center justify-center gap-2 h-11 bg-[#5086a8] px-5 text-[13px] font-bold text-white uppercase tracking-wider transition-colors hover:bg-[#001489] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5086a8] focus-visible:ring-offset-2"
      >
        <Lock className="h-4 w-4" aria-hidden />
        Bayi Girişi Yap
      </Link>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Specs Table                                                        */
/* ------------------------------------------------------------------ */

function SpecsTable({ specs }: { specs: Array<{ key: string; value: string }> }) {
  return (
    <div className="overflow-hidden border border-[#eeeeee]">
      <table className="w-full text-sm" aria-label="Teknik özellikler">
        <thead className="sr-only">
          <tr>
            <th scope="col">Özellik</th>
            <th scope="col">Değer</th>
          </tr>
        </thead>
        <tbody>
          {specs.map(({ key, value }, index) => (
            <tr
              key={key}
              className={index % 2 === 0 ? "bg-[#f4f7fa]" : "bg-white"}
            >
              <td className="w-2/5 sm:w-1/3 border-r border-[#eeeeee] px-4 py-2.5 text-[12px] font-semibold text-[#64748b] align-top">
                {key}
              </td>
              <td className="px-4 py-2.5 text-[13px] text-[#333333]">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sticky Mobile CTA                                                  */
/* ------------------------------------------------------------------ */

function StickyMobileCTA({ productName }: { productName: string }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white border-t border-[#eeeeee] px-4 py-3 shadow-lg">
      <Link
        href="/login"
        className="flex items-center justify-center gap-2 h-11 w-full bg-[#5086a8] text-white text-[12px] font-bold uppercase tracking-wider hover:bg-[#001489] transition-colors"
      >
        <Lock className="h-4 w-4" aria-hidden />
        Özel Fiyatlar İçin Bayi Girişi Yapınız
      </Link>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function PublicProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) notFound()

  const session = await getServerSession(authOptions)
  const isLoggedIn = !!session?.user

  const specs = parseSpecs(product.specifications)

  return (
    <>
      <div className="bg-[#f5f5f5] pb-20 md:pb-0">
        {/* Breadcrumb band */}
        <div className="bg-white border-b border-[#eeeeee]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <ProductBreadcrumb categoryPath={product.categoryPath || []} productName={product.name} />
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
          {/* Main Grid: Gallery + Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
            {/* Galeri */}
            <section
              aria-label="Ürün görselleri"
              className="bg-white border border-[#eeeeee] p-4 lg:sticky lg:top-4 lg:self-start"
            >
              <ProductGallery
                images={product.images}
                productName={product.name}
              />
            </section>

            {/* Bilgi Paneli */}
            <section aria-label="Ürün bilgileri" className="space-y-5">
              {/* Marka + Kategori */}
              <div className="flex items-center gap-3 flex-wrap">
                {product.brand && (
                  <Link
                    href={`/katalog?brandSlug=${product.brand.slug}`}
                    className="text-[12px] font-bold uppercase tracking-wider text-[#5086a8] hover:text-[#001489] transition-colors"
                  >
                    {product.brand.name}
                  </Link>
                )}
                {product.category && (
                  <Link
                    href={`/katalog?categorySlug=${product.category.slug}`}
                    className="inline-flex items-center gap-1.5 bg-[#f0f0f0] px-2.5 py-1 text-[11px] font-medium text-[#64748b] hover:bg-[#e8e8e8] transition-colors"
                  >
                    <Tag className="h-3 w-3" aria-hidden />
                    {product.category.name}
                  </Link>
                )}
              </div>

              {/* Ürün Adı */}
              <h1 className="text-xl sm:text-2xl font-extrabold leading-tight text-[#333333]">
                {product.name}
              </h1>

              {/* Stok */}
              <div className="flex items-center gap-3 flex-wrap">
                <StockBadge inStock={product.stockStatus} />
                {product.stockStatus && product.stockCount > 0 && (
                  <span className="text-[12px] text-gray-500">
                    {product.stockCount} adet stokta
                  </span>
                )}
                <AskAiButton productName={product.name} />
              </div>

              {/* Ürün Bilgileri */}
              {(product.sku || product.barcode || product.modelCode || product.brand || product.warrantyMonths || product.productCode) && (
                <div className="border border-[#eeeeee] bg-white">
                  <div className="px-4 py-2.5 border-b border-[#eeeeee] bg-[#fafafa]">
                    <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                      Ürün Bilgileri
                    </p>
                  </div>
                  <ul className="divide-y divide-[#f5f5f5]">
                    {product.productCode && (
                      <li className="flex items-center gap-3 px-4 py-2">
                        <span className="text-[12px] text-[#64748b] w-1/3 shrink-0 font-medium">Ürün Kodu</span>
                        <span className="text-[12px] text-[#5086a8] font-bold font-mono bg-[#f0f4ff] px-2 py-0.5 rounded">{product.productCode}</span>
                      </li>
                    )}
                    {product.brand && (
                      <li className="flex items-center gap-3 px-4 py-2">
                        <span className="text-[12px] text-[#64748b] w-1/3 shrink-0 font-medium">Marka</span>
                        <span className="text-[12px] text-[#333333] font-semibold">{product.brand.name}</span>
                      </li>
                    )}
                    {product.modelCode && (
                      <li className="flex items-center gap-3 px-4 py-2">
                        <span className="text-[12px] text-[#64748b] w-1/3 shrink-0 font-medium">Model Kodu</span>
                        <span className="text-[12px] text-[#333333] font-semibold">{product.modelCode}</span>
                      </li>
                    )}
                    {product.sku && (
                      <li className="flex items-center gap-3 px-4 py-2">
                        <span className="text-[12px] text-[#64748b] w-1/3 shrink-0 font-medium">SKU</span>
                        <span className="text-[12px] text-[#333333] font-semibold font-mono">{product.sku}</span>
                      </li>
                    )}
                    {product.barcode && (
                      <li className="flex items-center gap-3 px-4 py-2">
                        <span className="text-[12px] text-[#64748b] w-1/3 shrink-0 font-medium">Barkod</span>
                        <span className="text-[12px] text-[#333333] font-semibold font-mono">{product.barcode}</span>
                      </li>
                    )}
                    {product.warrantyMonths && (
                      <li className="flex items-center gap-3 px-4 py-2">
                        <span className="text-[12px] text-[#64748b] w-1/3 shrink-0 font-medium">Garanti</span>
                        <span className="text-[12px] text-[#333333] font-semibold">{product.warrantyMonths} ay</span>
                      </li>
                    )}
                    {product.weight && (
                      <li className="flex items-center gap-3 px-4 py-2">
                        <span className="text-[12px] text-[#64748b] w-1/3 shrink-0 font-medium">Ağırlık</span>
                        <span className="text-[12px] text-[#333333] font-semibold">{product.weight} kg</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Kısa açıklama */}
              {product.description && (
                <div className="text-[13px] leading-relaxed text-[#64748b] border-l-2 border-[#5086a8]/20 pl-3">
                  <p className="line-clamp-3">{product.description}</p>
                  <a
                    href="#description-heading"
                    className="inline-block mt-1 text-[#5086a8] font-semibold text-[12px] hover:underline"
                  >
                    Devamını Oku ↓
                  </a>
                </div>
              )}

              {/* Fiyat / Depo / CTA — Desktop */}
              <div className="hidden md:block">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Fiyat veya Login CTA */}
                  {isLoggedIn && product.hidePrice ? (
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#a60811]/10">
                          <Lock className="h-5 w-5 text-[#a60811]" aria-hidden />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[14px] font-bold text-[#a60811]">Müşteri Temsilcinizden Özel Fiyat Alınız</p>
                          <p className="text-[12px] text-[#64748b]">Bu ürün için fiyat bilgisi müşteri temsilcinizden alınmaktadır.</p>
                        </div>
                      </div>
                    </div>
                  ) : isLoggedIn && product.price != null ? (
                    <div className="p-5">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Bayi Fiyatı</p>
                          <p className="text-[28px] font-bold text-[#5086a8] leading-none">
                            {new Intl.NumberFormat("tr-TR", { style: "currency", currency: product.currency || "TRY", minimumFractionDigits: 2 }).format(product.price)}
                            <span className="text-[12px] font-medium text-gray-400 ml-1.5">+KDV</span>
                          </p>
                          <p className="text-[13px] text-gray-500 mt-1.5">
                            {new Intl.NumberFormat("tr-TR", { style: "currency", currency: product.currency || "TRY", minimumFractionDigits: 2 }).format(product.price * 1.20)}
                            <span className="text-[11px] text-gray-400 ml-1">KDV Dahil</span>
                          </p>
                        </div>
                        {product.currency !== "TRY" && product.priceTry != null && product.usdTryRate > 0 && (
                          <div className="text-right">
                            <p className="text-[11px] text-gray-400 mb-1">TL Karşılığı</p>
                            <p className="text-xl font-semibold text-gray-700 leading-none">
                              {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(product.priceTry)}
                              <span className="text-[11px] font-medium text-gray-400 ml-1">+KDV</span>
                            </p>
                            <p className="text-[12px] text-gray-500 mt-1">
                              {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(product.priceTry * 1.20)}
                              <span className="text-[10px] text-gray-400 ml-0.5">KDV Dahil</span>
                            </p>
                            <p className="text-[10px] text-gray-300 mt-1.5">TCMB: 1 USD = {product.usdTryRate.toFixed(2)} TL</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : !isLoggedIn && !product.hidePrice ? (
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5086a8]/10">
                          <Lock className="h-5 w-5 text-[#5086a8]" aria-hidden />
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-[14px] font-bold text-[#333333]">Özel Fiyatlar İçin Bayi Girişi</p>
                          <p className="text-[12px] text-[#64748b]">Bayi girişi yaparak fiyatları görüntüleyin.</p>
                          <Link href="/login" className="inline-flex items-center justify-center gap-2 h-9 px-5 bg-[#5086a8] text-[12px] font-bold text-white rounded-xl hover:bg-[#003080] transition-colors">
                            <Lock className="h-3.5 w-3.5" aria-hidden />
                            Bayi Girişi Yap
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Depo Stokları — her zaman görünür */}
                  {product.suppliers && product.suppliers.length > 0 && (
                    <div className="border-t border-gray-50 bg-gray-50/50 px-5 py-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Depo Stokları</p>
                      <div className="space-y-1.5">
                        {product.suppliers.map((s) => (
                          <div key={s.depoName} className="flex items-center justify-between text-[12px]">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              <span className="text-gray-500">{s.depoName}</span>
                            </div>
                            <span className="text-emerald-600 font-medium">{s.stockQuantity} adet</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Sepete Ekle */}
                  {isLoggedIn && !product.hidePrice && product.price != null && (
                    <div className="border-t border-gray-100 px-5 py-4 flex justify-end">
                      <AddToCartButton
                        productId={product.id}
                        productName={product.name}
                        productSlug={product.slug}
                        brandName={product.brand?.name ?? ""}
                        imageUrl={product.images?.[0] ?? ""}
                        unitPriceExVat={product.price ?? 0}
                        vatRate={20}
                        stockQuantity={product.stockCount}
                        isAvailable={product.stockStatus}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Özellik özeti — ilk 5 spec */}
              {specs && specs.length > 0 && (
                <div className="border border-[#eeeeee] bg-white">
                  <div className="px-4 py-2.5 border-b border-[#eeeeee] bg-[#fafafa]">
                    <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                      Öne Çıkan Özellikler
                    </p>
                  </div>
                  <ul className="divide-y divide-[#f5f5f5]">
                    {specs.slice(0, 5).map(({ key, value }) => (
                      <li key={key} className="flex items-center gap-3 px-4 py-2">
                        <span className="text-[12px] text-[#64748b] w-1/3 shrink-0 font-medium">
                          {key}
                        </span>
                        <span className="text-[12px] text-[#333333] font-semibold flex-1 truncate">
                          {value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>

          {/* Teknik Özellikler — tam tablo */}
          {specs && specs.length > 0 && (
            <section aria-labelledby="specs-heading" className="space-y-3">
              <h2
                id="specs-heading"
                className="text-[17px] font-bold text-[#333333] border-b border-[#eeeeee] pb-2"
              >
                Teknik Özellikler
              </h2>
              <SpecsTable specs={specs} />
            </section>
          )}

          {/* Açıklama */}
          {product.description && (
            <section aria-labelledby="description-heading" className="space-y-3">
              <h2
                id="description-heading"
                className="text-[17px] font-bold text-[#333333] border-b border-[#eeeeee] pb-2"
              >
                Ürün Açıklaması
              </h2>
              <div className="bg-white border border-[#eeeeee] p-5 text-[13px] text-[#555555] leading-relaxed whitespace-pre-wrap">
                {product.description}
              </div>
            </section>
          )}

          {/* İlgili Ürünler */}
          {product.relatedProducts.length > 0 && (
            <section aria-labelledby="related-heading" className="space-y-4">
              <div className="flex items-center gap-3">
                <h2
                  id="related-heading"
                  className="text-[17px] font-bold text-[#333333] whitespace-nowrap"
                >
                  Benzer Ürünler
                </h2>
                <div className="flex-1 h-px bg-[#eeeeee]" aria-hidden />
                <Link
                  href={
                    product.category
                      ? `/katalog?categorySlug=${product.category.slug}`
                      : "/katalog"
                  }
                  className="text-[12px] font-semibold text-[#5086a8] hover:text-[#001489] transition-colors whitespace-nowrap"
                >
                  Tümünü Gör
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {product.relatedProducts.filter((rp) => rp.stockCount > 0).map((rp) => (
                  <PublicProductCard key={rp.id} product={rp} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Sticky Fiyat / CTA — mobile */}
      {!isLoggedIn && !product.hidePrice && <StickyMobileCTA productName={product.name} />}
      {isLoggedIn && product.hidePrice && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#a60811]/20 px-4 py-3 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <p className="text-[13px] font-bold text-[#a60811] text-center">
            Müşteri Temsilcinizden Özel Fiyat Alınız
          </p>
        </div>
      )}
      {isLoggedIn && !product.hidePrice && product.price != null && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[16px] font-bold text-[#5086a8] leading-none">
                {new Intl.NumberFormat("tr-TR", { style: "currency", currency: product.currency || "TRY", minimumFractionDigits: 2 }).format(product.price)}
                <span className="text-[10px] font-medium text-gray-400 ml-1">+KDV</span>
              </p>
              {product.currency !== "TRY" && product.priceTry != null && (
                <p className="text-[11px] text-gray-500 mt-0.5">
                  ≈ {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(product.priceTry)} +KDV
                </p>
              )}
            </div>
            <div className="shrink-0">
              <AddToCartButton
                productId={product.id}
                productName={product.name}
                productSlug={product.slug}
                brandName={product.brand?.name ?? ""}
                imageUrl={product.images[0] ?? ""}
                unitPriceExVat={product.price ?? 0}
                vatRate={20}
                stockQuantity={product.stockCount}
                isAvailable={product.stockStatus}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
