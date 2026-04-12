export const dynamic = 'force-dynamic'

import Link from "next/link"
import {
  Package,
  Truck,
  Shield,
  HeadphonesIcon,
  RefreshCw,
  ChevronRight,
  MessageCircle,
  LogIn,
} from "lucide-react"
import { prisma } from "@/lib/db"
import type { CategoryNode } from "@/types/catalog"
import { GridBannerSection } from "@/components/public/grid-banner-section"
import { BrandLogoBar } from "@/components/public/brand-logo-bar"
import { BlogSection } from "@/components/public/blog-section"
import { NewsletterSection } from "@/components/public/newsletter-section"
import { HeroBanner } from "@/components/public/hero-banner"
import { CampaignSection } from "@/components/public/campaign-section"
import type { CampaignProduct } from "@/components/public/campaign-section"

// ─── Sabit Veriler ────────────────────────────────────────────────────────────

const bannerItems3Col = [
  {
    id: "b1",
    title: "Dizüstü Bilgisayarlar",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80",
    link: "/katalog?categorySlug=dizustu-bilgisayar",
  },
  {
    id: "b2",
    title: "Monitörler",
    image: "https://images.unsplash.com/photo-1593640408182-31c228fad549?w=600&q=80",
    link: "/katalog?categorySlug=monitor",
  },
  {
    id: "b3",
    title: "Ağ Ekipmanları",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
    link: "/katalog?categorySlug=ag-ekipmani",
  },
]

const bannerItems2Col = [
  {
    id: "b4",
    title: "Sunucular & Depolama",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
    link: "/katalog?categorySlug=sunucu",
  },
  {
    id: "b5",
    title: "Yazıcılar & Sarf Malzemeleri",
    image: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&q=80",
    link: "/katalog?categorySlug=yazici",
  },
]

const sampleBrands = [
  {
    id: "br1",
    name: "HP",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/HP_logo_2012.svg/200px-HP_logo_2012.svg.png",
    link: "/katalog?brand=hp",
  },
  {
    id: "br2",
    name: "Dell",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Dell_Logo.png/200px-Dell_Logo.png",
    link: "/katalog?brand=dell",
  },
  {
    id: "br3",
    name: "Lenovo",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Lenovo_logo_2015.svg/200px-Lenovo_logo_2015.svg.png",
    link: "/katalog?brand=lenovo",
  },
  {
    id: "br4",
    name: "Cisco",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Cisco_logo_blue_2016.svg/200px-Cisco_logo_blue_2016.svg.png",
    link: "/katalog?brand=cisco",
  },
  {
    id: "br5",
    name: "Samsung",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/200px-Samsung_Logo.svg.png",
    link: "/katalog?brand=samsung",
  },
]

const sampleBlogPosts = [
  {
    id: "p1",
    title: "2024 Yılının En İyi İş Dizüstü Bilgisayarları",
    excerpt:
      "Kurumsal kullanıcılar için en uygun dizüstü bilgisayar modellerini ve özelliklerini inceledik.",
    image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&q=80",
    date: "2024-03-15",
    author: "DT Elektrix",
    link: "/blog/2024-is-dizustu-bilgisayarlari",
  },
  {
    id: "p2",
    title: "Ofis Ağ Altyapısı Nasıl Kurulur?",
    excerpt:
      "Küçük ve orta ölçekli işletmeler için güvenilir ağ altyapısı kurulum rehberi.",
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80",
    date: "2024-02-28",
    author: "DT Elektrix",
    link: "/blog/ofis-ag-altyapisi-kurulum",
  },
  {
    id: "p3",
    title: "Monitör Seçiminde Dikkat Edilmesi Gerekenler",
    excerpt:
      "Doğru monitörü seçmek için çözünürlük, panel tipi ve bağlantı seçeneklerini karşılaştırdık.",
    image: "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=600&q=80",
    date: "2024-02-10",
    author: "DT Elektrix",
    link: "/blog/monitor-secim-rehberi",
  },
]

const sampleFeaturedProducts: CampaignProduct[] = [
  {
    id: "cp1",
    name: "HP EliteBook 840 G10 İş Laptopu",
    slug: "hp-elitebook-840-g10",
    images: ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80"],
    brand: { name: "HP", slug: "hp" },
    category: { name: "Dizüstü Bilgisayar", slug: "dizustu-bilgisayar" },
    stockStatus: true,
    campaignDiscountPct: 15,
    campaignLabel: null,
  },
  {
    id: "cp2",
    name: "Dell UltraSharp 27 4K USB-C Hub Monitör",
    slug: "dell-ultrasharp-27-4k",
    images: ["https://images.unsplash.com/photo-1593640408182-31c228fad549?w=400&q=80"],
    brand: { name: "Dell", slug: "dell" },
    category: { name: "Monitör", slug: "monitor" },
    stockStatus: true,
    campaignDiscountPct: 10,
    campaignLabel: null,
  },
  {
    id: "cp3",
    name: "Cisco Catalyst 2960-X 24-Port PoE+ Switch",
    slug: "cisco-catalyst-2960x-24p",
    images: ["https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80"],
    brand: { name: "Cisco", slug: "cisco" },
    category: { name: "Ağ Ekipmanı", slug: "ag-ekipmani" },
    stockStatus: true,
    campaignDiscountPct: 20,
    campaignLabel: null,
  },
  {
    id: "cp4",
    name: "Lenovo ThinkPad X1 Carbon Gen 11",
    slug: "lenovo-thinkpad-x1-carbon-gen11",
    images: ["https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&q=80"],
    brand: { name: "Lenovo", slug: "lenovo" },
    category: { name: "Dizüstü Bilgisayar", slug: "dizustu-bilgisayar" },
    stockStatus: true,
    campaignDiscountPct: 12,
    campaignLabel: null,
  },
]

const sampleOutletProducts: CampaignProduct[] = [
  {
    id: "op1",
    name: "Samsung 32\" Curved Gaming Monitör",
    slug: "samsung-32-curved-gaming-monitor",
    images: ["https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400&q=80"],
    brand: { name: "Samsung", slug: "samsung" },
    category: { name: "Monitör", slug: "monitor" },
    stockStatus: true,
    campaignDiscountPct: null,
    campaignLabel: "OUTLET",
  },
  {
    id: "op2",
    name: "HP LaserJet Pro M404dn Yazıcı",
    slug: "hp-laserjet-pro-m404dn",
    images: ["https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&q=80"],
    brand: { name: "HP", slug: "hp" },
    category: { name: "Yazıcı", slug: "yazici" },
    stockStatus: false,
    campaignDiscountPct: 25,
    campaignLabel: "OUTLET",
  },
  {
    id: "op3",
    name: "Logitech MX Keys S Klavye + MX Master 3S Set",
    slug: "logitech-mx-keys-master-3s-set",
    images: ["https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&q=80"],
    brand: { name: "Logitech", slug: "logitech" },
    category: { name: "Klavye & Mouse", slug: "klavye-mouse" },
    stockStatus: true,
    campaignDiscountPct: 18,
    campaignLabel: "OUTLET",
  },
  {
    id: "op4",
    name: "Ubiquiti UniFi AP WiFi 6 Long-Range",
    slug: "ubiquiti-unifi-ap-wifi6-lr",
    images: ["https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&q=80"],
    brand: { name: "Ubiquiti", slug: "ubiquiti" },
    category: { name: "Wi-Fi", slug: "wifi" },
    stockStatus: true,
    campaignDiscountPct: 30,
    campaignLabel: "OUTLET",
  },
]

const heroSlides = [
  {
    id: "hero-1",
    subHeading: "Teknoloji Cozumleri",
    title: "Teknoloji Dunyasina Hos Geldiniz",
    description: "En yeni urunler, en uygun fiyatlar. Kurumsal ve bireysel ihtiyaclariniza ozel cozumler sunuyoruz.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80",
    buttonText: "Kesfet",
    buttonLink: "/katalog",
    textAlign: "left" as const,
  },
  {
    id: "hero-2",
    subHeading: "Kurumsal Cozumler",
    title: "Isletmeniz Icin Ozel Teknoloji Paketleri",
    description: "Profesyonel ekipman ve altyapi cozumleri ile isletmenizi bir ust seviyeye tasiyin.",
    image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1600&q=80",
    buttonText: "Incele",
    buttonLink: "/katalog",
    textAlign: "right" as const,
  },
  {
    id: "hero-3",
    subHeading: "Guvenli Alisveris",
    title: "7/24 Destek ve Hizli Teslimat",
    description: "Guvenli odeme altyapisi, hizli kargo ve uzman teknik destek ile yaninizdayiz.",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1600&q=80",
    buttonText: "Kesfet",
    buttonLink: "/katalog",
    textAlign: "left" as const,
  },
]

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
      <HeroBanner slides={heroSlides} />
      <FeatureBand />
      <div className="py-12">
        <CategorySection categories={categories} />
      </div>
      <CampaignSection
        title="Kampanyalı Ürünler"
        subtitle="Sınırlı sürede özel fiyatlar"
        products={sampleFeaturedProducts}
        viewAllHref="/kampanya"
      />
      <GridBannerSection columns={3} items={bannerItems3Col} />
      <div className="py-12">
        <NewProductsSection products={newProducts} />
      </div>
      <CampaignSection
        title="Outlet Fırsatları"
        subtitle="İndirimli stok ürünler"
        products={sampleOutletProducts}
        viewAllHref="/kampanya"
      />
      <GridBannerSection columns={2} items={bannerItems2Col} />
      <BlogSection posts={sampleBlogPosts} />
      <BrandLogoBar brands={sampleBrands} />
      <NewsletterSection />
      <CTASection />
    </div>
  )
}
