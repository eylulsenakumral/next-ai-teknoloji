export const dynamic = 'force-dynamic'

import type { Metadata } from "next"
import Link from "next/link"
import {
  Monitor,
  Camera,
  Wifi,
  HardDrive,
  Headphones,
  Shield,
  Server,
  Package,
  ChevronRight,
  Home,
  ArrowRight,
} from "lucide-react"
import { prisma } from "@/lib/db"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CategoryChild {
  id: string
  name: string
  slug: string
  productCount: number
}

interface CategoryTree {
  id: string
  name: string
  slug: string
  productCount: number
  imageUrl: string | null
  children: CategoryChild[]
}

type PrismaCategory = {
  id: string
  name: string
  slug: string
  parentId: string | null
  depth: number
  imageUrl: string | null
  _count: { products: number; children: number }
  children?: PrismaCategory[]
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  bilgisayar: <Monitor className="h-7 w-7" aria-hidden />,
  "guvenlik-kameralari": <Camera className="h-7 w-7" aria-hidden />,
  "guvenlik-sistemleri": <Shield className="h-7 w-7" aria-hidden />,
  network: <Wifi className="h-7 w-7" aria-hidden />,
  depolama: <HardDrive className="h-7 w-7" aria-hidden />,
  sunucu: <Server className="h-7 w-7" aria-hidden />,
  aksesuar: <Headphones className="h-7 w-7" aria-hidden />,
}

function getCategoryIcon(slug: string): React.ReactNode {
  return CATEGORY_ICONS[slug] ?? <Package className="h-7 w-7" aria-hidden />
}

/* ------------------------------------------------------------------ */
/*  Data Fetching (Direct Prisma - No SSR network call)                */
/* ------------------------------------------------------------------ */

function mapCategory(cat: PrismaCategory): CategoryTree {
  const children = (cat.children ?? []).map(mapCategory)
  // Alt kategorilerdeki ürünleri de dahil et
  const childrenProductCount = children.reduce((sum, c) => sum + c.productCount, 0)
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    productCount: cat._count.products + childrenProductCount,
    imageUrl: cat.imageUrl,
    children,
  }
}

// Recursive include builder - 5 seviye
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildInclude(depth: number): any {
  const filter = { deletedAt: null, isActive: true }

  if (depth === 0) {
    return {
      _count: {
        select: { products: { where: filter } },
      },
    }
  }

  return {
    _count: {
      select: { products: { where: filter } },
    },
    children: {
      where: filter,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: buildInclude(depth - 1),
    },
  }
}

async function getCategories(): Promise<CategoryTree[]> {
  try {
    // Tree yapisi - 5 seviye nested
    const categories = await prisma.category.findMany({
      where: { deletedAt: null, isActive: true, parentId: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: buildInclude(4),
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (categories as any[]).map(mapCategory)
  } catch {
    return []
  }
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Ürün Kategorileri",
  description:
    "Next AI Teknoloji ürün kategorileri. Güvenlik, bilgisayar, network, depolama ve daha fazlası.",
  openGraph: {
    title: "Ürün Kategorileri | Next AI Teknoloji",
    description:
      "5.000+ teknoloji ürününü kategoriye göre inceleyin.",
  },
}

/* ------------------------------------------------------------------ */
/*  CategoryCard                                                       */
/* ------------------------------------------------------------------ */

const CATEGORY_GRADIENTS = [
  "from-[#5086a8] to-[#1a6fe0]",
  "from-[#0040a4] to-[#2d6da3]",
  "from-[#0c2340] to-[#1a5276]",
  "from-[#2c3e50] to-[#3498db]",
  "from-[#1a3c5e] to-[#2980b9]",
  "from-[#0d3b66] to-[#1d6fa5]",
]

function CategoryCard({ category, index }: { category: CategoryTree; index: number }) {
  const childCount = category.children.length
  const totalProducts =
    category.productCount +
    category.children.reduce((sum, child) => sum + child.productCount, 0)
  const hasImage = !!category.imageUrl
  const gradient = CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length]

  return (
    <Link
      href={`/kategoriler/${category.slug}`}
      className="group relative flex flex-col justify-end rounded-2xl overflow-hidden h-56"
    >
      {/* Background */}
      {hasImage ? (
        <img
          src={category.imageUrl!}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Icon (only when no image) */}
      {!hasImage && (
        <div className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
          {getCategoryIcon(category.slug)}
        </div>
      )}

      {/* Arrow */}
      <ArrowRight className="absolute top-4 right-4 h-4 w-4 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" aria-hidden />

      {/* Text */}
      <div className="relative z-10 p-5">
        <h2 className="text-white font-bold text-base leading-tight mb-1.5">
          {category.name}
        </h2>
        <div className="flex items-center gap-3 text-white/70 text-xs">
          {childCount > 0 && <span>{childCount} alt kategori</span>}
          <span>{totalProducts.toLocaleString("tr-TR")} ürün</span>
        </div>
        {category.children.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {category.children.slice(0, 3).map((child) => (
              <span
                key={child.id}
                className="text-[11px] text-white/80 bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full truncate max-w-[120px]"
              >
                {child.name}
              </span>
            ))}
            {category.children.length > 3 && (
              <span className="text-[11px] text-white/60 font-semibold px-1 py-0.5">
                +{category.children.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function KategorilerPage() {
  const categories = await getCategories()

  return (
    <div className="bg-[#f4f7fa] min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#eeeeee]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[12px] text-[#64748b]"
          >
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-[#5086a8] transition-colors"
            >
              <Home className="h-3 w-3" aria-hidden />
              Ana Sayfa
            </Link>
            <ChevronRight className="h-3 w-3 text-[#dddddd]" aria-hidden />
            <span className="text-[#333333] font-semibold">Kategoriler</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-r from-[#5086a8] to-[#4da6ff] text-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <p className="text-[12px] font-bold uppercase tracking-widest text-white/60 mb-2">
            Kategoriler
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-2">
            Tüm Ürün Kategorileri
          </h1>
          <p className="text-[15px] text-white/80">
            İhtiyacınıza uygun kategoriyi seçin, en iyi teknoloji çözümlerini keşfedin.
          </p>
        </div>
      </div>

      {/* Kategori Grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-20 h-20 flex items-center justify-center bg-[#f5f5f5]">
              <Package className="h-9 w-9 text-[#dddddd]" aria-hidden />
            </div>
            <p className="font-bold text-[16px] text-[#333333]">Kategori bulunamadı</p>
            <p className="text-[#64748b] text-[13px] max-w-xs">
              Henüz kategori oluşturulmamış. Lütfen daha sonra tekrar deneyin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <CategoryCard key={cat.id} category={cat} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
