import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import {
  ChevronRight,
  CheckCircle2,
  XCircle,
  Home,
  Tag,
  MessageCircle,
  Phone,
} from "lucide-react"
import { ProductGallery } from "@/components/products/product-gallery"
import { PublicProductCard } from "@/components/public/public-product-card"

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
}

interface PublicProductDetail {
  id: string
  name: string
  slug: string
  images: string[]
  description: string | null
  specifications: Record<string, unknown> | null
  brand: PublicBrand | null
  category: PublicCategory | null
  stockStatus: boolean
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
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  const res = await fetch(`${baseUrl}/api/public/catalog/products/${slug}`, {
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
  category,
  productName,
}: {
  category: PublicCategory | null
  productName: string
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-[12px] text-[#767676] flex-wrap"
    >
      <Link
        href="/katalog"
        className="flex items-center gap-1 hover:text-[#00179e] transition-colors"
      >
        <Home className="h-3 w-3" aria-hidden />
        Katalog
      </Link>
      {category && (
        <>
          <ChevronRight className="h-3 w-3 text-[#dddddd]" aria-hidden />
          <Link
            href={`/katalog?categorySlug=${category.slug}`}
            className="hover:text-[#00179e] transition-colors"
          >
            {category.name}
          </Link>
        </>
      )}
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
  const waText = encodeURIComponent(`Merhaba, ${productName} ürünü hakkında fiyat teklifi almak istiyorum.`)
  return (
    <div className="border border-[#00179e]/20 bg-gradient-to-br from-[#00179e]/5 to-white p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#00179e]/10">
          <MessageCircle className="h-5 w-5 text-[#00179e]" aria-hidden />
        </div>
        <div className="space-y-1">
          <p className="text-[14px] font-bold text-[#333333]">
            Hemen Teklif Alın
          </p>
          <p className="text-[12px] text-[#767676] leading-relaxed">
            WhatsApp üzerinden hızlı fiyat teklifi alın. En kısa sürede dönüş yapalım.
          </p>
        </div>
      </div>

      <a
        href={`https://wa.me/905529895959?text=${waText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 h-11 bg-[#00179e] px-5 text-[13px] font-bold text-white uppercase tracking-wider transition-colors hover:bg-[#001489] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00179e] focus-visible:ring-offset-2"
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        WhatsApp ile Teklif İste
      </a>

      <p className="text-center text-[12px] text-[#767676]">
        Veya{" "}
        <a
          href="tel:+905529895959"
          className="font-semibold text-[#00179e] underline-offset-2 hover:underline"
        >
          0 552 989 5959
        </a>
        numarasından bizi arayın
      </p>
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
              className={index % 2 === 0 ? "bg-[#f9f9f9]" : "bg-white"}
            >
              <td className="w-2/5 sm:w-1/3 border-r border-[#eeeeee] px-4 py-2.5 text-[12px] font-semibold text-[#767676] align-top">
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
  const waText = encodeURIComponent(`Merhaba, ${productName} ürünü hakkında fiyat teklifi almak istiyorum.`)
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white border-t border-[#eeeeee] px-4 py-3 flex gap-3 shadow-lg">
      <a
        href={`https://wa.me/905529895959?text=${waText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 h-11 bg-[#00179e] text-white text-[13px] font-bold uppercase tracking-wider hover:bg-[#001489] transition-colors"
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        Teklif İste
      </a>
      <a
        href="tel:+905529895959"
        className="flex items-center justify-center gap-2 h-11 px-4 border border-[#00179e] text-[#00179e] text-[12px] font-semibold hover:bg-[#00179e]/5 transition-colors whitespace-nowrap"
      >
        <Phone className="h-4 w-4" aria-hidden />
        Ara
      </a>
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

  const specs = parseSpecs(product.specifications)

  return (
    <>
      <div className="bg-[#f5f5f5] pb-20 md:pb-0">
        {/* Breadcrumb band */}
        <div className="bg-white border-b border-[#eeeeee]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <ProductBreadcrumb category={product.category} productName={product.name} />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
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
                    className="text-[12px] font-bold uppercase tracking-wider text-[#00179e] hover:text-[#001489] transition-colors"
                  >
                    {product.brand.name}
                  </Link>
                )}
                {product.category && (
                  <Link
                    href={`/katalog?categorySlug=${product.category.slug}`}
                    className="inline-flex items-center gap-1.5 bg-[#f0f0f0] px-2.5 py-1 text-[11px] font-medium text-[#767676] hover:bg-[#e8e8e8] transition-colors"
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
              <StockBadge inStock={product.stockStatus} />

              {/* Kısa açıklama */}
              {product.description && (
                <p className="text-[13px] leading-relaxed text-[#767676] border-l-2 border-[#00179e]/20 pl-3 line-clamp-3">
                  {product.description}
                </p>
              )}

              {/* CTA — Desktop */}
              <div className="hidden md:block">
                <QuoteCTA productName={product.name} />
              </div>

              {/* Özellik özeti — ilk 5 spec */}
              {specs && specs.length > 0 && (
                <div className="border border-[#eeeeee] bg-white">
                  <div className="px-4 py-2.5 border-b border-[#eeeeee] bg-[#fafafa]">
                    <p className="text-[11px] font-bold text-[#767676] uppercase tracking-wider">
                      Öne Çıkan Özellikler
                    </p>
                  </div>
                  <ul className="divide-y divide-[#f5f5f5]">
                    {specs.slice(0, 5).map(({ key, value }) => (
                      <li key={key} className="flex items-center gap-3 px-4 py-2">
                        <span className="text-[12px] text-[#767676] w-1/3 shrink-0 font-medium">
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
                  className="text-[12px] font-semibold text-[#00179e] hover:text-[#001489] transition-colors whitespace-nowrap"
                >
                  Tümünü Gör
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {product.relatedProducts.map((rp) => (
                  <PublicProductCard key={rp.id} product={rp} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Sticky CTA — mobile */}
      <StickyMobileCTA productName={product.name} />
    </>
  )
}
