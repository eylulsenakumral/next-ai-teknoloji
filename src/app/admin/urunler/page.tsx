"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import {
  Plus,
  Search,
  RefreshCw,
  Trash2,
  CheckSquare,
  XSquare,
  Copy,
  Pencil,
  LayoutGrid,
  List,
  Filter,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SupplierProductSummary {
  purchasePrice: string | null
  stockQuantity: number
  isAvailable: boolean
  currency: string
  supplier: { id: string; name: string; code: string }
}

interface Product {
  id: string
  name: string
  slug: string
  barcode: string | null
  sku: string | null
  images: string[]
  isActive: boolean
  isFeatured: boolean
  isNew: boolean
  isOutlet: boolean
  createdAt: string
  brand: { id: string; name: string; logoUrl: string | null } | null
  category: { id: string; name: string } | null
  supplierProducts: SupplierProductSummary[]
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface BrandOption {
  id: string
  name: string
}

interface CategoryOption {
  id: string
  name: string
  depth: number
}

interface SupplierOption {
  id: string
  name: string
  code: string
}

type ViewMode = "list" | "grid"
type SortBy = "name" | "createdAt" | "updatedAt" | "viewCount"
type SortOrder = "asc" | "desc"

// ---------------------------------------------------------------------------
// Yardımcı fonksiyonlar
// ---------------------------------------------------------------------------
function getLowestPrice(supplierProducts: SupplierProductSummary[]): number | null {
  const available = supplierProducts.filter((sp) => sp.isAvailable && sp.purchasePrice)
  if (available.length === 0) return null
  return Math.min(...available.map((sp) => parseFloat(sp.purchasePrice!)))
}

function getTotalStock(supplierProducts: SupplierProductSummary[]): number {
  return supplierProducts.reduce((sum, sp) => sum + sp.stockQuantity, 0)
}

function formatPrice(price: number | null): string {
  if (price === null) return "—"
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(price)
}

// ---------------------------------------------------------------------------
// Ana Sayfa
// ---------------------------------------------------------------------------
export default function UrunlerPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(true)
  const [brands, setBrands] = useState<BrandOption[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])

  // Filters
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filterBrand, setFilterBrand] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterSupplier, setFilterSupplier] = useState("")
  const [filterStatus, setFilterStatus] = useState<"" | "true" | "false">("")
  const [filterStock, setFilterStock] = useState<"" | "true" | "false">("")
  const [filterFeatured, setFilterFeatured] = useState(false)
  const [filterNew, setFilterNew] = useState(false)
  const [filterOutlet, setFilterOutlet] = useState(false)
  const [sortBy, setSortBy] = useState<SortBy>("createdAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<25 | 50 | 100>(25)

  // Publish tab
  const [publishTab, setPublishTab] = useState<"published" | "unpublished">("published")

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  // Inline update state
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null)
  const [updateFlash, setUpdateFlash] = useState<Record<string, "ok" | "err">>({})

  async function updateProductField(productId: string, data: { brandId?: string | null; categoryId?: string | null; isActive?: boolean }) {
    setUpdatingProductId(productId)
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setUpdateFlash((prev) => ({ ...prev, [productId + Object.keys(data)[0]]: "ok" }))
        setTimeout(() => {
          setUpdateFlash((prev) => {
            const next = { ...prev }
            delete next[productId + Object.keys(data)[0]]
            return next
          })
        }, 1500)
        fetchProducts()
      } else {
        setUpdateFlash((prev) => ({ ...prev, [productId + Object.keys(data)[0]]: "err" }))
        setTimeout(() => {
          setUpdateFlash((prev) => {
            const next = { ...prev }
            delete next[productId + Object.keys(data)[0]]
            return next
          })
        }, 2000)
      }
    } finally {
      setUpdatingProductId(null)
    }
  }

  // Dialogs
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkAction, setBulkAction] = useState<"delete" | "activate" | "deactivate" | "duplicate" | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkMarginOpen, setBulkMarginOpen] = useState(false)
  const [marginValue, setMarginValue] = useState("20")

  // Debounce search
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [search])

  // Filter değişince sayfa resetle
  useEffect(() => { setPage(1) }, [filterBrand, filterCategory, filterSupplier, filterStatus, filterStock, filterFeatured, filterNew, filterOutlet, sortBy, sortOrder, limit, publishTab])

  // Brands, Categories & Suppliers yükle (bir kez)
  useEffect(() => {
    async function loadFilters() {
      try {
        const [bRes, cRes, sRes] = await Promise.all([
          fetch("/api/public/brands").then((r) => r.ok ? r.json() : { data: [] }),
          fetch("/api/public/categories").then((r) => r.ok ? r.json() : { data: [] }),
          fetch("/api/public/suppliers").then((r) => r.ok ? r.json() : { data: [] }),
        ])
        setBrands(bRes.data ?? [])
        setCategories(cRes.data ?? [])
        setSuppliers(sRes.data ?? [])
      } catch {
        // sessiz fail
      }
    }
    loadFilters()
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy,
      sortOrder,
    })
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (filterBrand) params.set("brandId", filterBrand)
    if (filterCategory) params.set("categoryId", filterCategory)
    if (filterSupplier) params.set("supplierId", filterSupplier)
    // publishTab controls isActive filter; filterStatus overrides only when explicitly set
    if (filterStatus) {
      params.set("isActive", filterStatus)
    } else {
      params.set("isActive", publishTab === "published" ? "true" : "false")
    }
    if (filterStock) params.set("inStock", filterStock)
    if (filterFeatured) params.set("isFeatured", "true")
    if (filterNew) params.set("isNew", "true")
    if (filterOutlet) params.set("isOutlet", "true")

    const res = await fetch(`/api/products?${params}`)
    if (res.ok) {
      const json = await res.json()
      setProducts(json.data ?? [])
      setMeta(json.meta ?? null)
      // brands/categories/suppliers ayrı useEffect'te yükleniyor
    }
    setLoading(false)
  }, [page, limit, debouncedSearch, filterBrand, filterCategory, filterSupplier, filterStatus, filterStock, filterFeatured, filterNew, filterOutlet, sortBy, sortOrder, publishTab])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // Selection
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds(
      selectedIds.size === products.length
        ? new Set()
        : new Set(products.map((p) => p.id))
    )
  }

  const someSelected = selectedIds.size > 0
  const allSelected = products.length > 0 && selectedIds.size === products.length

  // Bulk operations
  async function executeBulkAction(action: "delete" | "activate" | "deactivate" | "duplicate") {
    setBulkLoading(true)
    await fetch("/api/products/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds), action }),
    })
    setBulkLoading(false)
    setSelectedIds(new Set())
    setBulkDeleteOpen(false)
    setBulkAction(null)
    fetchProducts()
  }

  async function executeBulkMargin() {
    const pct = parseFloat(marginValue)
    if (isNaN(pct) || pct < 0) return
    setBulkLoading(true)
    await fetch("/api/products/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds), action: "update_margin", value: pct }),
    })
    setBulkLoading(false)
    setSelectedIds(new Set())
    setBulkMarginOpen(false)
    fetchProducts()
  }

  function handleBulkActionClick(action: "delete" | "activate" | "deactivate" | "duplicate") {
    setBulkAction(action)
    setBulkDeleteOpen(true)
  }

  const activeFilterCount = [
    filterBrand, filterCategory, filterSupplier, filterStatus, filterStock,
    filterFeatured ? "1" : "", filterNew ? "1" : "", filterOutlet ? "1" : "",
  ].filter(Boolean).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Ürünler</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {meta ? `${meta.total.toLocaleString("tr-TR")} ürün` : "Ürün yönetimi"}
          </p>
        </div>
        <Link
          href="/admin/urunler/yeni"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary px-2.5 py-0 h-8 text-sm font-medium text-primary-foreground transition-all"
        >
          <Plus className="h-4 w-4" />
          Yeni Ürün Ekle
        </Link>
      </div>

      {/* Yayın Durumu Tab'ları */}
      <div className="flex rounded-lg border border-input overflow-hidden text-sm w-fit">
        <button
          type="button"
          onClick={() => setPublishTab("published")}
          className={cn(
            "px-4 py-2 font-medium transition-colors whitespace-nowrap",
            publishTab === "published"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted text-muted-foreground"
          )}
        >
          Yayınlanan Ürünler
        </button>
        <button
          type="button"
          onClick={() => setPublishTab("unpublished")}
          className={cn(
            "px-4 py-2 font-medium transition-colors whitespace-nowrap",
            publishTab === "unpublished"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted text-muted-foreground"
          )}
        >
          Yayınlanmayan Ürünler
        </button>
      </div>

      <Card>
        <CardHeader className="pb-3 space-y-3">
          {/* Üst kontrol çubuğu */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            {/* Arama */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Ürün adı, barkod, SKU ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtre toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(activeFilterCount > 0 && "border-primary text-primary")}
              >
                <Filter className="h-3.5 w-3.5" />
                Filtreler
                {activeFilterCount > 0 && (
                  <Badge className="ml-1 h-4 min-w-4 text-xs">{activeFilterCount}</Badge>
                )}
                <ChevronDown className={cn("h-3.5 w-3.5 ml-1 transition-transform", showFilters && "rotate-180")} />
              </Button>

              {/* Sıralama */}
              <select
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [by, ord] = e.target.value.split(":") as [SortBy, SortOrder]
                  setSortBy(by)
                  setSortOrder(ord)
                }}
                className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring"
              >
                <option value="createdAt:desc">En Yeni</option>
                <option value="createdAt:asc">En Eski</option>
                <option value="name:asc">İsim A-Z</option>
                <option value="name:desc">İsim Z-A</option>
                <option value="viewCount:desc">En Çok Görüntülenen</option>
              </select>

              {/* Per page */}
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value) as 25 | 50 | 100)}
                className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>

              {/* View toggle */}
              <div className="flex rounded-lg border border-input overflow-hidden">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-1.5 transition-colors",
                    viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                  )}
                  aria-label="Liste görünümü"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-1.5 transition-colors",
                    viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                  )}
                  aria-label="Grid görünümü"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              </div>

              <Button variant="ghost" size="icon" onClick={fetchProducts} aria-label="Yenile">
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>

          {/* Gelişmiş filtreler */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 pt-1">
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring min-w-36"
              >
                <option value="">Tüm Markalar</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring min-w-44"
              >
                <option value="">Tüm Kategoriler</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.depth > 0 ? `${"  ".repeat(c.depth)}↳ ` : ""}{c.name}
                  </option>
                ))}
              </select>

              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring min-w-40"
              >
                <option value="">Tüm Tedarikçiler</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <div className="flex rounded-lg border border-input overflow-hidden text-sm">
                {[["", "Tüm Durum"], ["true", "Aktif"], ["false", "Pasif"]].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFilterStatus(val as "" | "true" | "false")}
                    className={cn(
                      "px-3 py-1.5 font-medium transition-colors whitespace-nowrap",
                      filterStatus === val
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex rounded-lg border border-input overflow-hidden text-sm">
                {[["", "Tüm Stok"], ["true", "Stokta"], ["false", "Tükendi"]].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFilterStock(val as "" | "true" | "false")}
                    className={cn(
                      "px-3 py-1.5 font-medium transition-colors whitespace-nowrap",
                      filterStock === val
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 items-center flex-wrap">
                {[
                  { key: "filterFeatured", label: "Öne Çıkan", val: filterFeatured, set: setFilterFeatured },
                  { key: "filterNew", label: "Yeni", val: filterNew, set: setFilterNew },
                  { key: "filterOutlet", label: "Outlet", val: filterOutlet, set: setFilterOutlet },
                ].map(({ key, label, val, set }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set(!val)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
                      val
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-input text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                ))}

                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-destructive underline"
                    onClick={() => {
                      setFilterBrand("")
                      setFilterCategory("")
                      setFilterSupplier("")
                      setFilterStatus("")
                      setFilterStock("")
                      setFilterFeatured(false)
                      setFilterNew(false)
                      setFilterOutlet(false)
                    }}
                  >
                    Filtreleri Temizle
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Toplu işlem toolbar */}
          {someSelected && (
            <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border">
              <span className="text-sm text-muted-foreground font-medium">
                {selectedIds.size} ürün seçildi
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkActionClick("activate")}
                disabled={bulkLoading}
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Aktif Et
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkActionClick("deactivate")}
                disabled={bulkLoading}
              >
                <XSquare className="h-3.5 w-3.5" />
                Pasif Et
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkActionClick("duplicate")}
                disabled={bulkLoading}
              >
                <Copy className="h-3.5 w-3.5" />
                Kopyala
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkMarginOpen(true)}
                disabled={bulkLoading}
              >
                Marj Güncelle
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkActionClick("delete")}
                disabled={bulkLoading}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Sil
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {/* Liste Görünümü */}
          {viewMode === "list" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 px-4">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Tümünü seç"
                    />
                  </TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead className="hidden md:table-cell">Marka / Kategori</TableHead>
                  <TableHead className="hidden lg:table-cell">Entegrasyon</TableHead>
                  <TableHead className="hidden sm:table-cell">Barkod</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Alış Fiyatı</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Stok</TableHead>
                  <TableHead className="text-center">Durum</TableHead>
                  <TableHead className="text-right pr-4">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                      Ürün bulunamadı.
                    </TableCell>
                  </TableRow>
                )}
                {!loading && products.map((product) => {
                  const lowestPrice = getLowestPrice(product.supplierProducts)
                  const totalStock = getTotalStock(product.supplierProducts)

                  return (
                    <TableRow
                      key={product.id}
                      data-state={selectedIds.has(product.id) ? "selected" : undefined}
                    >
                      <TableCell className="px-4">
                        <Checkbox
                          checked={selectedIds.has(product.id)}
                          onCheckedChange={() => toggleSelect(product.id)}
                          aria-label={`${product.name} seç`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {/* Thumbnail */}
                          <div className="shrink-0 w-10 h-10 rounded border border-border bg-muted flex items-center justify-center overflow-hidden">
                            {product.images[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-10 h-10 object-contain"
                                onError={(e) => { e.currentTarget.style.display = "none" }}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {product.name[0]?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-56">{product.name}</p>
                            <div className="flex gap-1 mt-0.5 flex-wrap">
                              {product.isFeatured && (
                                <Badge variant="secondary" className="text-xs h-4 px-1">Öne Çıkan</Badge>
                              )}
                              {product.isNew && (
                                <Badge variant="secondary" className="text-xs h-4 px-1">Yeni</Badge>
                              )}
                              {product.isOutlet && (
                                <Badge variant="outline" className="text-xs h-4 px-1">Outlet</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col gap-0.5">
                          <select
                            value={product.brand?.id ?? ""}
                            disabled={updatingProductId === product.id}
                            onChange={(e) => {
                              const val = e.target.value
                              updateProductField(product.id, { brandId: val || null })
                            }}
                            className={cn(
                              "text-xs py-0.5 px-1 rounded border bg-transparent outline-none cursor-pointer",
                              "border-transparent hover:border-input focus:border-ring transition-colors",
                              updateFlash[product.id + "brandId"] === "ok" && "border-green-500 text-green-700",
                              updateFlash[product.id + "brandId"] === "err" && "border-destructive text-destructive",
                            )}
                          >
                            <option value="">— Marka Seç —</option>
                            {brands.map((b) => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                          <select
                            value={product.category?.id ?? ""}
                            disabled={updatingProductId === product.id}
                            onChange={(e) => {
                              const val = e.target.value
                              updateProductField(product.id, { categoryId: val || null })
                            }}
                            className={cn(
                              "text-xs py-0.5 px-1 rounded border bg-transparent outline-none cursor-pointer",
                              "border-transparent hover:border-input focus:border-ring transition-colors text-muted-foreground",
                              updateFlash[product.id + "categoryId"] === "ok" && "border-green-500 text-green-700",
                              updateFlash[product.id + "categoryId"] === "err" && "border-destructive text-destructive",
                            )}
                          >
                            <option value="">— Kategori Seç —</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.depth > 0 ? `${"  ".repeat(c.depth)}↳ ` : ""}{c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {product.supplierProducts.length > 0 ? (
                            [...new Map(product.supplierProducts.map((sp) => [sp.supplier.code, sp.supplier])).values()].map((s) => (
                              <Badge key={s.code} variant="outline" className="text-[10px] h-5 px-1.5">
                                {s.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs">Manuel</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {product.barcode ? (
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {product.barcode}
                          </code>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right font-mono text-sm">
                        {formatPrice(lowestPrice)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right text-sm">
                        <span className={cn(totalStock === 0 && "text-destructive")}>
                          {totalStock.toLocaleString("tr-TR")}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <select
                          value={product.isActive ? "published" : "unpublished"}
                          disabled={updatingProductId === product.id}
                          onChange={(e) =>
                            updateProductField(product.id, { isActive: e.target.value === "published" })
                          }
                          className={cn(
                            "text-xs py-0.5 px-1.5 rounded border outline-none cursor-pointer font-medium transition-colors",
                            product.isActive
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-orange-200 bg-orange-50 text-orange-700",
                            updateFlash[product.id + "isActive"] === "ok" && "border-green-500",
                            updateFlash[product.id + "isActive"] === "err" && "border-destructive text-destructive",
                          )}
                        >
                          <option value="published">Yayında</option>
                          <option value="unpublished">Yayında Değil</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/urunler/${product.id}`}
                            aria-label="Düzenle"
                            className="inline-flex items-center justify-center size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {/* Grid Görünümü */}
          {viewMode === "grid" && (
            <div className="p-4">
              {loading && (
                <div className="text-center py-16 text-muted-foreground">Yükleniyor...</div>
              )}
              {!loading && products.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">Ürün bulunamadı.</div>
              )}
              {!loading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {products.map((product) => {
                    const lowestPrice = getLowestPrice(product.supplierProducts)
                    const totalStock = getTotalStock(product.supplierProducts)
                    const isSelected = selectedIds.has(product.id)

                    return (
                      <div
                        key={product.id}
                        className={cn(
                          "rounded-lg border border-border bg-card overflow-hidden group relative",
                          isSelected && "ring-2 ring-primary"
                        )}
                      >
                        {/* Seçim checkbox */}
                        <div className="absolute top-2 left-2 z-10">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(product.id)}
                            aria-label={`${product.name} seç`}
                          />
                        </div>

                        {/* Görsel */}
                        <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                          {product.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-contain p-2"
                              onError={(e) => { e.currentTarget.style.display = "none" }}
                            />
                          ) : (
                            <span className="text-3xl font-bold text-muted-foreground/30">
                              {product.name[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* İçerik */}
                        <div className="p-2.5 space-y-1.5">
                          <p className="text-xs font-medium leading-tight line-clamp-2">{product.name}</p>
                          <select
                            value={product.brand?.id ?? ""}
                            disabled={updatingProductId === product.id}
                            onChange={(e) => {
                              const val = e.target.value
                              updateProductField(product.id, { brandId: val || null })
                            }}
                            className={cn(
                              "w-full text-xs py-0 px-1 rounded border bg-transparent outline-none cursor-pointer",
                              "border-transparent hover:border-input focus:border-ring transition-colors text-muted-foreground",
                              updateFlash[product.id + "brandId"] === "ok" && "border-green-500 text-green-700",
                              updateFlash[product.id + "brandId"] === "err" && "border-destructive text-destructive",
                            )}
                          >
                            <option value="">— Marka —</option>
                            {brands.map((b) => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                          <select
                            value={product.category?.id ?? ""}
                            disabled={updatingProductId === product.id}
                            onChange={(e) => {
                              const val = e.target.value
                              updateProductField(product.id, { categoryId: val || null })
                            }}
                            className={cn(
                              "w-full text-xs py-0 px-1 rounded border bg-transparent outline-none cursor-pointer",
                              "border-transparent hover:border-input focus:border-ring transition-colors text-muted-foreground",
                              updateFlash[product.id + "categoryId"] === "ok" && "border-green-500 text-green-700",
                              updateFlash[product.id + "categoryId"] === "err" && "border-destructive text-destructive",
                            )}
                          >
                            <option value="">— Kategori —</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-mono">{formatPrice(lowestPrice)}</span>
                            <span className={cn("text-xs", totalStock === 0 && "text-destructive")}>
                              {totalStock} adet
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <select
                              value={product.isActive ? "published" : "unpublished"}
                              disabled={updatingProductId === product.id}
                              onChange={(e) =>
                                updateProductField(product.id, { isActive: e.target.value === "published" })
                              }
                              className={cn(
                                "text-xs py-0 px-1 rounded border outline-none cursor-pointer font-medium transition-colors",
                                product.isActive
                                  ? "border-green-200 bg-green-50 text-green-700"
                                  : "border-orange-200 bg-orange-50 text-orange-700",
                                updateFlash[product.id + "isActive"] === "ok" && "border-green-500",
                                updateFlash[product.id + "isActive"] === "err" && "border-destructive text-destructive",
                              )}
                            >
                              <option value="published">Yayında</option>
                              <option value="unpublished">Yayında Değil</option>
                            </select>
                            <Link
                              href={`/admin/urunler/${product.id}`}
                              className="inline-flex items-center justify-center size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Pencil className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                {((meta.page - 1) * meta.limit + 1).toLocaleString("tr-TR")}–
                {Math.min(meta.page * meta.limit, meta.total).toLocaleString("tr-TR")} / {meta.total.toLocaleString("tr-TR")}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Önceki
                </Button>
                {/* Sayfa numaraları */}
                {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                  const startPage = Math.max(1, Math.min(meta.page - 2, meta.totalPages - 4))
                  const p = startPage + i
                  return (
                    <Button
                      key={p}
                      variant={p === meta.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(p)}
                      className="w-8 px-0"
                    >
                      {p}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toplu işlem onay dialog */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={
          bulkAction === "delete"
            ? `${selectedIds.size} ürün silinsin mi?`
            : bulkAction === "activate"
            ? `${selectedIds.size} ürün aktif edilsin mi?`
            : bulkAction === "deactivate"
            ? `${selectedIds.size} ürün pasife alınsın mı?`
            : `${selectedIds.size} ürün kopyalansın mı?`
        }
        description={
          bulkAction === "delete"
            ? "Seçilen ürünler silinecek. Bu işlem geri alınamaz."
            : bulkAction === "activate"
            ? "Seçilen ürünler aktif edilecek."
            : bulkAction === "deactivate"
            ? "Seçilen ürünler pasife alınacak."
            : "Seçilen ürünlerin kopyası oluşturulacak (pasif başlar)."
        }
        confirmLabel={
          bulkAction === "delete"
            ? "Sil"
            : bulkAction === "activate"
            ? "Aktif Et"
            : bulkAction === "deactivate"
            ? "Pasif Et"
            : "Kopyala"
        }
        variant={bulkAction === "delete" ? "destructive" : "default"}
        onConfirm={() => bulkAction && executeBulkAction(bulkAction)}
        loading={bulkLoading}
      />

      {/* Marj güncelleme dialog */}
      {bulkMarginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="font-semibold">{selectedIds.size} ürün için marj güncelle</h2>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Marj Yüzdesi</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={10000}
                  step={0.5}
                  value={marginValue}
                  onChange={(e) => setMarginValue(e.target.value)}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBulkMarginOpen(false)}>İptal</Button>
              <Button onClick={executeBulkMargin} disabled={bulkLoading}>
                {bulkLoading ? "Güncelleniyor..." : "Uygula"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
