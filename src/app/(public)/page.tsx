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
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Main gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d2847] to-[#00179e]" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Animated gradient orbs */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#2189ff]/30 blur-[150px] animate-float" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#00179e]/40 blur-[140px] animate-float-reverse" />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] rounded-full bg-[#1471dd]/20 blur-[120px] animate-float-slow" style={{ animationDelay: "5s" }} />

        {/* Additional accent orbs */}
        <div className="absolute top-[20%] left-[60%] w-[200px] h-[200px] rounded-full bg-[#2189ff]/15 blur-[100px] animate-float-medium" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-[30%] right-[20%] w-[250px] h-[250px] rounded-full bg-[#00179e]/20 blur-[110px] animate-float-reverse" style={{ animationDelay: "8s" }} />
      </div>

      {/* Main Content */}
      <div className="relative flex-1 flex items-center">
        <div className="max-w-[1330px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 text-white/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-8 bg-white/5 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2189ff] animate-pulse" />
              Teknoloji Bayi Portalı
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
              Türkiye&apos;nin En Büyük{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[#2189ff] to-[#60a5fa]">
                  Teknoloji
                </span>
                <span className="absolute inset-0 bg-[#2189ff]/20 blur-xl -z-10" />
              </span>
              <br />
              Bayisi
            </h1>

            {/* Accent line */}
            <div className="relative w-24 h-1 mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-[#2189ff] to-[#00179e] rounded-full" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#2189ff] to-[#00179e] rounded-full animate-pulse-line" />
            </div>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-white/70 mb-10 leading-relaxed max-w-2xl">
              {productCount.toLocaleString("tr")}+ ürün, {brandCount}+ marka ile Türkiye&apos;nin en
              kapsamlı teknoloji bayi portalı. Rekabetçi fiyatlar ve hızlı teslimat.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/katalog"
                className="group inline-flex items-center justify-center gap-3 bg-[#2189ff] hover:bg-[#1471dd] text-white font-bold px-10 py-4.5 rounded-xl transition-all duration-300 text-base shadow-2xl shadow-[#2189ff]/40 hover:shadow-[#2189ff]/60 hover:-translate-y-0.5"
              >
                Kataloğu Keşfet
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link
                href="/basvuru"
                className="group inline-flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white font-bold px-10 py-4.5 rounded-xl transition-all duration-300 text-base border-2 border-white/20 hover:border-white/30 backdrop-blur-sm hover:-translate-y-0.5"
              >
                Bayi Başvurusu
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar at Bottom */}
      <div className="relative border-t border-white/10 bg-gradient-to-b from-transparent to-[#0a1628]/50 backdrop-blur-sm">
        <div className="max-w-[1330px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-5 gap-4 sm:gap-8 py-8">
            {stats.map(({ n, l }, index) => (
              <div
                key={l}
                className="group flex flex-col items-center justify-center text-center animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative mb-2">
                  <div className="absolute inset-0 bg-[#2189ff]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <p className="relative text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {n}
                  </p>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white/50 uppercase tracking-wider group-hover:text-white/70 transition-colors duration-300">
                  {l}
                </p>
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
    <div className="bg-[#f3f3f3] border-b border-gray-200">
      <div className="max-w-[1330px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-300">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center justify-center gap-4 px-6 py-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white shrink-0 shadow-sm">
                <Icon className="h-6 w-6 text-[#2189ff]" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1e1e1e] tracking-wide">
                  {label}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">{desc}</p>
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
          className="flex flex-col items-center gap-3 bg-white border border-gray-200 rounded-2xl p-6 hover:border-[#2189ff]/40 hover:shadow-lg hover:shadow-[#2189ff]/10 hover:-translate-y-1 transition-all duration-300"
        >
          <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-[#f3f3f3] group-hover:bg-[#2189ff]/10 transition-colors duration-300">
            <Package
              className="h-7 w-7 text-gray-400 group-hover:text-[#2189ff] transition-colors duration-300"
              aria-hidden
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#1e1e1e] group-hover:text-[#2189ff] transition-colors duration-300 leading-tight">
              {category.name}
            </p>
            <p className="text-xs text-gray-500 mt-1">
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
                className="block text-[10px] text-[#2189ff] hover:underline ml-1"
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
      className="block text-[11px] text-gray-600 hover:text-[#2189ff] transition-colors py-0.5"
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
    <section className="max-w-[1330px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#1e1e1e] tracking-tight">
            Kategoriler
          </h2>
          <p className="text-sm text-gray-600 mt-1">Tüm ürün kategorilerini keşfet</p>
        </div>
        <Link
          href="/katalog"
          className="text-sm font-semibold text-[#2189ff] hover:text-[#1471dd] transition-colors flex items-center gap-1 group"
        >
          Tümünü Gör
          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 border-2 border-dashed border-gray-300 rounded-2xl bg-[#f3f3f3]/50">
          <Package className="h-10 w-10 text-gray-400" aria-hidden />
          <p className="text-sm text-gray-600">Henüz kategori eklenmemiş.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-5">
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
    <section className="max-w-[1330px] mx-auto px-4 sm:px-6 lg:px-8 pb-14">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#1e1e1e] tracking-tight">
            Yeni Eklenenler
          </h2>
          <p className="text-sm text-gray-600 mt-1">En yeni ürünler</p>
        </div>
        <Link
          href="/katalog"
          className="text-sm font-semibold text-[#2189ff] hover:text-[#1471dd] transition-colors flex items-center gap-1 group"
        >
          Tümünü Gör
          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 border-2 border-dashed border-gray-300 rounded-2xl bg-[#f3f3f3]/50">
          <Package className="h-10 w-10 text-gray-400" aria-hidden />
          <p className="text-sm text-gray-600">Henüz ürün eklenmemiş.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {products.map((product) => {
            const imageUrl = product.images[0] ?? null

            return (
              <div
                key={product.id}
                className="group flex flex-col bg-[#f3f3f3] rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-gray-400/20 hover:-translate-y-1 transition-all duration-300"
              >
                {/* Gorsel - Link */}
                <Link
                  href={`/katalog/${product.slug}`}
                  className="aspect-square bg-white flex items-center justify-center overflow-hidden relative"
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="object-contain w-full h-full p-4 group-hover:scale-110 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <Package className="h-16 w-16 text-gray-300" aria-hidden />
                  )}
                </Link>
                {/* Icerik */}
                <div className="p-4">
                  {product.brand && (
                    <Link
                      href={`/katalog/${product.slug}`}
                      className="block"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2189ff] truncate mb-1 group-hover:text-[#1471dd] transition-colors">
                        {product.brand.name}
                      </p>
                    </Link>
                  )}
                  <Link
                    href={`/katalog/${product.slug}`}
                    className="block"
                  >
                    <p className="text-sm text-gray-700 leading-snug line-clamp-2 group-hover:text-[#2189ff] transition-colors duration-200">
                      {product.name}
                    </p>
                  </Link>
                  <div className="mt-3 flex items-center justify-between">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2189ff] hover:underline"
                    >
                      <LogIn className="h-3 w-3" aria-hidden />
                      Fiyat için giriş
                    </Link>
                  </div>
                </div>
              </div>
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
    <section className="bg-[#2189ff] text-white">
      <div className="max-w-[1330px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Teklif Al */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-xl">
                <MessageCircle className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="text-xl font-bold">Hemen Teklif Alın</h3>
            </div>
            <p className="text-white/90 mb-6 leading-relaxed">
              WhatsApp üzerinden hızlı fiyat teklifi alın. En kısa sürede dönüş yapalım.
            </p>
            <a
              href="https://wa.me/905529895959"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#2189ff] font-bold px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              WhatsApp ile İletişime Geç
            </a>
            <p className="mt-4 text-sm text-white/70">
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
            <p className="text-white/90 mb-6 leading-relaxed">
              Toptan fiyatlar ve özel bayi avantajlarından yararlanmak için bayi başvurusu yapın.
            </p>
            <Link
              href="/basvuru"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#2189ff] font-bold px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200"
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const categoryRes = await fetch(`${baseUrl}/api/public/categories`, {
    next: { revalidate: 300 }, // 5 dakika cache
  })

  if (!categoryRes.ok) {
    console.error('Categories API failed:', categoryRes.status)
  }

  const categoryData = await categoryRes.json()

  // API'den gelen veriyi CategoryNode formatına çevir (recursive mapping)
  const categories: CategoryNode[] = (categoryData.data ?? []).slice(0, 8).map((cat: any) => ({
    ...cat,
    _count: { products: cat.productCount || 0 },
    children: cat.children?.map((child: any) => ({
      ...child,
      _count: { products: child.productCount || 0 },
      children: [],
    })) ?? [],
  }))

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
    <div className="bg-white min-h-screen">
      <HeroSlider productCount={productCount} brandCount={brandCount} />
      <FeatureBand />
      <div className="py-12">
        <CategorySection categories={categories} />
        <NewProductsSection products={newProducts} />
      </div>
      <CTASection />
    </div>
  )
}
