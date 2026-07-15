"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import {
  SlidersHorizontal,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  X,
  Package,
  Search,
  ChevronDown,
  ArrowRight,
  Zap,
  Shield,
  Truck,
  Headphones,
  Monitor,
  Camera,
  Wifi,
  HardDrive,
  Server,
  Tag,
} from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PublicProductCard,
  PublicProductListItem,
  PublicProductCardSkeleton,
  PublicProductListItemSkeleton,
  type PublicProduct,
} from "@/components/public/public-product-card"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type ViewMode = "grid" | "list"
type SortOption = "newest" | "name-asc" | "name-desc"

interface Brand {
  id: string
  name: string
  slug: string
}

interface CategoryNode {
  id: string
  name: string
  slug: string
  parentId: string | null
  imageUrl?: string | null
  children?: CategoryNode[]
}

interface PublicFilters {
  search: string
  brandSlug: string
  categorySlug: string
  sortBy: SortOption
  page: number
  inStock: boolean
}

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "En Yeni" },
  { value: "name-asc", label: "İsme Göre (A-Z)" },
  { value: "name-desc", label: "İsme Göre (Z-A)" },
]

const PAGE_LIMIT = 20

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

function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
  const result: CategoryNode[] = []
  function walk(list: CategoryNode[]) {
    for (const n of list) {
      result.push(n)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return result
}

/* ------------------------------------------------------------------ */
/*  Hooks                                                               */
/* ------------------------------------------------------------------ */

function useFiltersFromURL(): PublicFilters {
  const searchParams = useSearchParams()
  return {
    search: searchParams.get("search") ?? "",
    brandSlug: searchParams.get("brandSlug") ?? "",
    categorySlug: searchParams.get("categorySlug") ?? "",
    sortBy: (searchParams.get("sortBy") as SortOption) ?? "newest",
    page: Math.max(1, Number(searchParams.get("page") ?? "1")),
    inStock: searchParams.get("inStock") !== "false",
  }
}

/* ------------------------------------------------------------------ */
/*  Hero Banner - Modern Minimal                                        */
/* ------------------------------------------------------------------ */

function HeroBanner({ total, onSearch }: { total: number; onSearch: (q: string) => void }) {
  const [query, setQuery] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) onSearch(trimmed)
  }

  return (
    <section className="relative bg-white border-b border-[#e2e8f0] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#f4f7fa] via-white to-white" />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748b] uppercase tracking-widest">
              <Zap className="h-3.5 w-3.5" aria-hidden />
              5.000+ Ürün
            </span>
            <span className="w-px h-4 bg-[#e2e8f0]" />
            <span className="text-xs font-medium text-[#64748b] uppercase tracking-widest">
              Teknoloji Çözüm Merkezi
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#1e3a5f] mb-4">
            Her Teknoloji <span className="text-[#5086a8]">İhtiyacı</span>
          </h1>

          <p className="text-lg text-[#64748b] mb-8 leading-relaxed">
            Güvenlik sistemlerinden bilgisayar donanımına, ağ çözümlerinden aksesuarlara kadar tüm teknoloji ürünleriniz için tek adres.
          </p>

          <form onSubmit={handleSubmit} className="flex max-w-xl" role="search" aria-label="Ürün ara">
            <div className="flex flex-1 h-14 bg-[#f4f7fa] border border-[#e2e8f0] overflow-hidden focus-within:border-[#999] focus-within:ring-4 focus-within:ring-[#f4f7fa]/50 transition-all rounded-l-[20px] rounded-r-lg">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ürün, marka veya model ara..."
                className="flex-1 px-6 text-[15px] text-[#1e3a5f] placeholder:text-[#999] focus:outline-none bg-transparent"
                aria-label="Arama terimi"
              />
              <button
                type="submit"
                className="h-full px-8 bg-[#5086a8] hover:bg-[#15294a] text-white font-semibold text-[13px] uppercase tracking-wider transition-colors rounded-r-[20px] flex items-center gap-2"
              >
                <Search className="h-4 w-4" aria-hidden />
                <span className="hidden sm:block">Ara</span>
              </button>
            </div>
          </form>

          {total > 0 && (
            <p className="mt-4 text-sm text-[#999]">
              <span className="font-semibold text-[#555]">{total.toLocaleString("tr-TR")}</span> ürün bulunuyor
            </p>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-8 mt-12 pt-8 border-t border-[#e2e8f0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f4f7fa] flex items-center justify-center">
              <Shield className="h-5 w-5 text-[#1e3a5f]" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1e3a5f]">2 Yıl Garanti</p>
              <p className="text-xs text-[#64748b]">Tüm ürünlerde</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f4f7fa] flex items-center justify-center">
              <Truck className="h-5 w-5 text-[#1e3a5f]" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1e3a5f]">Hızlı Teslimat</p>
              <p className="text-xs text-[#64748b]">24-48 saat içinde</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f4f7fa] flex items-center justify-center">
              <Headphones className="h-5 w-5 text-[#1e3a5f]" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1e3a5f]">7/24 Destek</p>
              <p className="text-xs text-[#64748b]">WhatsApp ile</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Category Grid - Modern Minimal                                     */
/* ------------------------------------------------------------------ */

const CATEGORY_GRADIENTS = [
  "from-[#5086a8] to-[#1a6fe0]",
  "from-[#1e3a5f] to-[#2d6da3]",
  "from-[#0c2340] to-[#1a5276]",
  "from-[#2c3e50] to-[#3498db]",
  "from-[#1a3c5e] to-[#2980b9]",
  "from-[#0d3b66] to-[#1d6fa5]",
]

function CategoryGrid({
  categories,
  activeSlug,
  onSelect,
}: {
  categories: CategoryNode[]
  activeSlug: string
  onSelect: (slug: string) => void
}) {
  if (categories.length === 0) return null

  return (
    <section className="bg-white border-b border-[#e2e8f0]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-[#5086a8] text-white px-3 py-1 rounded-full text-xs font-bold">
              <Package className="w-3 h-3" />
              KATEGORİLER
            </span>
          </div>
          <Link
            href="/kategoriler"
            className="text-sm font-semibold text-[#5086a8] hover:text-[#15294a] transition-colors flex items-center gap-1 group"
          >
            Tümünü Gör
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Tüm Ürünler kartı */}
          <button
            type="button"
            onClick={() => onSelect("")}
            className="relative flex flex-col justify-end rounded-2xl overflow-hidden h-44 group"
            aria-pressed={!activeSlug}
          >
            <div className={cn(
              "absolute inset-0 transition-all duration-300",
              !activeSlug
                ? "bg-gradient-to-br from-[#5086a8] to-[#1a6fe0] ring-2 ring-[#5086a8] ring-offset-2"
                : "bg-gradient-to-br from-[#5086a8] to-[#1a6fe0]"
            )} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div className="relative z-10 p-4">
              <p className="text-white font-bold text-sm leading-tight">Tüm Ürünler</p>
              <p className="text-white/70 text-xs mt-1">Hepsi</p>
            </div>
          </button>

          {categories.slice(0, 5).map((cat, i) => {
            const gradient = CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length]
            const hasImage = !!cat.imageUrl
            const isActive = activeSlug === cat.slug
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelect(cat.slug)}
                className={cn(
                  "relative flex flex-col justify-end rounded-2xl overflow-hidden h-44 group transition-all duration-300",
                  isActive && "ring-2 ring-[#5086a8] ring-offset-2"
                )}
                aria-pressed={isActive}
              >
                {hasImage ? (
                  <img
                    src={cat.imageUrl!}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                {!hasImage && (
                  <div className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    {getCategoryIcon(cat.slug)}
                  </div>
                )}
                <div className="relative z-10 p-4">
                  <p className="text-white font-bold text-sm leading-tight line-clamp-2">{cat.name}</p>
                  {cat.children && cat.children.length > 0 && (
                    <p className="text-white/70 text-xs mt-1">{cat.children.length} alt kategori</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Empty State - Modern Minimal                                       */
/* ------------------------------------------------------------------ */

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-5">
      <div className="w-24 h-24 rounded-[20px] bg-[#f4f7fa] flex items-center justify-center">
        <Package className="h-10 w-10 text-[#bebebe]" aria-hidden />
      </div>
      <div className="space-y-2">
        <p className="font-semibold text-xl text-[#1e3a5f]">Ürün Bulunamadı</p>
        <p className="text-[#64748b] text-sm max-w-sm">
          Arama kriterlerinize uygun ürün bulunamadı. Filtreleri değiştirmeyi deneyin.
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-2 h-11 px-6 bg-[#5086a8] text-white text-sm font-medium hover:bg-[#15294a] transition-colors rounded-lg"
      >
        Filtreleri Temizle
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Mobile Filter Bottom Sheet - Modern Minimal                       */
/* ------------------------------------------------------------------ */

function MobileFilterSheet({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[#1e3a5f]/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-2xl flex flex-col max-h-[85vh] rounded-t-[20px]"
        role="dialog"
        aria-modal
        aria-label="Filtreler"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
          <p className="font-semibold text-base text-[#1e3a5f]">Filtreler</p>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#999] hover:text-[#1e3a5f] hover:bg-[#f4f7fa] rounded-lg transition-colors"
            aria-label="Filtreleri kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        <div className="p-4 border-t border-[#e2e8f0]">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 bg-[#5086a8] text-white font-medium text-sm rounded-lg hover:bg-[#15294a] transition-colors"
          >
            Filtreleri Uygula
          </button>
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Filters Sidebar Content - Modern Minimal                          */
/* ------------------------------------------------------------------ */

function CatalogFilters({
  brands,
  categories,
  filters,
  onChange,
}: {
  brands: Brand[]
  categories: CategoryNode[]
  filters: PublicFilters
  onChange: (updated: Partial<PublicFilters>) => void
}) {
  const [brandSearch, setBrandSearch] = useState("")
  const [showAllBrands, setShowAllBrands] = useState(false)
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())

  const filteredBrands = brandSearch
    ? brands.filter((b) => b.name.toLowerCase().includes(brandSearch.toLowerCase()))
    : brands

  const visibleBrands = showAllBrands ? filteredBrands : filteredBrands.slice(0, 8)

  function toggleParent(id: string) {
    setExpandedParents((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Aktif slug'ın tüm parent'larını otomatik aç
  function findAndExpand(slug: string, nodes: CategoryNode[], path: string[] = []): string[] {
    for (const node of nodes) {
      if (node.slug === slug) return [...path, node.id]
      if (node.children?.length) {
        const found = findAndExpand(slug, node.children, [...path, node.id])
        if (found.length) return found
      }
    }
    return []
  }

  // Aktif kategori yolunu aç
  const activePath = filters.categorySlug ? findAndExpand(filters.categorySlug, categories) : []
  const allExpanded = new Set([...expandedParents, ...activePath])

  // Recursive tree item
  function CategoryTreeItem({ cat, depth = 0 }: { cat: CategoryNode; depth?: number }) {
    const hasChildren = cat.children && cat.children.length > 0
    const isExpanded = allExpanded.has(cat.id)
    const isActive = filters.categorySlug === cat.slug
    const isRoot = depth === 0

    return (
      <div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() =>
              onChange({
                categorySlug: filters.categorySlug === cat.slug ? "" : cat.slug,
                page: 1,
              })
            }
            className={cn(
              "flex-1 text-left py-1.5 px-3 transition-all rounded-lg",
              isRoot ? "text-sm font-medium" : "text-[13px]",
              isActive
                ? "bg-[#5086a8] text-white"
                : isRoot
                  ? "text-[#555] hover:bg-[#f4f7fa]"
                  : "text-[#64748b] hover:bg-[#f4f7fa] hover:text-[#555]"
            )}
            aria-pressed={isActive}
          >
            {cat.name}
          </button>
          {hasChildren && (
            <button
              type="button"
              onClick={() => toggleParent(cat.id)}
              className={cn(
                "p-1 rounded transition-all",
                isExpanded
                  ? "text-[#5086a8] bg-[#5086a8]/10"
                  : "text-[#999] hover:bg-[#f4f7fa]"
              )}
              aria-label={isExpanded ? "Daralt" : "Genişlet"}
            >
              <ChevronDown className={cn(
                "h-3 w-3 transition-transform duration-200",
                isExpanded && "rotate-180"
              )} />
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-3 border-l-2 border-[#e2e8f0] pl-1 mt-0.5 mb-0.5 space-y-0.5">
            {cat.children!.map((child) => (
              <CategoryTreeItem key={child.id} cat={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside aria-label="Ürün filtreleri" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#999]">
          Filtreler
        </h3>
        {filters.categorySlug || filters.brandSlug || filters.search ? (
          <button
            type="button"
            onClick={() => onChange({ categorySlug: "", brandSlug: "", search: "", page: 1 })}
            className="text-xs font-medium text-[#64748b] hover:text-[#1e3a5f] transition-colors"
          >
            Temizle
          </button>
        ) : null}
      </div>

      {/* Stok filtresi */}
      <div>
        <label className="flex items-center gap-2.5 cursor-pointer py-1">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => onChange({ inStock: e.target.checked, page: 1 })}
            className="sr-only"
          />
          <div className={cn(
            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
            filters.inStock
              ? "bg-[#5086a8] border-[#5086a8]"
              : "border-[#e2e8f0]"
          )}>
            {filters.inStock && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm text-[#555]">Sadece stokta olanlar</span>
        </label>
      </div>

      {categories.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-3">
            Kategoriler
          </p>
          <button
            type="button"
            onClick={() => onChange({ categorySlug: "", page: 1 })}
            className={cn(
              "w-full text-left py-2.5 px-3 text-sm font-medium transition-all rounded-lg",
              !filters.categorySlug
                ? "bg-[#5086a8] text-white"
                : "text-[#555] hover:bg-[#f4f7fa]"
            )}
            aria-pressed={!filters.categorySlug}
          >
            Tüm Kategoriler
          </button>
          {categories.map((cat) => (
            <CategoryTreeItem key={cat.id} cat={cat} depth={0} />
          ))}
        </div>
      )}

      {brands.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#999]">
            Markalar
          </p>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999] pointer-events-none"
              aria-hidden
            />
            <input
              type="text"
              placeholder="Marka ara..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-sm bg-[#f4f7fa] border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#999] focus:ring-2 focus:ring-[#f4f7fa] transition-all"
              aria-label="Marka ara"
            />
          </div>
          <div
            className="space-y-1 max-h-48 overflow-y-auto pr-1"
            role="group"
            aria-label="Marka filtresi"
          >
            {visibleBrands.map((brand) => {
              const isChecked = filters.brandSlug === brand.slug
              return (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      brandSlug: isChecked ? "" : brand.slug,
                      page: 1,
                    })
                  }
                  className="flex items-center gap-3 py-2 px-3 cursor-pointer rounded-lg hover:bg-[#f4f7fa] transition-colors w-full text-left"
                  aria-pressed={isChecked}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                    isChecked
                      ? "bg-[#5086a8] border-[#5086a8]"
                      : "border-[#e2e8f0]"
                  )}>
                    {isChecked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#555] flex-1 truncate">
                    {brand.name}
                  </span>
                </button>
              )
            })}
          </div>
          {filteredBrands.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAllBrands((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium text-[#64748b] hover:text-[#1e3a5f] transition-colors"
            >
              {showAllBrands ? "Daha az" : `+${filteredBrands.length - 8} marka`}
              <ChevronDown className={cn("h-3 w-3 transition-transform", showAllBrands && "rotate-180")} />
            </button>
          )}
        </div>
      )}
    </aside>
  )
}

/* ------------------------------------------------------------------ */
/*  Active Filter Tags - Modern Minimal                                */
/* ------------------------------------------------------------------ */

function ActiveFilterTags({
  filters,
  brands,
  categories,
  total,
  isLoading,
  onRemove,
  onClearAll,
}: {
  filters: PublicFilters
  brands: Brand[]
  categories: CategoryNode[]
  total: number
  isLoading: boolean
  onRemove: (key: keyof PublicFilters) => void
  onClearAll: () => void
}) {
  const activeTags: { key: keyof PublicFilters; label: string }[] = []

  if (filters.search) {
    activeTags.push({ key: "search", label: `"${filters.search}"` })
  }
  if (filters.brandSlug) {
    const brand = brands.find((b) => b.slug === filters.brandSlug)
    activeTags.push({ key: "brandSlug", label: brand?.name ?? filters.brandSlug })
  }
  if (filters.categorySlug) {
    const cat = categories
      .flatMap((c) => [c, ...(c.children ?? [])])
      .find((c) => c.slug === filters.categorySlug)
    activeTags.push({ key: "categorySlug", label: cat?.name ?? filters.categorySlug })
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm text-[#64748b]">
        {isLoading ? (
          <Skeleton className="h-5 w-24 inline-block" />
        ) : (
          <>
            <span className="font-semibold text-[#1e3a5f]">{total.toLocaleString("tr-TR")}</span> ürün
          </>
        )}
      </span>

      {activeTags.map((tag) => (
        <span
          key={tag.key}
          className="inline-flex items-center gap-1.5 h-8 px-3 bg-[#f4f7fa] text-[#555] text-sm font-medium rounded-full"
        >
          {tag.label}
          <button
            type="button"
            onClick={() => onRemove(tag.key)}
            className="ml-0.5 hover:text-red-500 transition-colors"
            aria-label={`${tag.label} filtresini kaldır`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}

      {activeTags.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-sm text-[#64748b] hover:text-red-500 transition-colors"
        >
          Tümünü temizle
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page - Modern Minimal                                              */
/* ------------------------------------------------------------------ */

export default function KatalogPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const filters = useFiltersFromURL()
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  const [products, setProducts] = useState<PublicProduct[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [isLoadingFilters, setIsLoadingFilters] = useState(true)

  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  useEffect(() => {
    setIsLoadingFilters(true)
    Promise.all([
      fetch("/api/public/brands").then((r) => r.json()),
      fetch("/api/public/categories").then((r) => r.json()),
    ])
      .then(([brandData, catData]) => {
        setBrands(brandData.data ?? [])
        setCategories(catData.data ?? [])
      })
      .catch(() => {
        setBrands([])
        setCategories([])
      })
      .finally(() => setIsLoadingFilters(false))
  }, [])

  const updateURL = useCallback(
    (updated: Partial<PublicFilters>) => {
      const next = { ...filters, ...updated }
      const params = new URLSearchParams()

      if (next.search) params.set("search", next.search)
      if (next.brandSlug) params.set("brandSlug", next.brandSlug)
      if (next.categorySlug) params.set("categorySlug", next.categorySlug)
      params.set("sortBy", next.sortBy)
      if (next.page > 1) params.set("page", String(next.page))
      if (!next.inStock) params.set("inStock", "false")

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [filters, pathname, router]
  )

  useEffect(() => {
    setIsLoadingProducts(true)
    const params = new URLSearchParams()

    if (filters.search) params.set("search", filters.search)
    if (filters.brandSlug) params.set("brandSlug", filters.brandSlug)
    if (filters.categorySlug) params.set("categorySlug", filters.categorySlug)
    params.set("page", String(filters.page))
    params.set("limit", String(PAGE_LIMIT))
    params.set("sortBy", filters.sortBy)
    if (!filters.inStock) params.set("inStock", "false")

    fetch(`/api/public/catalog/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.data ?? [])
        setTotal(data.meta?.total ?? 0)
        setTotalPages(data.meta?.totalPages ?? 1)
      })
      .catch(() => {
        setProducts([])
        setTotal(0)
        setTotalPages(1)
      })
      .finally(() => setIsLoadingProducts(false))
  }, [searchParams])

  const activeFilterCount = [filters.brandSlug, filters.categorySlug, filters.search].filter(Boolean).length

  function clearAllFilters() {
    updateURL({
      search: "",
      brandSlug: "",
      categorySlug: "",
      page: 1,
      inStock: true,
    })
  }

  function handleSearchSubmit(query: string) {
    updateURL({ search: query, page: 1 })
  }

  function handleFilterRemove(key: keyof PublicFilters) {
    updateURL({ [key]: "", page: 1 } as Partial<PublicFilters>)
  }

  function onChange(updated: Partial<PublicFilters>) {
    updateURL(updated)
    setFilterSheetOpen(false)
  }

  const filtersPanel = (
    <CatalogFilters
      brands={brands}
      categories={categories}
      filters={filters}
      onChange={onChange}
    />
  )

  const showHero = !filters.search && !filters.brandSlug && !filters.categorySlug && filters.page === 1
  const showCategoryGrid = !filters.search && !filters.brandSlug && filters.page === 1

  // Seçili kategorinin tam yolunu bul
  function getCategoryPath(slug: string, nodes: CategoryNode[], path: CategoryNode[] = []): CategoryNode[] | null {
    for (const n of nodes) {
      if (n.slug === slug) return [...path, n]
      if (n.children?.length) {
        const found = getCategoryPath(slug, n.children, [...path, n])
        if (found) return found
      }
    }
    return null
  }
  const selectedCatPath = filters.categorySlug ? getCategoryPath(filters.categorySlug, categories) : null

  return (
    <div className="bg-[#f4f7fa] min-h-screen">
      {showHero && (
        <HeroBanner total={total} onSearch={handleSearchSubmit} />
      )}

      {/* Category Breadcrumb */}
      {selectedCatPath && (
        <div className="bg-white border-b border-[#eeeeee]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex items-center gap-1.5 text-[12px] text-[#64748b] flex-wrap">
              <Link href="/katalog" className="hover:text-[#5086a8] transition-colors">Katalog</Link>
              {selectedCatPath.map((cat, i) => (
                <span key={cat.slug} className="contents">
                  <ChevronRight className="h-3 w-3 text-[#dddddd]" aria-hidden />
                  {i < selectedCatPath.length - 1 ? (
                    <Link
                      href={`/katalog?categorySlug=${cat.slug}`}
                      className="hover:text-[#5086a8] transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ) : (
                    <span className="text-[#333333] font-semibold">{cat.name}</span>
                  )}
                </span>
              ))}
            </nav>
          </div>
        </div>
      )}

      {showCategoryGrid && categories.length > 0 && (
        <CategoryGrid
          categories={categories}
          activeSlug={filters.categorySlug}
          onSelect={(slug) => updateURL({ categorySlug: slug, page: 1 })}
        />
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-8">
          <aside
            className="hidden lg:block w-64 shrink-0 self-start sticky top-4"
            aria-label="Filtreler"
          >
            <div className="bg-white rounded-[20px] p-5 shadow-sm">
              {isLoadingFilters ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-16" />
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                filtersPanel
              )}
            </div>
          </aside>

          <div className="flex-1 min-w-0 space-y-5">
            <div className="bg-white rounded-[20px] p-4 shadow-sm">
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilterSheetOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 h-10 px-4 bg-[#f4f7fa] border border-[#e2e8f0] text-sm font-medium text-[#555] hover:bg-[#f4f7fa] transition-colors rounded-lg"
                  aria-label="Filtreleri aç"
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden />
                  Filtreler
                  {activeFilterCount > 0 && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#5086a8] text-white text-xs font-semibold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <ActiveFilterTags
                  filters={filters}
                  brands={brands}
                  categories={flattenCategories(categories)}
                  total={total}
                  isLoading={isLoadingProducts}
                  onRemove={handleFilterRemove}
                  onClearAll={clearAllFilters}
                />

                <div className="flex items-center gap-3 ml-auto">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={filters.inStock}
                      onChange={(e) => updateURL({ inStock: e.target.checked, page: 1 })}
                      className="w-4 h-4 rounded border-[#e2e8f0] text-[#5086a8] focus:ring-[#5086a8]/30"
                    />
                    <span className="text-xs font-medium text-[#64748b] whitespace-nowrap">Stoktakiler</span>
                  </label>

                  <Select
                    value={filters.sortBy}
                    onValueChange={(val) =>
                      updateURL({ sortBy: val as SortOption, page: 1 })
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-40 h-10 border-[#e2e8f0] text-sm font-medium rounded-lg focus:ring-0"
                      aria-label="Sıralama"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-sm">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div
                    className="flex bg-[#f4f7fa] rounded-lg overflow-hidden p-1"
                    role="group"
                    aria-label="Görünüm modu"
                  >
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "p-2.5 rounded-lg transition-all",
                        viewMode === "grid"
                          ? "bg-[#5086a8] text-white shadow-sm"
                          : "text-[#64748b] hover:text-[#1e3a5f]"
                      )}
                      aria-label="Grid görünüm"
                      aria-pressed={viewMode === "grid"}
                    >
                      <Grid3X3 className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "p-2.5 rounded-lg transition-all",
                        viewMode === "list"
                          ? "bg-[#5086a8] text-white shadow-sm"
                          : "text-[#64748b] hover:text-[#1e3a5f]"
                      )}
                      aria-label="Liste görünüm"
                      aria-pressed={viewMode === "list"}
                    >
                      <List className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {isPending && (
              <div className="h-1 bg-[#f4f7fa] rounded-full overflow-hidden">
                <div className="h-full bg-[#5086a8] animate-pulse" style={{ width: "40%" }} />
              </div>
            )}

            {isLoadingProducts ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: PAGE_LIMIT }).map((_, i) => (
                    <PublicProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <PublicProductListItemSkeleton key={i} />
                  ))}
                </div>
              )
            ) : products.length === 0 ? (
              <div className="bg-white rounded-[20px] shadow-sm">
                <EmptyState onClear={clearAllFilters} />
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <PublicProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => (
                  <PublicProductListItem key={product.id} product={product} />
                ))}
              </div>
            )}

            {!isLoadingProducts && totalPages > 1 && (
              <nav
                aria-label="Sayfalama"
                className="flex items-center justify-center gap-2 pt-4"
              >
                <button
                  type="button"
                  onClick={() => updateURL({ page: filters.page - 1 })}
                  disabled={filters.page <= 1}
                  aria-label="Önceki sayfa"
                  className="inline-flex items-center justify-center h-10 w-10 border border-[#e2e8f0] text-[#555] hover:border-[#5086a8] hover:text-[#5086a8] disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-lg bg-white"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>

                {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                  let pageNum: number
                  if (totalPages <= 7) {
                    pageNum = i + 1
                  } else if (filters.page <= 4) {
                    pageNum = i + 1
                  } else if (filters.page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i
                  } else {
                    pageNum = filters.page - 3 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => updateURL({ page: pageNum })}
                      aria-label={`Sayfa ${pageNum}`}
                      aria-current={filters.page === pageNum ? "page" : undefined}
                      className={cn(
                        "inline-flex items-center justify-center h-10 w-10 text-sm font-semibold transition-all rounded-lg",
                        filters.page === pageNum
                          ? "bg-[#5086a8] text-white border border-[#5086a8]"
                          : "bg-white border border-[#e2e8f0] text-[#555] hover:border-[#5086a8] hover:text-[#5086a8]"
                      )}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                <button
                  type="button"
                  onClick={() => updateURL({ page: filters.page + 1 })}
                  disabled={filters.page >= totalPages}
                  aria-label="Sonraki sayfa"
                  className="inline-flex items-center justify-center h-10 w-10 border border-[#e2e8f0] text-[#555] hover:border-[#5086a8] hover:text-[#5086a8] disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-lg bg-white"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>

      <MobileFilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
      >
        {filtersPanel}
      </MobileFilterSheet>
    </div>
  )
}
