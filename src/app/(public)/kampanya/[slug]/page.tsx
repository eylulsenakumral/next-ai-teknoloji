import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ChevronRight, Tag, Calendar, Package } from "lucide-react"
import { AddSetToCartButton } from "./add-set-to-cart-button"

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface CampaignSetProduct {
  id: string
  label: string | null
  sortOrder: number
  product: {
    id: string
    name: string
    slug: string
    images: string[]
    description: string | null
    stockStatus: boolean
    brand: { name: string; slug: string } | null
    category: { name: string; slug: string } | null
  }
}

interface CampaignSet {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  type: "OUTLET" | "FEATURED" | "BUNDLE"
  discountPct: string | null
  price: string | null
  currency: string | null
  stockQuantity: number | null
  validFrom: string | null
  validUntil: string | null
  products: CampaignSetProduct[]
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                            */
/* ------------------------------------------------------------------ */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  try {
    const res = await fetch(`${baseUrl}/api/public/campaigns/${slug}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return { title: "Kampanya" }
    const { data } = await res.json()
    return {
      title: data.name,
      description: data.description ?? `${data.name} kampanyası ürünlerini inceleyin.`,
    }
  } catch {
    return { title: "Kampanya" }
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const TYPE_LABELS: Record<string, string> = {
  FEATURED: "Öne Çıkan",
  OUTLET: "Outlet",
  BUNDLE: "Paket",
}

const TYPE_COLORS: Record<string, string> = {
  FEATURED: "bg-[#0040a4] text-white",
  OUTLET: "bg-[#a60811] text-white",
  BUNDLE: "bg-[#3b7300] text-white",
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr))
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default async function KampanyaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  let campaign: CampaignSet | null = null
  try {
    const res = await fetch(`${baseUrl}/api/public/campaigns/${slug}`, {
      next: { revalidate: 60 },
    })
    if (res.status === 404) {
      notFound()
    }
    if (res.ok) {
      const json = await res.json()
      campaign = json.data
    }
  } catch {
    notFound()
  }

  if (!campaign) notFound()

  const discountPct = campaign.discountPct ? Math.round(Number(campaign.discountPct)) : null
  const validFromStr = formatDate(campaign.validFrom)
  const validUntilStr = formatDate(campaign.validUntil)

  return (
    <div className="bg-white min-h-screen">
      {/* Page Header */}
      <div className="bg-[#f3f3f3] border-b border-[#e9e9e9]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[12px] text-[#767676] mb-4">
            <Link href="/" className="hover:text-[#0040a4] transition-colors">Ana Sayfa</Link>
            <ChevronRight className="h-3 w-3" aria-hidden />
            <Link href="/kampanya" className="hover:text-[#0040a4] transition-colors">Kampanyalar</Link>
            <ChevronRight className="h-3 w-3" aria-hidden />
            <span className="text-[#1e1e1e] font-semibold truncate max-w-[200px]">{campaign.name}</span>
          </nav>

          <div className="flex flex-wrap items-start gap-4">
            <div className="flex-1 min-w-0">
              {/* Type badge */}
              <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-md mb-3 ${TYPE_COLORS[campaign.type] ?? "bg-[#0040a4] text-white"}`}>
                {TYPE_LABELS[campaign.type] ?? campaign.type}
              </span>

              <h1 className="text-[28px] md:text-[36px] font-bold text-[#1e1e1e] leading-tight mb-2">
                {campaign.name}
              </h1>

              {campaign.description && (
                <p className="text-[15px] text-[#767676] leading-relaxed max-w-2xl">
                  {campaign.description}
                </p>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <span className="inline-flex items-center gap-1.5 text-[13px] text-[#767676]">
                  <Tag className="h-3.5 w-3.5" aria-hidden />
                  {campaign.products.length} ürün
                </span>
                {discountPct ? (
                  <span className="inline-flex items-center gap-1 text-[13px] font-bold text-[#3b7300]">
                    %{discountPct} indirim
                  </span>
                ) : null}
                {(validFromStr || validUntilStr) && (
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-[#767676]">
                    <Calendar className="h-3.5 w-3.5" aria-hidden />
                    {validFromStr && validUntilStr
                      ? `${validFromStr} – ${validUntilStr}`
                      : validUntilStr
                        ? `Son: ${validUntilStr}`
                        : `Başlangıç: ${validFromStr}`}
                  </span>
                )}
              </div>
            </div>

            {/* Campaign banner image */}
            {campaign.imageUrl && (
              <div className="relative w-full sm:w-48 h-28 rounded-xl overflow-hidden shrink-0">
                <Image
                  src={campaign.imageUrl}
                  alt={campaign.name}
                  fill
                  sizes="192px"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid + Add to Cart */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {campaign.products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4 border-2 border-dashed border-gray-300 rounded-[20px] bg-[#f3f3f3]/50">
            <Tag className="h-12 w-12 text-gray-400" aria-hidden />
            <p className="text-base font-semibold text-gray-600">Bu kampanyada henüz ürün bulunmuyor.</p>
          </div>
        ) : (
          <>
            {/* Set Info Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 bg-[#f3f3f3] rounded-xl border border-[#e9e9e9]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#0040a4]" />
                  <span className="text-sm font-semibold text-[#1e1e1e]">
                    {campaign.products.length} ürün
                  </span>
                </div>
                {campaign.stockQuantity != null && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded ${campaign.stockQuantity > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {campaign.stockQuantity > 0 ? `Stok: ${campaign.stockQuantity} adet` : 'Stokta yok'}
                  </span>
                )}
              </div>
              <AddSetToCartButton
                setId={campaign.id}
                setName={campaign.name}
                products={campaign.products.map((cp) => ({
                  id: cp.product.id,
                  name: cp.product.name,
                  slug: cp.product.slug,
                  images: cp.product.images,
                  brand: cp.product.brand,
                  stockStatus: cp.product.stockStatus,
                  quantity: cp.quantity,
                }))}
                setPrice={campaign.price}
                discountPct={discountPct}
                currency={campaign.currency ?? "TRY"}
                stockQuantity={campaign.stockQuantity}
              />
            </div>

            {/* Product Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[30px]">
              {campaign.products.map((cp) => (
                <Link
                  key={cp.id}
                  href={`/katalog/${cp.product.slug}`}
                  className="group bg-[#f3f3f3] rounded-[20px] overflow-hidden hover:shadow-[0_8px_25px_rgba(187,187,187,0.5)] hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  <div className="relative aspect-square bg-white overflow-hidden rounded-t-[20px]">
                    {cp.product.images?.[0] ? (
                      <Image
                        src={cp.product.images[0]}
                        alt={cp.product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-contain p-6 transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#f9f9f9]">
                        <Package className="h-14 w-14 text-[#e0e0e0]" />
                      </div>
                    )}
                    {!cp.product.stockStatus && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-t-[20px]">
                        <div className="w-20 h-20 bg-[#a60811] rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-center text-sm">Stok<br />Yok</span>
                        </div>
                      </div>
                    )}
                    {cp.quantity > 1 && (
                      <span className="absolute top-3 right-3 bg-[#0040a4] text-white text-xs font-bold px-2 py-1 rounded-lg">
                        x{cp.quantity}
                      </span>
                    )}
                  </div>
                  <div className="p-3 flex flex-col gap-1 flex-1">
                    {cp.product.brand && (
                      <p className="text-[11px] font-bold text-[#bebebe] uppercase tracking-wider truncate">
                        {cp.product.brand.name}
                      </p>
                    )}
                    <p className="text-[13px] font-semibold text-[#1e1e1e] leading-snug line-clamp-2 group-hover:text-[#0040a4] transition-colors">
                      {cp.product.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
