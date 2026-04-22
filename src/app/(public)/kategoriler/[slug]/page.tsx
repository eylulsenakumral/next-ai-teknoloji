import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import {
  ChevronRight,
  Home,
  ArrowRight,
  Package,
  ImageOff,
  Monitor,
  Camera,
  Wifi,
  HardDrive,
  Headphones,
  Shield,
  Server,
  Tag,
  Lock,
} from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
  PublicProductCard,
  type PublicProduct,
} from "@/components/public/public-product-card"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BreadcrumbItem {
  id: string
  name: string
  slug: string
  depth: number
}

interface CategoryChild {
  id: string
  name: string
  slug: string
  parentId: string | null
  depth: number
  productCount: number
  childrenCount: number
  children: CategoryChild[]
}

interface CategoryDetail {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  depth: number
  parentId: string | null
  productCount: number
  breadcrumb: BreadcrumbItem[]
  children: CategoryChild[]
}

interface ProductsMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  bilgisayar: <Monitor className="h-6 w-6" aria-hidden />,
  "guvenlik-kameralari": <Camera className="h-6 w-6" aria-hidden />,
  "guvenlik-sistemleri": <Shield className="h-6 w-6" aria-hidden />,
  network: <Wifi className="h-6 w-6" aria-hidden />,
  depolama: <HardDrive className="h-6 w-6" aria-hidden />,
  sunucu: <Server className="h-6 w-6" aria-hidden />,
  aksesuar: <Headphones className="h-6 w-6" aria-hidden />,
}

function getCategoryIcon(slug: string): React.ReactNode {
  return CATEGORY_ICONS[slug] ?? <Tag className="h-6 w-6" aria-hidden />
}

const PRODUCTS_PER_PAGE = 20

/* ------------------------------------------------------------------ */
/*  Data Fetching                                                      */
/* ------------------------------------------------------------------ */

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

async function getCategory(slug: string): Promise<CategoryDetail | null> {
  const res = await fetch(`${BASE_URL}/api/public/categories/${slug}`, {
    next: { revalidate: 300 },
  })

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Kategori yuklenemedi: ${res.status}`)

  const json = await res.json()
  return json.data
}

async function getProducts(
  categorySlug: string,
  page: number
): Promise<{ products: PublicProduct[]; meta: ProductsMeta }> {
  const params = new URLSearchParams()
  params.set("categorySlug", categorySlug)
  params.set("page", String(page))
  params.set("limit", String(PRODUCTS_PER_PAGE))

  const res = await fetch(`${BASE_URL}/api/public/catalog/products?${params.toString()}`, {
    next: { revalidate: 300 },
  })

  if (!res.ok) return { products: [], meta: { total: 0, page: 1, limit: PRODUCTS_PER_PAGE, totalPages: 0 } }

  const json = await res.json()
  return {
    products: json.data ?? [],
    meta: json.meta ?? { total: 0, page: 1, limit: PRODUCTS_PER_PAGE, totalPages: 0 },
  }
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
  const category = await getCategory(slug)

  if (!category) {
    return {
      title: "Kategori Bulunamadı",
      description: "Aradığınız kategori mevcut değil veya kaldırılmış.",
    }
  }

  const description =
    category.description?.slice(0, 155).replace(/\n/g, " ") ??
    `${category.name} kategorisindeki ürünleri inceleyin. ${category.productCount}+ ürün Next AI Teknoloji'de.`

  return {
    title: category.name,
    description,
    openGraph: {
      title: `${category.name} | Next AI Teknoloji`,
      description,
      ...(category.imageUrl ? { images: [{ url: category.imageUrl }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} | Next AI Teknoloji`,
      description,
      ...(category.imageUrl ? { images: [category.imageUrl] } : {}),
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Breadcrumb                                                         */
/* ------------------------------------------------------------------ */

function CategoryBreadcrumb({
  breadcrumb,
  currentName,
}: {
  breadcrumb: BreadcrumbItem[]
  currentName: string
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-[12px] text-[#767676] flex-wrap"
    >
      <Link
        href="/katalog"
        className="flex items-center gap-1 hover:text-[#0040a4] transition-colors"
      >
        <Home className="h-3 w-3" aria-hidden />
        Katalog
      </Link>
      {breadcrumb.map((item) => (
        <span key={item.id} className="contents">
          <ChevronRight className="h-3 w-3 text-[#dddddd]" aria-hidden />
          <Link
            href={`/kategoriler/${item.slug}`}
            className="hover:text-[#0040a4] transition-colors"
          >
            {item.name}
          </Link>
        </span>
      ))}
      <ChevronRight className="h-3 w-3 text-[#dddddd]" aria-hidden />
      <span className="text-[#333333] font-semibold">{currentName}</span>
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/*  SubCategoryCard                                                    */
/* ------------------------------------------------------------------ */

function SubCategoryCard({ child }: { child: CategoryChild }) {
  const hasChildren = child.childrenCount > 0

  return (
    <Link
      href={`/kategoriler/${child.slug}`}
      className="group flex items-center gap-4 bg-white border border-[#eeeeee] p-4 hover:border-[#0040a4]/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Ikon */}
      <div className="flex items-center justify-center w-11 h-11 shrink-0 bg-[#0040a4]/5 text-[#0040a4] group-hover:bg-[#0040a4]/10 transition-colors">
        {getCategoryIcon(child.slug)}
      </div>

      {/* Bilgi */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-[#333333] group-hover:text-[#0040a4] transition-colors truncate">
          {child.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-[12px] text-[#767676]">
          <span>{child.productCount} ürün</span>
          {hasChildren && (
            <>
              <span className="text-[#dddddd]" aria-hidden>|</span>
              <span>{child.childrenCount} alt kategori</span>
            </>
          )}
        </div>
      </div>

      <ArrowRight className="h-4 w-4 text-[#cccccc] group-hover:text-[#0040a4] group-hover:translate-x-1 transition-all duration-200 shrink-0" aria-hidden />
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/*  Pagination (Server Component)                                      */
/* ------------------------------------------------------------------ */

function Pagination({
  currentSlug,
  currentPage,
  totalPages,
}: {
  currentSlug: string
  currentPage: number
  totalPages: number
}) {
  if (totalPages <= 1) return null

  const pages: number[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else if (currentPage <= 4) {
    for (let i = 1; i <= 7; i++) pages.push(i)
  } else if (currentPage >= totalPages - 3) {
    for (let i = totalPages - 6; i <= totalPages; i++) pages.push(i)
  } else {
    for (let i = currentPage - 3; i <= currentPage + 3; i++) pages.push(i)
  }

  return (
    <nav aria-label="Sayfalama" className="flex items-center justify-center gap-1 pt-6">
      {currentPage > 1 && (
        <Link
          href={`/kategoriler/${currentSlug}?page=${currentPage - 1}`}
          aria-label="Onceki sayfa"
          className="inline-flex items-center justify-center h-9 w-9 border border-[#eeeeee] bg-white text-[#767676] hover:border-[#0040a4] hover:text-[#0040a4] transition-colors rounded"
        >
          <ChevronRight className="h-4 w-4 rotate-180" aria-hidden />
        </Link>
      )}

      {pages.map((pageNum) => (
        <Link
          key={pageNum}
          href={`/kategoriler/${currentSlug}?page=${pageNum}`}
          aria-label={`Sayfa ${pageNum}`}
          aria-current={pageNum === currentPage ? "page" : undefined}
          className={`inline-flex items-center justify-center h-9 w-9 text-[13px] font-semibold transition-colors rounded ${
            pageNum === currentPage
              ? "bg-[#0040a4] text-white border border-[#0040a4]"
              : "bg-white border border-[#eeeeee] text-[#333333] hover:border-[#0040a4] hover:text-[#0040a4]"
          }`}
        >
          {pageNum}
        </Link>
      ))}

      {currentPage < totalPages && (
        <Link
          href={`/kategoriler/${currentSlug}?page=${currentPage + 1}`}
          aria-label="Sonraki sayfa"
          className="inline-flex items-center justify-center h-9 w-9 border border-[#eeeeee] bg-white text-[#767676] hover:border-[#0040a4] hover:text-[#0040a4] transition-colors rounded"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const currentPage = Math.max(1, Number(resolvedSearchParams.page ?? "1"))

  const session = await getServerSession(authOptions)
  const isLoggedIn = !!session?.user

  const [category, productsData] = await Promise.all([
    getCategory(slug),
    getProducts(slug, currentPage),
  ])

  if (!category) notFound()

  const { products, meta } = productsData

  return (
    <div className="bg-[#f9f9f9] min-h-screen pb-20 md:pb-0">
      {/* Breadcrumb band */}
      <div className="bg-white border-b border-[#eeeeee]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <CategoryBreadcrumb breadcrumb={category.breadcrumb} currentName={category.name} />
        </div>
      </div>

      {/* Kategori Hero */}
      <div className="bg-gradient-to-r from-[#0040a4] to-[#4da6ff] text-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="flex items-start gap-5">
            {/* Kategori ikonu / gorsel */}
            <div className="hidden sm:flex items-center justify-center w-16 h-16 shrink-0 bg-white/10 text-white">
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  width={64}
                  height={64}
                  className="object-contain"
                />
              ) : (
                getCategoryIcon(category.slug)
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight mb-2">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-[14px] text-white/80 leading-relaxed max-w-2xl line-clamp-2">
                  {category.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 text-[13px] text-white/60">
                <span>
                  <span className="font-bold text-white">{meta.total.toLocaleString("tr-TR")}</span>{" "}
                  ürün
                </span>
                {category.children.length > 0 && (
                  <span>
                    <span className="font-bold text-white">{category.children.length}</span>{" "}
                    alt kategori
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alt Kategoriler */}
      {category.children.length > 0 && (
        <section aria-labelledby="subcategories-heading" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex items-center gap-3 mb-4">
            <h2
              id="subcategories-heading"
              className="text-[17px] font-bold text-[#333333] whitespace-nowrap"
            >
              Alt Kategoriler
            </h2>
            <div className="flex-1 h-px bg-[#eeeeee]" aria-hidden />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {category.children.map((child) => (
              <SubCategoryCard key={child.id} child={child} />
            ))}
          </div>
        </section>
      )}

      {/* Ürünler */}
      <section aria-labelledby="products-heading" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-4">
          <h2
            id="products-heading"
            className="text-[17px] font-bold text-[#333333] whitespace-nowrap"
          >
            {category.name} Ürünleri
          </h2>
          <div className="flex-1 h-px bg-[#eeeeee]" aria-hidden />
          {meta.total > 0 && (
            <span className="text-[12px] text-[#767676] whitespace-nowrap">
              {meta.total.toLocaleString("tr-TR")} ürün bulundu
            </span>
          )}
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-white border border-[#eeeeee]">
            <div className="w-20 h-20 flex items-center justify-center bg-[#f5f5f5]">
              <Package className="h-9 w-9 text-[#dddddd]" aria-hidden />
            </div>
            <div>
              <p className="font-bold text-[16px] text-[#333333]">Bu kategoride ürün bulunmuyor</p>
              <p className="text-[#767676] text-[13px] mt-1 max-w-xs">
                Bu kategoride henuz ürün eklenmemis. Diger kategorilere goz atin.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/katalog"
                className="inline-flex items-center gap-1.5 h-9 px-5 border border-[#eeeeee] text-[13px] text-[#333333] hover:border-[#0040a4] hover:text-[#0040a4] transition-colors"
              >
                Kataloğa Dön
              </Link>
              {!isLoggedIn && (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 h-9 px-5 border border-[#0040a4]/30 bg-[#0040a4]/5 text-[13px] font-bold text-[#0040a4] hover:bg-[#0040a4]/10 hover:underline transition-colors"
              >
                <Lock className="h-3.5 w-3.5" aria-hidden />
                Özel Fiyatlar İçin Bayi Girişi Yapınız
              </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map((product) => (
                <PublicProductCard key={product.id} product={product} />
              ))}
            </div>

            <Pagination
              currentSlug={slug}
              currentPage={currentPage}
              totalPages={meta.totalPages}
            />
          </>
        )}
      </section>
    </div>
  )
}

