export const dynamic = 'force-dynamic'

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { calculateBulkPrices } from "@/services/pricing.service"
import {
  Breadcrumb,
  ProductImageGallery,
  ProductDetails,
  ProductSpecsTable,
  RelatedProducts,
  CustomerReviews,
  ProductQA,
} from "./components"

/* ------------------------------------------------------------------ */
/*  Metadata                                                            */
/* ------------------------------------------------------------------ */

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, shortDescription: true, images: true, brand: { select: { name: true } } },
  })

  if (!product) return { title: "Ürün Bulunamadı" }

  const title = `${product.name} | Next AI Teknoloji`
  const description =
    product.shortDescription ??
    `${product.name} - ${product.brand?.name ?? ""}. En iyi fiyat teklifi için hemen bize ulaşın.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.images[0] ? [{ url: product.images[0] }] : [],
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug, deletedAt: null, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      shortDescription: true,
      images: true,
      specs: true,
      warrantyMonths: true,
      minOrderQuantity: true,
      unit: true,
      isNew: true,
      isFeatured: true,
      manualPrice: true,
      manualPriceCurrency: true,
      campaignDiscountPct: true,
      viewCount: true,
      brand: { select: { name: true, slug: true } },
      category: {
        select: {
          name: true,
          slug: true,
          parent: { select: { name: true, slug: true } },
        },
      },
      supplierProducts: {
        where: { supplier: { isActive: true, deletedAt: null } },
        select: { stockQuantity: true },
        take: 1,
      },
    },
  })

  if (!product) notFound()

  // Calculate price
  const priceMap = await calculateBulkPrices([product.id])
  const pricing = priceMap.get(product.id)
  const manualPrice = product.manualPrice ? Number(product.manualPrice) : null
  const manualPriceCurrency = product.manualPriceCurrency ?? "USD"
  const displayPrice = manualPrice ?? pricing?.salePriceExVat ?? null
  const displayCurrency = manualPrice ? manualPriceCurrency : "USD"
  const displayPriceIncVat = displayPrice ? displayPrice * 1.20 : null
  const displayOriginalPrice = manualPrice != null && pricing?.salePriceExVat != null
    ? pricing.salePriceExVat
    : null

  // Increment view count (fire and forget)
  prisma.product.update({
    where: { id: product.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {})

  const stockStatus =
    product.supplierProducts.length > 0
      ? product.supplierProducts.some((sp) => (sp.stockQuantity ?? 0) > 0)
      : true

  // Related products (same category)
  const relatedProducts = product.category
    ? await prisma.product.findMany({
        where: {
          categoryId: undefined,
          category: { slug: product.category.slug },
          deletedAt: null,
          isActive: true,
          id: { not: product.id },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          images: true,
          brand: { select: { name: true, slug: true } },
          supplierProducts: {
            where: { supplier: { isActive: true, deletedAt: null } },
            select: { stockQuantity: true },
            take: 1,
          },
        },
        take: 4,
        orderBy: { viewCount: "desc" },
      })
    : []

  // Build breadcrumb
  const breadcrumbItems = [
    { label: "Ana Sayfa", href: "/" },
    ...(product.category?.parent
      ? [
          {
            label: product.category.parent.name,
            href: `/kategori/${product.category.parent.slug}`,
          },
        ]
      : []),
    ...(product.category
      ? [
          {
            label: product.category.name,
            href: `/kategori/${product.category.slug}`,
          },
        ]
      : []),
    { label: product.name },
  ]

  // JSON-LD Product schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? product.shortDescription ?? "",
    image: product.images,
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    offers: {
      "@type": "Offer",
      availability: stockStatus
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Next AI Teknoloji" },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="bg-white min-h-screen">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Breadcrumb items={breadcrumbItems} />

          {/* Main Product Layout: 60/40 two column */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-12">
            {/* Left: Image Gallery (60%) */}
            <div className="md:col-span-3">
              <ProductImageGallery
                images={product.images}
                productName={product.name}
              />
            </div>

            {/* Right: Product Details (40%) */}
            <div className="md:col-span-2">
              <ProductDetails
                name={product.name}
                brand={product.brand}
                description={product.description ?? product.shortDescription ?? null}
                stockStatus={stockStatus}
                specs={product.specs as Record<string, unknown> | null}
                price={displayPrice}
                priceCurrency={displayCurrency}
                priceIncVat={displayPriceIncVat}
                campaignDiscountPct={product.campaignDiscountPct ? Number(product.campaignDiscountPct) : null}
                originalPrice={displayOriginalPrice}
              />

              {/* Specs Table */}
              <ProductSpecsTable
                specs={product.specs as Record<string, unknown> | null}
              />
            </div>
          </div>

          {/* Related Products */}
          <RelatedProducts
            products={relatedProducts.map((rp) => ({
              ...rp,
              stockStatus: rp.supplierProducts.some(
                (sp) => (sp.stockQuantity ?? 0) > 0
              ),
            }))}
          />

          {/* Customer Reviews */}
          <CustomerReviews />

          {/* Product Q&A */}
          <ProductQA />

          {/* Bottom spacer */}
          <div className="h-16" />
        </div>
      </div>
    </>
  )
}
