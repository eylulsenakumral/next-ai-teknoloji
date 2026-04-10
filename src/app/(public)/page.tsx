import Link from "next/link"
import {
  ArrowRight,
  Package,
  Truck,
  Shield,
  HeadphonesIcon,
  RefreshCw,
  ChevronRight,
  Tag,
  MessageCircle,
  Phone,
  LogIn,
} from "lucide-react"
import { prisma } from "@/lib/db"
import type { CategoryNode } from "@/types/catalog"

// ─── Sabit Veriler ────────────────────────────────────────────────────────────

const features = [
  { icon: Truck, label: "Ücretsiz Kargo", desc: "Tüm siparişlerde ücretsiz" },
  { icon: Shield, label: "Güvenli Ödeme", desc: "256-bit SSL koruması" },
  { icon: HeadphonesIcon, label: "7/24 Destek", desc: "Uzman bayi desteği" },
  { icon: RefreshCw, label: "Kolay İade", desc: "15 gün iade garantisi" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOf30DaysAgo(): Date {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  d.setHours(0, 0, 0, 0)
  return d
}

// ─── Hero Slider ──────────────────────────────────────────────────────────────

interface HeroSliderProps {
  productCount: number
  brandCount: number
}

function HeroSlider({ productCount, brandCount }: HeroSliderProps) {
  const stats = [
    { n: `${productCount.toLocaleString("tr")}+`, l: "Ürün" },
    { n: `${brandCount}+`, l: "Marka" },
    { n: "7/24", l: "Destek" },
    { n: "Aynı Gün", l: "Kargo" },
    { n: "15 Gün", l: "İade" },
  ]

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#001066] to-[#00179e]"
      style={{ minHeight: "480px" }}
    >
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-400/10 blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-[80px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 py-16 lg:py-24">
          <div className="max-w-xl text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 text-blue-200 text-[11px] font-bold uppercase tracking-widest mb-5 bg-white/[0.08] px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
              Teknoloji Bayi Portalı
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-5">
              Türkiye&apos;nin{" "}
              <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                En Büyük
              </span>
              <br />
              Teknoloji Bayisi
            </h1>
            <p className="text-white/60 text-base mb-8 leading-relaxed max-w-lg">
              {productCount.toLocaleString("tr")}+ ürün, {brandCount}+ marka. Rekabetçi bayi
              fiyatları ve hızlı teslimat ile yanınızdayız.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/katalog"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#00179e] font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-all duration-200 text-sm shadow-lg shadow-white/10"
              >
                Tüm Ürünler
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/basvuru"
                className="inline-flex items-center justify-center gap-2 bg-white/[0.08] hover:bg-white/[0.14] text-white font-bold px-8 py-3.5 rounded-xl transition-all duration-200 text-sm border border-white/10 backdrop-blur-sm"
              >
                Bayi Ol
              </Link>
            </div>
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-3 shrink-0">
            {stats.map(({ n, l }) => (
              <div
                key={l}
                className="bg-white/[0.06] border border-white/10 rounded-xl p-5 text-center backdrop-blur-sm hover:bg-white/[0.10] transition-colors duration-200"
              >
                <p className="text-white font-extrabold text-xl leading-tight">{n}</p>
                <p className="text-white/50 text-[11px] mt-1 uppercase tracking-wider">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Feature Band ─────────────────────────────────────────────────────────────

function FeatureBand() {
  return (
    <div className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-4 px-6 py-6">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-50 shrink-0">
                <Icon className="h-5 w-5 text-[#00179e]" aria-hidden />
              </div>
              <div>
                <p className="text-[13px] font-bold text-gray-800 tracking-wide">
                  {label}
                </p>
                <p className="text-[12px] text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Category Section ─────────────────────────────────────────────────────────

function CategoryItem({
  category,
  depth = 0,
}: {
  category: CategoryNode
  depth?: number
}) {
  const hasChildren = category.children && category.children.length > 0

  if (depth === 0) {
    // Root level - show as card
    return (
      <div className="group">
        <Link
          href={`/katalog?categorySlug=${encodeURIComponent(category.slug)}`}
          className="flex flex-col items-center gap-3 bg-white border border-gray-100 rounded-2xl p-5 hover:border-[#00179e]/30 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all duration-300"
        >
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50 group-hover:bg-blue-50 transition-colors duration-300">
            <Package
              className="h-6 w-6 text-gray-400 group-hover:text-[#00179e] transition-colors duration-300"
              aria-hidden
            />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-gray-700 group-hover:text-[#00179e] transition-colors duration-300 leading-tight">
              {category.name}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              {category._count.products} ürün
            </p>
          </div>
        </Link>
        {hasChildren && (
          <div className="mt-2 space-y-1 ml-2">
            {category.children?.slice(0, 3).map((child) => (
              <CategoryItem key={child.id} category={child} depth={depth + 1} />
            ))}
            {category.children && category.children.length > 3 && (
              <Link
                href={`/katalog?categorySlug=${encodeURIComponent(category.slug)}`}
                className="block text-[10px] text-[#00179e] hover:underline ml-1"
              >
                +{category.children.length - 3} daha fazla
              </Link>
            )}
          </div>
        )}
      </div>
    )
  }

  // Nested level - show as indented link
  return (
    <Link
      href={`/katalog?categorySlug=${encodeURIComponent(category.slug)}`}
      className="block text-[11px] text-gray-600 hover:text-[#00179e] transition-colors py-0.5"
      style={{ paddingLeft: `${depth * 8}px` }}
    >
      {category.name}
      {category._count.products > 0 && (
        <span className="text-[10px] text-gray-400 ml-1">
          ({category._count.products})
        </span>
      )}
    </Link>
  )
}

function CategorySection({ categories }: { categories: CategoryNode[] }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Kategoriler
          </h2>
          <p className="text-sm text-gray-500 mt-1">Tüm ürün kategorilerini keşfet</p>
        </div>
        <Link
          href="/katalog"
          className="text-sm font-semibold text-[#00179e] hover:text-blue-700 transition-colors flex items-center gap-1 group"
        >
          Tümünü Gör
          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <Package className="h-10 w-10 text-gray-300" aria-hidden />
          <p className="text-sm text-gray-500">Henüz kategori eklenmemiş.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((category) => (
            <CategoryItem key={category.id} category={category} />
          ))}
        </div>
      )}
    </section>
  )
}

// ─── New Products Section ─────────────────────────────────────────────────────

interface ProductItem {
  id: string
  name: string
  slug: string
  images: string[]
  brand: { name: string } | null
}

function NewProductsSection({ products }: { products: ProductItem[] }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Öne Çıkan Ürünler
          </h2>
          <p className="text-sm text-gray-500 mt-1">En popüler ürünler</p>
        </div>
        <Link
          href="/katalog"
          className="text-sm font-semibold text-[#00179e] hover:text-blue-700 transition-colors flex items-center gap-1 group"
        >
          Tümünü Gör
          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <Package className="h-10 w-10 text-gray-300" aria-hidden />
          <p className="text-sm text-gray-500">Henüz ürün eklenmemiş.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {products.map((product) => {
            const imageUrl = product.images[0] ?? null

            return (
              <Link
                key={product.id}
                href={`/katalog/${product.slug}`}
                className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300"
              >
                {/* Gorsel */}
                <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden relative">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="object-contain w-full h-full p-3 group-hover:scale-110 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <Package className="h-16 w-16 text-gray-200" aria-hidden />
                  )}
                </div>
                {/* Icerik */}
                <div className="p-4">
                  {product.brand && (
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#00179e] truncate mb-1">
                      {product.brand.name}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 leading-snug line-clamp-2 group-hover:text-[#00179e] transition-colors duration-200">
                    {product.name}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00179e] hover:underline"
                    >
                      <LogIn className="h-3 w-3" aria-hidden />
                      Fiyat için giriş
                    </Link>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ─── CTA Section ───────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="bg-gradient-to-r from-[#00179e] to-[#0025d4] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Teklif Al */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-xl">
                <MessageCircle className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="text-xl font-bold">Hemen Teklif Alın</h3>
            </div>
            <p className="text-white/80 mb-6 leading-relaxed">
              WhatsApp üzerinden hızlı fiyat teklifi alın. En kısa sürede dönüş yapalım.
            </p>
            <a
              href="https://wa.me/905529895959"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#00179e] font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-all duration-200"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              WhatsApp ile İletişime Geç
            </a>
            <p className="mt-4 text-sm text-white/60">
              Veya{" "}
              <a href="tel:+905529895959" className="font-semibold underline">
                0 552 989 5959
              </a>{" "}
              numarasından bizi arayın
            </p>
          </div>

          {/* Bayi Ol */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-xl">
                <Shield className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="text-xl font-bold">Bayi Olun</h3>
            </div>
            <p className="text-white/80 mb-6 leading-relaxed">
              Toptan fiyatlar ve özel bayi avantajlarından yararlanmak için bayi başvurusu yapın.
            </p>
            <Link
              href="/basvuru"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#00179e] font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-all duration-200"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Bayi Başvurusu Yap
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Page (Server Component) ──────────────────────────────────────────────────

export default async function PublicHomePage() {
  // Kategorileri API'den al (hiyerarşik yapı)
  const categoryRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/categories/tree`, {
    next: { revalidate: 300 }, // 5 dakika cache
  })
  const categoryData = await categoryRes.json()
  const categories: CategoryNode[] = categoryData.data?.slice(0, 8) ?? []

  const [productCount, brandCount, newProducts] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null, isActive: true } }),
    prisma.brand.count({ where: { deletedAt: null, isActive: true } }),
    prisma.product.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        images: true,
        brand: {
          select: {
            name: true,
          },
        },
      },
    }),
  ])

  return (
    <div className="bg-gray-50/80 min-h-screen">
      <HeroSlider productCount={productCount} brandCount={brandCount} />
      <FeatureBand />
      <div className="py-10">
        <CategorySection categories={categories} />
        <NewProductsSection products={newProducts} />
      </div>
      <CTASection />
    </div>
  )
}
