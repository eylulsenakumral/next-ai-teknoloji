import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  Package,
  Truck,
  Shield,
  HeadphonesIcon,
  RefreshCw,
  ChevronRight,
  Eye,
  ShoppingCart,
  ShoppingBag,
  Wallet,
  ClipboardList,
  InboxIcon,
  TrendingUp,
} from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { formatCurrency } from "@/lib/utils/format"

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
    { n: "%15", l: "Bayi İndirimi" },
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
              <TrendingUp className="h-3.5 w-3.5" aria-hidden />
              B2B Bayi Portalı
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
                href="/urunler"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#00179e] font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-all duration-200 text-sm shadow-lg shadow-white/10"
              >
                Tüm Ürünler
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/kampanyalar"
                className="inline-flex items-center justify-center gap-2 bg-white/[0.08] hover:bg-white/[0.14] text-white font-bold px-8 py-3.5 rounded-xl transition-all duration-200 text-sm border border-white/10 backdrop-blur-sm"
              >
                Kampanyalar
              </Link>
            </div>
          </div>

          <div className="hidden lg:grid grid-cols-3 gap-3 shrink-0">
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

interface CategoryItem {
  id: string
  name: string
  slug: string
  _count: { products: number }
}

function CategorySection({ categories }: { categories: CategoryItem[] }) {
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
          href="/urunler"
          className="text-sm font-semibold text-[#00179e] hover:text-blue-700 transition-colors flex items-center gap-1 group"
        >
          Tümünü Gör
          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <InboxIcon className="h-10 w-10 text-gray-300" aria-hidden />
          <p className="text-sm text-gray-500">Henüz kategori eklenmemiş.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map(({ id, name, slug, _count }) => (
            <Link
              key={id}
              href={`/urunler?kategori=${encodeURIComponent(slug)}`}
              className="group flex flex-col items-center gap-3 bg-white border border-gray-100 rounded-2xl p-5 hover:border-[#00179e]/30 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50 group-hover:bg-blue-50 transition-colors duration-300">
                <Package
                  className="h-6 w-6 text-gray-400 group-hover:text-[#00179e] transition-colors duration-300"
                  aria-hidden
                />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-700 group-hover:text-[#00179e] transition-colors duration-300 leading-tight">
                  {name}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {_count.products} ürün
                </p>
              </div>
            </Link>
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
  isNew: boolean
  isOutlet: boolean
  isFeatured: boolean
  supplierProducts: Array<{
    purchasePrice: { toString(): string } | null
  }>
}

function NewProductsSection({ products }: { products: ProductItem[] }) {
  function getBadge(product: ProductItem): { label: string; className: string } | null {
    if (product.isNew) return { label: "YENİ", className: "bg-[#00179e]" }
    if (product.isOutlet) return { label: "OUTLET", className: "bg-red-600" }
    if (product.isFeatured) return { label: "POPÜLER", className: "bg-orange-500" }
    return null
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Yeni Ürünler
          </h2>
          <p className="text-sm text-gray-500 mt-1">En son eklenen ürünler</p>
        </div>
        <Link
          href="/urunler?yeni=true"
          className="text-sm font-semibold text-[#00179e] hover:text-blue-700 transition-colors flex items-center gap-1 group"
        >
          Tümünü Gör
          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <Package className="h-10 w-10 text-gray-300" aria-hidden />
          <p className="text-sm text-gray-500">
            Henüz ürün eklenmemiş. BizimHesap entegrasyonundan senkronize edebilirsiniz.
          </p>
          <Link
            href="/admin/entegrasyonlar"
            className="text-sm font-semibold text-[#00179e] hover:underline"
          >
            Entegrasyonlara Git
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {products.map((product) => {
            const badge = getBadge(product)
            const priceRaw = product.supplierProducts[0]?.purchasePrice
            const price = priceRaw ? Number(priceRaw) : null
            const imageUrl = product.images[0] ?? null

            return (
              <Link
                key={product.id}
                href={`/urunler/${product.slug}`}
                className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300"
              >
                {/* Gorsel */}
                <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden relative">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      width={400}
                      height={400}
                      className="object-contain w-full h-full p-3 group-hover:scale-110 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <Package className="h-16 w-16 text-gray-200" aria-hidden />
                  )}
                  {badge && (
                    <span
                      className={`absolute top-3 left-3 inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-bold text-white shadow-sm ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg text-gray-600 hover:bg-[#00179e] hover:text-white transition-colors duration-200">
                      <ShoppingCart className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg text-gray-600 hover:bg-[#00179e] hover:text-white transition-colors duration-200">
                      <Eye className="h-4 w-4" aria-hidden />
                    </span>
                  </div>
                </div>
                {/* Icerik */}
                <div className="p-4">
                  {price !== null ? (
                    <p className="text-base font-bold text-gray-900 leading-tight mb-1.5">
                      {formatCurrency(price)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic mb-1.5">Fiyat yok</p>
                  )}
                  <p className="text-sm text-gray-500 leading-snug line-clamp-2 group-hover:text-[#00179e] transition-colors duration-200">
                    {product.name}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ─── Dealer Stats Bar ─────────────────────────────────────────────────────────

interface DealerStatsBarProps {
  pendingOrders: number
  balance: number
  monthlySpend: number
}

function DealerStatsBar({ pendingOrders, balance, monthlySpend }: DealerStatsBarProps) {
  const stats = [
    {
      icon: ClipboardList,
      label: "Bekleyen Sipariş",
      value: pendingOrders.toLocaleString("tr"),
      iconBg: "bg-blue-50",
      iconColor: "text-[#00179e]",
      valueColor: "text-gray-900",
    },
    {
      icon: Wallet,
      label: "Cari Bakiye",
      value: formatCurrency(balance),
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
      valueColor: balance >= 0 ? "text-emerald-600" : "text-red-600",
    },
    {
      icon: ShoppingBag,
      label: "Son 30 Gün Sipariş",
      value: formatCurrency(monthlySpend),
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
      valueColor: "text-gray-900",
    },
  ]

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {stats.map(({ icon: Icon, label, value, iconBg, iconColor, valueColor }) => (
          <div
            key={label}
            className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center gap-4 hover:shadow-lg hover:shadow-gray-100 transition-shadow duration-300"
          >
            <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${iconBg} shrink-0`}>
              <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {label}
              </p>
              <p className={`text-2xl font-extrabold leading-tight mt-0.5 ${valueColor}`}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Brands Section ───────────────────────────────────────────────────────────

interface BrandItem {
  id: string
  name: string
  slug: string
}

function BrandsSection({ brands }: { brands: BrandItem[] }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          Markalar
        </h2>
        <p className="text-sm text-gray-500 mt-1">Çalıştığımız markalar</p>
      </div>
      {brands.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
          <InboxIcon className="h-10 w-10 text-gray-300" aria-hidden />
          <p className="text-sm text-gray-500">Henüz marka eklenmemiş.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-3">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/urunler?marka=${encodeURIComponent(brand.slug)}`}
              className="flex items-center justify-center h-16 rounded-xl border border-gray-100 text-sm font-semibold text-gray-500 hover:text-[#00179e] hover:border-[#00179e]/20 hover:bg-blue-50/50 hover:shadow-sm transition-all duration-200 bg-white"
            >
              {brand.name}
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

// ─── Page (Server Component) ──────────────────────────────────────────────────

export default async function DealerDashboardPage() {
  const session = await getServerSession(authOptions)

  // Bayi kimligi (session'dan gelen dealerCode ile customer bul)
  const dealerCode = session?.user?.dealerCode
  const customerId = session?.user?.id

  const [
    productCount,
    brandCount,
    categories,
    newProducts,
    brands,
    dealerStats,
  ] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null, isActive: true } }),
    prisma.brand.count({ where: { deletedAt: null, isActive: true } }),
    prisma.category.findMany({
      where: { deletedAt: null, isActive: true, parentId: null },
      include: {
        _count: {
          select: {
            products: { where: { deletedAt: null, isActive: true } },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        images: true,
        isNew: true,
        isOutlet: true,
        isFeatured: true,
        supplierProducts: {
          where: { isAvailable: true, deletedAt: null },
          take: 1,
          orderBy: { purchasePrice: "asc" },
          select: { purchasePrice: true },
        },
      },
    }),
    prisma.brand.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 20,
      select: { id: true, name: true, slug: true },
    }),
    // Bayi istatistikleri -- session varsa cek, yoksa varsayilan 0
    customerId
      ? prisma.$transaction([
          prisma.order.count({
            where: {
              deletedAt: null,
              customerId,
              status: { in: ["PENDING", "CONFIRMED", "PREPARING"] },
            },
          }),
          prisma.customer.findUnique({
            where: { id: customerId },
            select: { balance: true },
          }),
          prisma.order.aggregate({
            where: {
              deletedAt: null,
              customerId,
              createdAt: { gte: startOf30DaysAgo() },
            },
            _sum: { grandTotal: true },
          }),
        ])
      : Promise.resolve([0, null, { _sum: { grandTotal: null } }]),
  ])

  const [pendingOrders, customerData, monthlyAggregate] = dealerStats as [
    number,
    { balance: { toString(): string } } | null,
    { _sum: { grandTotal: { toString(): string } | null } },
  ]

  const balance = customerData ? Number(customerData.balance) : 0
  const monthlySpend = Number(monthlyAggregate._sum.grandTotal ?? 0)

  // dealerCode kontrolu -- sadece oturum acmis bayilerde istatistik goster
  const showDealerStats = Boolean(dealerCode && customerId)

  return (
    <div className="bg-gray-50/80 min-h-screen">
      <HeroSlider productCount={productCount} brandCount={brandCount} />
      <FeatureBand />
      <div className="py-10">
        {showDealerStats && (
          <DealerStatsBar
            pendingOrders={pendingOrders}
            balance={balance}
            monthlySpend={monthlySpend}
          />
        )}
        <CategorySection categories={categories} />
        <NewProductsSection products={newProducts} />
        <BrandsSection brands={brands} />
      </div>
    </div>
  )
}
