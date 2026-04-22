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
  Home,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProductCard, ProductCardSkeleton } from "@/components/products/product-card"
import { ProductListItem, ProductListItemSkeleton } from "@/components/products/product-list-item"
import { ProductFilters } from "@/components/products/product-filters"
import { cn } from "@/lib/utils"
import type {
  CatalogProduct,
  CategoryNode,
  BrandItem,
  SupplierItem,
  ProductFilters as FiltersType,
  ViewMode,
  SortOption,
} from "@/types/catalog"

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "En Yeni" },
  { value: "name", label: "İsme Göre (A-Z)" },
  { value: "price", label: "Fiyata Göre" },
]

function useFiltersFromURL(): FiltersType {
  const searchParams = useSearchParams()
  return {
    q: searchParams.get("q") ?? "",
    brandId: searchParams.get("brandId") ?? "",
    categoryId: searchParams.get("categoryId") ?? "",
    supplierId: searchParams.get("supplierId") ?? "",
    minPrice: searchParams.get("minPrice") ?? "",
    maxPrice: searchParams.get("maxPrice") ?? "",
    inStock: searchParams.get("inStock") === "true" ? true : searchParams.get("inStock") === "false" ? false : undefined,
    sortBy: (searchParams.get("sortBy") as SortOption) ?? "newest",
    page: Math.max(1, Number(searchParams.get("page") ?? "1")),
  }
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="w-20 h-20 flex items-center justify-center bg-[#f5f5f5]">
        <Package className="h-9 w-9 text-[#eeeeee]" aria-hidden />
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
        className="inline-flex items-center gap-1.5 h-9 px-5 border border-[#eeeeee] text-[13px] text-[#333333] hover:border-[#0040a4] hover:text-[#0040a4] transition-colors"
      >
        Filtreleri Temizle
      </button>
    </div>
  )
}

function MobileFilterDrawer({
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
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#eeeeee]">
          <p className="font-bold text-[14px] text-[#333333] uppercase tracking-wider">Filtreler</p>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#767676] hover:text-[#333333] transition-colors"
            aria-label="Filtreleri kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </>
  )
}

export default function ProductsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const filters = useFiltersFromURL()
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [brands, setBrands] = useState<BrandItem[]>([])
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([])
  const [isLoadingFilters, setIsLoadingFilters] = useState(true)

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

  const updateURL = useCallback(
    (updated: Partial<FiltersType>) => {
      const next = { ...filters, ...updated }
      const params = new URLSearchParams()

      if (next.q) params.set("q", next.q)
      if (next.brandId) params.set("brandId", next.brandId)
      if (next.categoryId) params.set("categoryId", next.categoryId)
      if (next.supplierId) params.set("supplierId", next.supplierId)
      if (next.minPrice) params.set("minPrice", next.minPrice)
      if (next.maxPrice) params.set("maxPrice", next.maxPrice)
      if (next.inStock === true) params.set("inStock", "true")
      if (next.inStock === false) params.set("inStock", "false")
      if (next.sortBy !== "newest") params.set("sortBy", next.sortBy)
      if (next.page > 1) params.set("page", String(next.page))

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [filters, pathname, router]
  )

  useEffect(() => {
    setIsLoadingProducts(true)
    const params = new URLSearchParams()

    if (filters.q) params.set("q", filters.q)
    if (filters.brandId) params.set("brandId", filters.brandId)
    if (filters.categoryId) params.set("categoryId", filters.categoryId)
    if (filters.supplierId) params.set("supplierId", filters.supplierId)
    if (filters.minPrice) params.set("minPrice", filters.minPrice)
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice)
    if (filters.inStock === true) params.set("inStock", "true")
    if (filters.inStock === false) params.set("inStock", "false")
    params.set("sortBy", filters.sortBy)
    params.set("page", String(filters.page))

    fetch(`/api/catalog/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products ?? [])
        setTotal(data.total ?? 0)
        setTotalPages(data.totalPages ?? 1)
      })
      .catch(() => {
        setProducts([])
        setTotal(0)
      })
      .finally(() => setIsLoadingProducts(false))
  }, [searchParams])

  useEffect(() => {
    setIsLoadingFilters(true)
    Promise.all([
      fetch("/api/public/categories").then((r) => r.json()),
      fetch("/api/public/brands").then((r) => r.json()),
      fetch("/api/public/suppliers").then((r) => r.json()),
    ])
      .then(([catData, brandData, supplierData]) => {
        setCategories(catData.data ?? [])
        setBrands(brandData.data ?? [])
        setSuppliers(supplierData.data ?? [])
      })
      .catch(() => {
        setCategories([])
        setBrands([])
        setSuppliers([])
      })
      .finally(() => setIsLoadingFilters(false))
  }, [])

  const activeFilterCount = [
    filters.brandId,
    filters.categoryId,
    filters.supplierId,
    filters.minPrice,
    filters.maxPrice,
    filters.inStock,
  ].filter(Boolean).length

  function clearAllFilters() {
    updateURL({
      brandId: "",
      categoryId: "",
      supplierId: "",
      minPrice: "",
      maxPrice: "",
      inStock: undefined,
      q: "",
      page: 1,
    })
  }

  const pageStart = (filters.page - 1) * 12 + 1
  const pageEnd = Math.min(filters.page * 12, total)

  const filtersPanel = (
    <ProductFilters
      categories={categories}
      brands={brands}
      suppliers={suppliers}
      filters={filters}
      onChange={(updated) => {
        updateURL(updated)
        setFilterDrawerOpen(false)
      }}
    />
  )

  return (
    <div className="bg-[#f9f9f9]">
      {/* Sayfa başlık bandı */}
      <div className="bg-white border-b border-[#eeeeee]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-1.5 text-[12px] text-[#767676] mb-2"
            aria-label="Breadcrumb"
          >
            <a
              href="/"
              className="flex items-center gap-1 hover:text-[#0040a4] transition-colors"
            >
              <Home className="h-3 w-3" />
              Anasayfa
            </a>
            <ChevronRight className="h-3 w-3 text-[#eeeeee]" aria-hidden />
            <span className="text-[#333333] font-semibold">Ürünler</span>
            {filters.q && (
              <>
                <ChevronRight className="h-3 w-3 text-[#eeeeee]" aria-hidden />
                <span className="text-[#0040a4] font-semibold">&ldquo;{filters.q}&rdquo;</span>
              </>
            )}
          </nav>

          <div className="flex items-center justify-between gap-4">
            <h1 className="text-[20px] font-bold text-[#333333] uppercase tracking-wider">
              {filters.q ? `"${filters.q}" sonuçları` : "Ürün Kataloğu"}
            </h1>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 text-[12px] text-[#767676] hover:text-[#c82333] border border-[#eeeeee] hover:border-[#c82333] px-3 py-1.5 transition-colors"
              >
                <X className="h-3 w-3" aria-hidden />
                Temizle ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ana içerik */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sol Sidebar — desktop */}
          <aside className="hidden lg:block w-[300px] shrink-0" aria-label="Filtreler">
            <div className="bg-white border border-[#eeeeee]">
              <div className="px-4 py-3 border-b border-[#eeeeee]">
                <p className="font-bold text-[12px] text-[#333333] uppercase tracking-wider">
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
          <div className="flex-1 min-w-0 space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap bg-white border border-[#eeeeee] px-4 py-2.5">
              {/* Mobil filtre butonu */}
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 h-8 px-3 border border-[#eeeeee] text-[12px] font-semibold text-[#333333] hover:border-[#0040a4] hover:text-[#0040a4] transition-colors"
                aria-label="Filtreleri aç"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
                Filtreler
                {activeFilterCount > 0 && (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#0040a4] text-white text-[10px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sonuç sayısı */}
              <span className="text-[13px] text-[#767676]">
                {isLoadingProducts ? (
                  <Skeleton className="h-4 w-40 inline-block" />
                ) : total > 0 ? (
                  <>
                    {pageStart}–{pageEnd} /{" "}
                    <span className="font-bold text-[#333333]">{total}</span> ürün
                  </>
                ) : (
                  "Ürün bulunamadı"
                )}
              </span>

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
                    className="w-44 border-[#eeeeee] text-[#333333] text-[12px] rounded-none focus:ring-0"
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

                {/* View toggle */}
                <div
                  className="flex border border-[#eeeeee] overflow-hidden"
                  role="group"
                  aria-label="Görünüm modu"
                >
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === "grid"
                        ? "bg-[#0040a4] text-white"
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
                        ? "bg-[#0040a4] text-white"
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

            {/* Ürün listesi */}
            {isLoadingProducts ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="bg-white">
                      <ProductCardSkeleton />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-[#eeeeee] bg-white divide-y divide-[#eeeeee]">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ProductListItemSkeleton key={i} />
                  ))}
                </div>
              )
            ) : products.length === 0 ? (
              <div className="bg-white border border-[#eeeeee]">
                <EmptyState onClear={clearAllFilters} />
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white"
                  >
                    <ProductCard
                      product={product}
                      brands={brands}
                      categories={categories}
                      onAddToCart={() => {
                        // useCart hook ile ekle
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-[#eeeeee] bg-white divide-y divide-[#eeeeee]">
                {products.map((product) => (
                  <ProductListItem
                    key={product.id}
                    product={product}
                    brands={brands}
                    categories={categories}
                    onAddToCart={() => {
                      // useCart hook ile ekle
                    }}
                  />
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
                  className="inline-flex items-center justify-center h-9 w-9 border border-[#eeeeee] text-[#767676] hover:border-[#0040a4] hover:text-[#0040a4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
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
                        "inline-flex items-center justify-center h-9 w-9 text-[13px] font-semibold transition-colors",
                        filters.page === pageNum
                          ? "bg-[#0040a4] text-white border border-[#0040a4]"
                          : "bg-white border border-[#eeeeee] text-[#333333] hover:border-[#0040a4] hover:text-[#0040a4]"
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
                  className="inline-flex items-center justify-center h-9 w-9 border border-[#eeeeee] text-[#767676] hover:border-[#0040a4] hover:text-[#0040a4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>

      {/* Mobil filtre drawer */}
      <MobileFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
      >
        {filtersPanel}
      </MobileFilterDrawer>
    </div>
  )
}
