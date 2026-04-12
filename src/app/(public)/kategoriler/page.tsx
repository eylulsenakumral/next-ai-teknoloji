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
  children: CategoryChild[]
}

type PrismaCategory = {
  id: string
  name: string
  slug: string
  parentId: string | null
  depth: number
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

function CategoryCard({ category }: { category: CategoryTree }) {
  const childCount = category.children.length
  const totalProducts =
    category.productCount +
    category.children.reduce((sum, child) => sum + child.productCount, 0)

  return (
    <Link
      href={`/kategoriler/${category.slug}`}
      className="group relative flex flex-col bg-white border border-[#eeeeee] p-6 hover:border-[#2189ff]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* İkon */}
      <div className="flex items-center justify-center w-14 h-14 mb-4 bg-[#2189ff]/5 text-[#2189ff] group-hover:bg-[#2189ff]/10 transition-colors">
        {getCategoryIcon(category.slug)}
      </div>

      {/* İsim */}
      <h2 className="text-[15px] font-bold text-[#333333] mb-1.5 group-hover:text-[#2189ff] transition-colors">
        {category.name}
      </h2>

      {/* Alt kategori + ürün sayısı */}
      <div className="flex items-center gap-3 text-[12px] text-[#767676] mb-4">
        {childCount > 0 && (
          <span>{childCount} alt kategori</span>
        )}
        <span>{totalProducts.toLocaleString("tr-TR")} ürün</span>
      </div>

      {/* Alt kategoriler önizleme */}
      {category.children.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {category.children.slice(0, 4).map((child) => (
            <span
              key={child.id}
              className="text-[11px] text-[#555555] bg-[#f5f5f5] px-2 py-0.5 group-hover:bg-[#2189ff]/5 group-hover:text-[#2189ff] transition-colors truncate max-w-[140px]"
            >
              {child.name}
            </span>
          ))}
          {category.children.length > 4 && (
            <span className="text-[11px] text-[#2189ff] font-semibold px-1 py-0.5">
              +{category.children.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Ok ikonu */}
      <ArrowRight className="absolute top-6 right-6 h-4 w-4 text-[#cccccc] group-hover:text-[#2189ff] group-hover:translate-x-1 transition-all duration-200" aria-hidden />
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function KategorilerPage() {
  const categories = await getCategories()

  return (
    <div className="bg-[#f9f9f9] min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#eeeeee]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[12px] text-[#767676]"
          >
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-[#2189ff] transition-colors"
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
      <div className="bg-gradient-to-r from-[#2189ff] to-[#4da6ff] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-20 h-20 flex items-center justify-center bg-[#f5f5f5]">
              <Package className="h-9 w-9 text-[#dddddd]" aria-hidden />
            </div>
            <p className="font-bold text-[16px] text-[#333333]">Kategori bulunamadı</p>
            <p className="text-[#767676] text-[13px] max-w-xs">
              Henüz kategori oluşturulmamış. Lütfen daha sonra tekrar deneyin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
