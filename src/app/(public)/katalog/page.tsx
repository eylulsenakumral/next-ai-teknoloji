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
  Monitor,
  Camera,
  Wifi,
  HardDrive,
  Headphones,
  Shield,
  Server,
  Tag,
} from "lucide-react"
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
}

interface CategoryNode {
  id: string
  name: string
  slug: string
  parentId: string | null
  children?: CategoryNode[]
}

interface PublicFilters {
  search: string
  brandSlug: string
  categorySlug: string
  sortBy: SortOption
  page: number
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

/* Category icons */
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  bilgisayar: <Monitor className="h-5 w-5" aria-hidden />,
  "guvenlik-kameralari": <Camera className="h-5 w-5" aria-hidden />,
  "guvenlik-sistemleri": <Shield className="h-5 w-5" aria-hidden />,
  network: <Wifi className="h-5 w-5" aria-hidden />,
  depolama: <HardDrive className="h-5 w-5" aria-hidden />,
  sunucu: <Server className="h-5 w-5" aria-hidden />,
  aksesuar: <Headphones className="h-5 w-5" aria-hidden />,
}

function getCategoryIcon(slug: string): React.ReactNode {
  return CATEGORY_ICONS[slug] ?? <Tag className="h-5 w-5" aria-hidden />
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
  }
}

/* ------------------------------------------------------------------ */
/*  Hero Banner                                                         */
/* ------------------------------------------------------------------ */

function HeroBanner({ total, onSearch }: { total: number; onSearch: (q: string) => void }) {
  const [query, setQuery] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) onSearch(trimmed)
  }

  return (
    <div className="bg-gradient-to-r from-[#00179e] to-[#0025d4] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="max-w-2xl">
          <p className="text-[12px] font-bold uppercase tracking-widest text-white/60 mb-2">
            Türkiye'nin Teknoloji Çözüm Merkezi
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight mb-2">
            5.000+ Teknoloji Ürünü
          </h1>
          <p className="text-[15px] text-white/80 mb-6">
            Güvenlik, bilgisayar, network ve daha fazlası — en iyi fiyat tekliflerini hemen alın.
          </p>

          {/* Hero arama */}
          <form
            onSubmit={handleSubmit}
            className="flex max-w-lg"
            role="search"
            aria-label="Ürün ara"
          >
            <div className="flex flex-1 h-12 bg-white overflow-hidden shadow-lg">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ürün, marka veya model ara..."
                className="flex-1 px-4 text-[14px] text-[#333333] placeholder:text-[#aaaaaa] focus:outline-none"
                aria-label="Arama terimi"
              />
              <button
                type="submit"
                className="h-12 px-5 bg-[#00179e] hover:bg-[#001489] text-white font-bold text-[13px] uppercase tracking-wider transition-colors whitespace-nowrap border-l border-white/10"
              >
                <Search className="h-4 w-4 sm:hidden" aria-hidden />
                <span className="hidden sm:block">Ara</span>
              </button>
            </div>
          </form>

          {total > 0 && (
            <p className="mt-3 text-[13px] text-white/60">
              Katalogda{" "}
              <span className="font-bold text-white">{total.toLocaleString("tr-TR")}</span>{" "}
              ürün bulunuyor
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Category Grid                                                       */
/* ------------------------------------------------------------------ */

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
    <div className="bg-white border-b border-[#eeeeee]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <p className="text-[11px] font-bold text-[#767676] uppercase tracking-widest mb-3">
          Kategoriler
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Tümü */}
          <button
            type="button"
            onClick={() => onSelect("")}
            className={cn(
              "flex flex-col items-center gap-2 p-3 border transition-all text-center rounded-lg",
              !activeSlug
                ? "border-[#00179e] bg-[#00179e]/5 text-[#00179e]"
                : "border-[#eeeeee] hover:border-[#00179e]/40 hover:bg-[#f9f9f9] text-[#555555]"
            )}
            aria-pressed={!activeSlug}
          >
            <Package className="h-5 w-5" aria-hidden />
            <span className="text-[11px] font-semibold leading-tight">Tüm Ürünler</span>
          </button>

          {categories.slice(0, 5).map((cat) => (
            <div key={cat.id} className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onSelect(cat.slug)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 border transition-all text-center rounded-lg",
                  activeSlug === cat.slug
                    ? "border-[#00179e] bg-[#00179e]/5 text-[#00179e]"
                    : "border-[#eeeeee] hover:border-[#00179e]/40 hover:bg-[#f9f9f9] text-[#555555]"
                )}
                aria-pressed={activeSlug === cat.slug}
              >
                {getCategoryIcon(cat.slug)}
                <span className="text-[11px] font-semibold leading-tight line-clamp-2">
                  {cat.name}
                </span>
              </button>
              {/* Show first 2 subcategories */}
              {cat.children && cat.children.length > 0 && (
                <div className="flex flex-col gap-1 pl-2">
                  {cat.children.slice(0, 2).map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => onSelect(child.slug)}
                      className={cn(
                        "text-left text-[10px] px-2 py-1 rounded transition-colors truncate",
                        activeSlug === child.slug
                          ? "bg-[#00179e]/10 text-[#00179e] font-semibold"
                          : "text-[#767676] hover:text-[#00179e] hover:bg-[#f5f5f5]"
                      )}
                      aria-pressed={activeSlug === child.slug}
                    >
                      {child.name}
                    </button>
                  ))}
                  {cat.children.length > 2 && (
                    <button
                      type="button"
                      onClick={() => onSelect(cat.slug)}
                      className="text-left text-[9px] text-[#00179e] hover:underline pl-2"
                    >
                      +{cat.children.length - 2} daha
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                         */
/* ------------------------------------------------------------------ */

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="w-20 h-20 flex items-center justify-center bg-[#f5f5f5]">
        <Package className="h-9 w-9 text-[#dddddd]" aria-hidden />
      </div>
      <div>
        <p className="font-bold text-[16px] text-[#333333]">Ürün Bulunamadı</p>
        <p className="text-[#767676] text-[13px] mt-1 max-w-xs">
          Arama kriterlerinize uygun ürün bulunamadı. Filtreleri değiştirmeyi deneyin.
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-1.5 h-9 px-5 border border-[#eeeeee] text-[13px] text-[#333333] hover:border-[#00179e] hover:text-[#00179e] transition-colors"
      >
        Filtreleri Temizle
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Mobile Filter Bottom Sheet                                          */
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
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-2xl flex flex-col max-h-[80vh] rounded-t-2xl"
        role="dialog"
        aria-modal
        aria-label="Filtreler"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eeeeee]">
          <p className="font-bold text-[14px] text-[#333333] uppercase tracking-wider">Filtreler</p>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#767676] hover:text-[#333333] transition-colors"
            aria-label="Filtreleri kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        <div className="p-4 border-t border-[#eeeeee]">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 bg-[#00179e] text-white font-bold text-[13px] uppercase tracking-wider hover:bg-[#001489] transition-colors"
          >
            Filtreleri Uygula
          </button>
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Filters Sidebar Content                                             */
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

  const filteredBrands = brandSearch
    ? brands.filter((b) => b.name.toLowerCase().includes(brandSearch.toLowerCase()))
    : brands

  const visibleBrands = showAllBrands ? filteredBrands : filteredBrands.slice(0, 10)

  function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
    const result: CategoryNode[] = []
    for (const node of nodes) {
      result.push(node)
      if (node.children?.length) {
        result.push(...flattenCategories(node.children))
      }
    }
    return result
  }

  const flatCategories = flattenCategories(categories)

  return (
    <aside aria-label="Ürün filtreleri">
      {/* Kategoriler */}
      {flatCategories.length > 0 && (
        <div className="py-4 border-b border-[#eeeeee]">
          <p className="text-[11px] font-bold text-[#333333] uppercase tracking-widest mb-3">
            Kategoriler
          </p>
          <div className="space-y-0.5" role="group" aria-label="Kategori filtresi">
            <button
              type="button"
              onClick={() => onChange({ categorySlug: "", page: 1 })}
              className={cn(
                "w-full text-left px-2 py-1.5 text-[13px] transition-colors rounded",
                !filters.categorySlug
                  ? "text-[#00179e] font-bold bg-[#00179e]/5"
                  : "text-[#555555] hover:text-[#00179e] hover:bg-[#f5f5f5]"
              )}
              aria-pressed={!filters.categorySlug}
            >
              Tüm Kategoriler
            </button>
            {flatCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  onChange({
                    categorySlug: filters.categorySlug === cat.slug ? "" : cat.slug,
                    page: 1,
                  })
                }
                className={cn(
                  "w-full text-left px-2 py-1.5 text-[13px] transition-colors rounded",
                  cat.parentId ? "pl-5" : "",
                  filters.categorySlug === cat.slug
                    ? "text-[#00179e] font-bold bg-[#00179e]/5"
                    : "text-[#555555] hover:text-[#00179e] hover:bg-[#f5f5f5]"
                )}
                aria-pressed={filters.categorySlug === cat.slug}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Markalar */}
      {brands.length > 0 && (
        <div className="py-4 border-b border-[#eeeeee]">
          <p className="text-[11px] font-bold text-[#333333] uppercase tracking-widest mb-3">
            Markalar
          </p>
          <div className="relative mb-3">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#767676] pointer-events-none"
              aria-hidden
            />
            <input
              type="text"
              placeholder="Marka ara..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="w-full h-8 border border-[#eeeeee] bg-white pl-8 pr-3 text-[12px] text-[#333333] placeholder:text-[#767676] focus:outline-none focus:border-[#00179e] transition-colors rounded"
              aria-label="Marka ara"
            />
          </div>
          <div
            className="space-y-0"
            role="group"
            aria-label="Marka filtresi"
          >
            {visibleBrands.map((brand) => {
              const slug = brand.name.toLowerCase().replace(/\s+/g, "-")
              const isChecked = filters.brandSlug === slug
              return (
                <label
                  key={brand.id}
                  className="flex items-center gap-2.5 py-1.5 cursor-pointer hover:text-[#00179e] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      onChange({ brandSlug: isChecked ? "" : slug, page: 1 })
                    }}
                    aria-label={`${brand.name} markasını filtrele`}
                    className="h-3.5 w-3.5 accent-[#00179e]"
                  />
                  <span className="text-[13px] text-[#555555] flex-1 truncate">
                    {brand.name}
                  </span>
                </label>
              )
            })}
          </div>
          {filteredBrands.length > 10 && (
            <button
              type="button"
              onClick={() => setShowAllBrands((v) => !v)}
              className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-[#00179e] hover:text-[#001489] transition-colors"
            >
              {showAllBrands ? (
                <>Daha az göster <ChevronDown className="h-3 w-3 rotate-180" /></>
              ) : (
                <>+{filteredBrands.length - 10} marka daha <ChevronDown className="h-3 w-3" /></>
              )}
            </button>
          )}
        </div>
      )}

      {/* Stok Durumu - placeholder */}
      <div className="py-4">
        <p className="text-[11px] font-bold text-[#333333] uppercase tracking-widest mb-3">
          Stok Durumu
        </p>
        <div className="flex flex-col gap-1">
          <p className="text-[12px] text-[#aaaaaa] italic">Yakında aktif olacak</p>
        </div>
      </div>
    </aside>
  )
}

/* ------------------------------------------------------------------ */
/*  Active Filter Tags                                                  */
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
    const brand = brands.find(
      (b) => b.name.toLowerCase().replace(/\s+/g, "-") === filters.brandSlug
    )
    activeTags.push({ key: "brandSlug", label: brand?.name ?? filters.brandSlug })
  }
  if (filters.categorySlug) {
    const cat = categories
      .flatMap((c) => [c, ...(c.children ?? [])])
      .find((c) => c.slug === filters.categorySlug)
    activeTags.push({ key: "categorySlug", label: cat?.name ?? filters.categorySlug })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Sonuç sayacı */}
      <span className="text-[13px] text-[#555555] font-medium">
        {isLoading ? (
          <Skeleton className="h-4 w-32 inline-block" />
        ) : (
          <>
            <span className="font-bold text-[#333333]">{total.toLocaleString("tr-TR")}</span>{" "}
            ürün bulundu
          </>
        )}
      </span>

      {/* Aktif filtre etiketleri */}
      {activeTags.map((tag) => (
        <span
          key={tag.key}
          className="inline-flex items-center gap-1 h-6 px-2.5 bg-[#00179e]/10 text-[#00179e] text-[11px] font-semibold rounded-full"
        >
          {tag.label}
          <button
            type="button"
            onClick={() => onRemove(tag.key)}
            className="ml-0.5 hover:text-red-500 transition-colors"
            aria-label={`${tag.label} filtresini kaldır`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      {activeTags.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-[12px] text-[#767676] hover:text-red-500 transition-colors underline"
        >
          Tümünü Temizle
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
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
  const [searchInput, setSearchInput] = useState(filters.search)

  // Filtre verilerini getir (brands + categories) — bir kez
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

  // URL güncelleme
  const updateURL = useCallback(
    (updated: Partial<PublicFilters>) => {
      const next = { ...filters, ...updated }
      const params = new URLSearchParams()

      if (next.search) params.set("search", next.search)
      if (next.brandSlug) params.set("brandSlug", next.brandSlug)
      if (next.categorySlug) params.set("categorySlug", next.categorySlug)
      params.set("sortBy", next.sortBy)
      if (next.page > 1) params.set("page", String(next.page))

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [filters, pathname, router]
  )

  // Ürünleri getir
  useEffect(() => {
    setIsLoadingProducts(true)
    const params = new URLSearchParams()

    if (filters.search) params.set("search", filters.search)
    if (filters.brandSlug) params.set("brandSlug", filters.brandSlug)
    if (filters.categorySlug) params.set("categorySlug", filters.categorySlug)
    params.set("page", String(filters.page))
    params.set("limit", String(PAGE_LIMIT))
    params.set("sortBy", filters.sortBy)

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

  // Arama senkronizasyonu
  useEffect(() => {
    setSearchInput(filters.search)
  }, [filters.search])

  const activeFilterCount = [filters.brandSlug, filters.categorySlug, filters.search].filter(Boolean).length

  function clearAllFilters() {
    setSearchInput("")
    updateURL({
      search: "",
      brandSlug: "",
      categorySlug: "",
      page: 1,
    })
  }

  function handleSearchSubmit(query: string) {
    updateURL({ search: query, page: 1 })
  }

  function handleFilterRemove(key: keyof PublicFilters) {
    updateURL({ [key]: "", page: 1 } as Partial<PublicFilters>)
  }

  const pageStart = (filters.page - 1) * PAGE_LIMIT + 1
  const pageEnd = Math.min(filters.page * PAGE_LIMIT, total)

  const filtersPanel = (
    <CatalogFilters
      brands={brands}
      categories={categories}
      filters={filters}
      onChange={(updated) => {
        updateURL(updated)
        setFilterSheetOpen(false)
      }}
    />
  )

  // Hero sadece hiç filtre yokken göster
  const showHero = !filters.search && !filters.brandSlug && !filters.categorySlug && filters.page === 1
  // Kategori grid: hero gösterildiğinde veya sadece kategori filtresi yokken göster
  const showCategoryGrid = !filters.search && !filters.brandSlug && filters.page === 1

  return (
    <div className="bg-[#f5f5f5] min-h-screen">
      {/* Hero Banner — filtre yokken göster */}
      {showHero && (
        <HeroBanner
          total={total}
          onSearch={handleSearchSubmit}
        />
      )}

      {/* Kategori Grid — sadece arama/marka filtresi yokken */}
      {showCategoryGrid && categories.length > 0 && (
        <CategoryGrid
          categories={categories}
          activeSlug={filters.categorySlug}
          onSelect={(slug) => updateURL({ categorySlug: slug, page: 1 })}
        />
      )}

      {/* Ana içerik */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex gap-5">
          {/* Sol Sidebar — desktop */}
          <aside
            className="hidden lg:block w-[220px] shrink-0 self-start sticky top-4"
            aria-label="Filtreler"
          >
            <div className="bg-white border border-[#eeeeee]">
              <div className="px-4 py-3 border-b border-[#eeeeee] bg-[#fafafa]">
                <p className="font-bold text-[11px] text-[#333333] uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
                  Filtreler
                </p>
              </div>
              <div className="p-4">
                {isLoadingFilters ? (
                  <div className="space-y-3">
                    <Skeleton className="h-3 w-20" />
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-7 w-full" />
                    ))}
                  </div>
                ) : (
                  filtersPanel
                )}
              </div>
            </div>
          </aside>

          {/* Ana içerik kolonu */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Toolbar */}
            <div className="bg-white border border-[#eeeeee] px-4 py-2.5">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Mobil filtre butonu */}
                <button
                  type="button"
                  onClick={() => setFilterSheetOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 h-8 px-3 border border-[#eeeeee] text-[12px] font-semibold text-[#333333] hover:border-[#00179e] hover:text-[#00179e] transition-colors rounded"
                  aria-label="Filtreleri aç"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
                  Filtreler
                  {activeFilterCount > 0 && (
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#00179e] text-white text-[10px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Aktif filtreler + sonuç sayacı */}
                <ActiveFilterTags
                  filters={filters}
                  brands={brands}
                  categories={categories.flatMap((c) => [c, ...(c.children ?? [])])}
                  total={total}
                  isLoading={isLoadingProducts}
                  onRemove={handleFilterRemove}
                  onClearAll={clearAllFilters}
                />

                <div className="flex items-center gap-2 ml-auto">
                  {/* Sıralama */}
                  <Select
                    value={filters.sortBy}
                    onValueChange={(val) =>
                      updateURL({ sortBy: val as SortOption, page: 1 })
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-40 border-[#eeeeee] text-[#333333] text-[12px] rounded focus:ring-0"
                      aria-label="Sıralama"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="text-sm"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* View toggle */}
                  <div
                    className="flex border border-[#eeeeee] overflow-hidden rounded"
                    role="group"
                    aria-label="Görünüm modu"
                  >
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "p-2 transition-colors",
                        viewMode === "grid"
                          ? "bg-[#00179e] text-white"
                          : "text-[#767676] hover:bg-[#f5f5f5] hover:text-[#333333]"
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
                        "p-2 transition-colors border-l border-[#eeeeee]",
                        viewMode === "list"
                          ? "bg-[#00179e] text-white"
                          : "text-[#767676] hover:bg-[#f5f5f5] hover:text-[#333333]"
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

            {/* Progress bar */}
            {isPending && (
              <div className="h-0.5 bg-[#00179e]/20 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-[#00179e] animate-[progress_1s_ease-in-out_infinite]" style={{ width: "40%" }} />
              </div>
            )}

            {/* Ürün listesi */}
            {isLoadingProducts ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {Array.from({ length: PAGE_LIMIT }).map((_, i) => (
                    <PublicProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="border border-[#eeeeee] bg-white divide-y divide-[#eeeeee]">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <PublicProductListItemSkeleton key={i} />
                  ))}
                </div>
              )
            ) : products.length === 0 ? (
              <div className="bg-white border border-[#eeeeee]">
                <EmptyState onClear={clearAllFilters} />
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {products.map((product) => (
                  <PublicProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-[#eeeeee]">
                {products.map((product) => (
                  <PublicProductListItem key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Sayfalama */}
            {!isLoadingProducts && totalPages > 1 && (
              <nav
                aria-label="Sayfalama"
                className="flex items-center justify-center gap-1 pt-2"
              >
                <button
                  type="button"
                  onClick={() => updateURL({ page: filters.page - 1 })}
                  disabled={filters.page <= 1}
                  aria-label="Önceki sayfa"
                  className="inline-flex items-center justify-center h-9 w-9 border border-[#eeeeee] text-[#767676] hover:border-[#00179e] hover:text-[#00179e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white rounded"
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
                        "inline-flex items-center justify-center h-9 w-9 text-[13px] font-semibold transition-colors rounded",
                        filters.page === pageNum
                          ? "bg-[#00179e] text-white border border-[#00179e]"
                          : "bg-white border border-[#eeeeee] text-[#333333] hover:border-[#00179e] hover:text-[#00179e]"
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
                  className="inline-flex items-center justify-center h-9 w-9 border border-[#eeeeee] text-[#767676] hover:border-[#00179e] hover:text-[#00179e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white rounded"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>

      {/* Mobil filtre sheet */}
      <MobileFilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
      >
        {filtersPanel}
      </MobileFilterSheet>
    </div>
  )
}
