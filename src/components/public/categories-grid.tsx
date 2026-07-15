import Link from "next/link"
import { Package, ChevronRight, FolderTree } from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  image?: string
  count?: number
}

interface CategoriesGridProps {
  categories: Category[]
  title?: string
  cols?: 3 | 4 | 6
}

const colClasses: Record<3 | 4 | 6, string> = {
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  6: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-6",
}

const CATEGORY_GRADIENTS = [
  "from-[#0040a4] to-[#1a6fe0]",
  "from-[#1e3a5f] to-[#2d6da3]",
  "from-[#0c2340] to-[#1a5276]",
  "from-[#2c3e50] to-[#3498db]",
  "from-[#1a3c5e] to-[#2980b9]",
  "from-[#0d3b66] to-[#1d6fa5]",
]

export function CategoriesGrid({
  categories,
  title = "Kategoriler",
  cols = 4,
}: CategoriesGridProps) {
  if (categories.length === 0) return null

  return (
    <section className="py-14">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 bg-[#0040a4] text-white px-3 py-1 rounded-full text-xs font-bold">
                <FolderTree className="w-3 h-3" />
                KATEGORİLER
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#453e71]">{title}</h2>
          </div>
          <Link
            href="/katalog"
            className="text-sm font-semibold text-[#0040a4] hover:text-[#36305a] transition-colors flex items-center gap-1 group"
          >
            Tümünü Gör
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Category Grid */}
        <div className={`grid ${colClasses[cols]} gap-4`}>
          {categories.map((cat, idx) => {
            const hasImage = !!cat.image
            const gradient = CATEGORY_GRADIENTS[idx % CATEGORY_GRADIENTS.length]
            return (
              <Link
                key={cat.id}
                href={`/katalog?categorySlug=${encodeURIComponent(cat.slug)}`}
                className="group relative flex flex-col justify-end rounded-2xl overflow-hidden h-44 animate-fade-in-up"
                style={{ animationDelay: `${idx * 75}ms` }}
              >
                {hasImage ? (
                  <img
                    src={cat.image!}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                {!hasImage && (
                  <div className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="relative z-10 p-4">
                  <p className="text-white font-bold text-sm leading-tight line-clamp-2">
                    {cat.name}
                  </p>
                  {cat.count !== undefined && (
                    <p className="text-white/70 text-xs mt-1">{cat.count} ürün</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
