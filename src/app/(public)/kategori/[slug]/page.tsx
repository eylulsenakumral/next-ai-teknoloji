"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import {
  CategoryBanner,
  FilterSidebar,
  CategoryProductGrid,
  SortDropdown,
  LoadMoreButton,
} from "./components"

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface Brand {
  id: string
  name: string
  slug: string
}

interface Product {
  id: string
  name: string
  slug: string
  images: string[]
  brand: { name: string; slug: string } | null
  stockStatus: boolean
}

interface CategoryData {
  name: string
  slug: string
  image?: string
  productCount: number
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [slug, setSlug] = useState<string>("")
  const [category, setCategory] = useState<CategoryData | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)

  // Parse URL params
  const selectedBrands = searchParams.get("brand")?.split(",").filter(Boolean) ?? []
  const priceMin = Number(searchParams.get("price_min") ?? "0")
  const priceMax = Number(searchParams.get("price_max") ?? "999999")
  const sortBy = searchParams.get("sort") ?? "popular"

  // Resolve params
  useEffect(() => {
    params.then((p) => setSlug(p.slug))
  }, [params])

  // Fetch category data
  useEffect(() => {
    if (!slug) return
    fetch(`/api/public/categories`)
      .then((r) => r.json())
      .then((data) => {
        const allCats = data.data ?? []
        const found = allCats.find(
          (c: { slug: string }) => c.slug === slug
        )
        if (found) {
          setCategory({
            name: found.name,
            slug: found.slug,
            productCount: found.productCount ?? 0,
          })
        }
      })
      .catch(() => {})
  }, [slug])

  // Fetch brands
  useEffect(() => {
    fetch("/api/public/brands")
      .then((r) => r.json())
      .then((data) => setBrands(data.data ?? []))
      .catch(() => setBrands([]))
  }, [])

  // Fetch products
  const fetchProducts = useCallback(
    (pageNum: number, append = false) => {
      if (!slug) return
      setIsLoading(true)
      const p = new URLSearchParams()
      p.set("categorySlug", slug)
      p.set("page", String(pageNum))
      p.set("limit", "20")
      if (selectedBrands.length) p.set("brandSlug", selectedBrands[0])
      p.set("sortBy", sortBy === "newest" ? "newest" : "newest")

      fetch(`/api/public/catalog/products?${p.toString()}`)
        .then((r) => r.json())
        .then((data) => {
          const items: Product[] = (data.data ?? []).map(
            (item: {
              id: string
              name: string
              slug: string
              images: string[]
              brand: { name: string; slug: string } | null
              stockStatus: boolean
            }) => ({
              id: item.id,
              name: item.name,
              slug: item.slug,
              images: item.images,
              brand: item.brand,
              stockStatus: item.stockStatus ?? true,
            })
          )
          if (append) {
            setProducts((prev) => [...prev, ...items])
          } else {
            setProducts(items)
          }
          setTotalCount(data.meta?.total ?? 0)
          setHasMore((data.meta?.page ?? 1) < (data.meta?.totalPages ?? 1))
        })
        .catch(() => {
          if (!append) setProducts([])
        })
        .finally(() => setIsLoading(false))
    },
    [slug, selectedBrands, sortBy]
  )

  useEffect(() => {
    setPage(1)
    fetchProducts(1)
  }, [fetchProducts])

  // URL update helpers
  function updateURL(updates: Record<string, string>) {
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    router.push(`${pathname}?${p.toString()}`, { scroll: false })
  }

  function handleBrandChange(brandSlug: string) {
    const current = selectedBrands.includes(brandSlug)
      ? selectedBrands.filter((b) => b !== brandSlug)
      : [...selectedBrands, brandSlug]
    updateURL({ brand: current.join(",") })
  }

  function handlePriceChange(range: [number, number]) {
    updateURL({
      price_min: String(range[0]),
      price_max: String(range[1]),
    })
  }

  function handleSortChange(value: string) {
    updateURL({ sort: value })
  }

  function handleLoadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    fetchProducts(nextPage, true)
  }

  const bannerImage =
    category?.image ??
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80"

  return (
    <div className="bg-[#f5f5f5] min-h-screen">
      {/* Category Banner */}
      <CategoryBanner
        title={category?.name ?? slug}
        image={bannerImage}
        productCount={totalCount}
      />

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar - desktop */}
          <div className="hidden lg:block">
            <FilterSidebar
              brands={brands.slice(0, 10)}
              selectedBrands={selectedBrands}
              priceRange={[priceMin, priceMax]}
              onBrandChange={handleBrandChange}
              onPriceChange={handlePriceChange}
            />
          </div>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] text-[#555555]">
                <span className="font-bold text-[#1e1e1e]">{totalCount}</span> urun
              </p>
              <SortDropdown value={sortBy} onChange={handleSortChange} />
            </div>

            {/* Grid */}
            <CategoryProductGrid
              products={products}
              totalCount={totalCount}
            />

            {/* Load More */}
            <LoadMoreButton
              onClick={handleLoadMore}
              hasMore={hasMore}
              isLoading={isLoading && page > 1}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
