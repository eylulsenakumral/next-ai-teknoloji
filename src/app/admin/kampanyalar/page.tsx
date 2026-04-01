"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Search,
  RefreshCw,
  Trash2,
  Plus,
  X,
  Info,
  Megaphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type CampaignType = "outlet" | "featured"

interface CampaignProduct {
  id: string
  name: string
  slug: string
  isActive: boolean
  isFeatured: boolean
  isOutlet: boolean
  images: string[]
  brand: { id: string; name: string } | null
  category: { id: string; name: string } | null
  supplierProducts: Array<{
    purchasePrice: string | null
    stockQuantity: number
  }>
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface SearchProduct {
  id: string
  name: string
  barcode: string | null
  sku: string | null
  brand: { name: string } | null
  category: { name: string } | null
  supplierProducts: Array<{ purchasePrice: string | null; stockQuantity: number }>
}

// ---------------------------------------------------------------------------
// Yardımcı
// ---------------------------------------------------------------------------
function formatPrice(price: string | null | undefined): string {
  if (!price) return "—"
  const num = parseFloat(price)
  if (isNaN(num)) return "—"
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(num)
}

function CampaignBadge({ type }: { type: "outlet" | "featured" | "both" }) {
  if (type === "both") {
    return (
      <div className="flex gap-1">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          Outlet
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
          Fırsat
        </span>
      </div>
    )
  }
  if (type === "outlet") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
        Outlet
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
      Fırsat
    </span>
  )
}

function getCampaignType(p: CampaignProduct): "outlet" | "featured" | "both" {
  if (p.isOutlet && p.isFeatured) return "both"
  if (p.isOutlet) return "outlet"
  return "featured"
}

// ---------------------------------------------------------------------------
// Ana Sayfa
// ---------------------------------------------------------------------------
export default function KampanyalarPage() {
  // Kampanyalı ürünler listesi
  const [products, setProducts] = useState<CampaignProduct[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  // Seçim (toplu işlem)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  // Kampanyaya Ekle — ürün arama
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<SearchProduct | null>(null)
  const [addType, setAddType] = useState<CampaignType>("outlet")
  const [addLoading, setAddLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ---------------------------------------------------------------------------
  // Kampanyalı ürünleri yükle
  // ---------------------------------------------------------------------------
  const fetchCampaignProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/campaigns?page=${page}&limit=50`)
      if (res.ok) {
        const json = await res.json()
        setProducts(json.data ?? [])
        setMeta(json.meta ?? null)
      }
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchCampaignProducts()
  }, [fetchCampaignProducts])

  // ---------------------------------------------------------------------------
  // Ürün arama (autocomplete)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    if (searchQuery.length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}&limit=8`)
        if (res.ok) {
          const json = await res.json()
          setSearchResults(json.data ?? [])
          setShowDropdown(true)
        }
      } finally {
        setSearchLoading(false)
      }
    }, 350)
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [searchQuery])

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function selectProduct(p: SearchProduct) {
    setSelectedProduct(p)
    setSearchQuery(p.name)
    setShowDropdown(false)
    setSearchResults([])
  }

  function clearSelection() {
    setSelectedProduct(null)
    setSearchQuery("")
    setSearchResults([])
    setShowDropdown(false)
  }

  // ---------------------------------------------------------------------------
  // Kampanyaya ekle
  // ---------------------------------------------------------------------------
  async function handleAdd() {
    if (!selectedProduct) return
    setAddLoading(true)
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProduct.id, type: addType }),
      })
      if (res.ok) {
        clearSelection()
        fetchCampaignProducts()
      }
    } finally {
      setAddLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Kampanyadan çıkar (tek)
  // ---------------------------------------------------------------------------
  async function handleRemove(productId: string) {
    try {
      await fetch("/api/admin/campaigns", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, type: "all" }),
      })
      fetchCampaignProducts()
    } catch (err) {
      console.error("Kampanyadan çıkarma hatası:", err)
    }
  }

  // ---------------------------------------------------------------------------
  // Seçim işlemleri
  // ---------------------------------------------------------------------------
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

  const allSelected = products.length > 0 && selectedIds.size === products.length
  const someSelected = selectedIds.size > 0

  // ---------------------------------------------------------------------------
  // Toplu kampanyadan çıkar
  // ---------------------------------------------------------------------------
  async function handleBulkRemove() {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      await Promise.all(
        Array.from(selectedIds).map((productId) =>
          fetch("/api/admin/campaigns", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, type: "all" }),
          })
        )
      )
      setSelectedIds(new Set())
      fetchCampaignProducts()
    } finally {
      setBulkLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-[#00179e]" aria-hidden />
            Kampanyalı Setler
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {meta
              ? `${meta.total.toLocaleString("tr-TR")} kampanyalı ürün`
              : "Outlet ve Fırsat ürünlerini yönetin"}
          </p>
        </div>
      </div>

      {/* Bilgi notu */}
      <div className="flex gap-2.5 items-start rounded-lg border border-[#e0e7ff] bg-[#f0f4ff] px-4 py-3 text-sm text-[#3730a3]">
        <Info className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
        <p>
          Şu an ürün bazlı kampanya yönetimi aktif. Mevcut{" "}
          <code className="bg-white/60 px-1 py-0.5 rounded text-xs font-mono">isOutlet</code> ve{" "}
          <code className="bg-white/60 px-1 py-0.5 rounded text-xs font-mono">isFeatured</code>{" "}
          alanları kullanılıyor. İleride birden fazla ürünü bir araya getiren{" "}
          <strong>CampaignSet</strong> modeli eklenebilir.
        </p>
      </div>

      {/* Bölüm 2: Kampanyaya Ürün Ekle */}
      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#00179e]" aria-hidden />
            Kampanyaya Ürün Ekle
          </h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            {/* Ürün arama */}
            <div className="relative flex-1 min-w-0" ref={dropdownRef}>
              <label className="text-xs font-medium text-[#333] block mb-1">
                Ürün Ara
              </label>
              <div className="relative">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none"
                  aria-hidden
                />
                <input
                  type="text"
                  placeholder="Ürün adı, barkod veya SKU..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (selectedProduct) setSelectedProduct(null)
                  }}
                  className="w-full pl-8 pr-8 py-2 text-sm text-[#333] bg-white border border-[#ccc] rounded-lg outline-none focus:border-[#00179e] focus:ring-1 focus:ring-[#00179e]/20 transition-colors"
                  aria-label="Ürün ara"
                  aria-autocomplete="list"
                  aria-expanded={showDropdown}
                />
                {(selectedProduct || searchQuery) && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Temizle"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Autocomplete dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div
                  className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-[#ccc] rounded-lg shadow-lg max-h-64 overflow-y-auto"
                  role="listbox"
                >
                  {searchLoading && (
                    <div className="px-3 py-2 text-xs text-gray-400">Aranıyor...</div>
                  )}
                  {searchResults.map((p) => {
                    const price = p.supplierProducts[0]?.purchasePrice ?? null
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="option"
                        aria-selected={selectedProduct?.id === p.id}
                        onClick={() => selectProduct(p)}
                        className="w-full text-left flex items-start gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors border-b border-[#eee] last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#333] truncate">{p.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {p.brand?.name && `${p.brand.name} · `}
                            {p.category?.name && `${p.category.name} · `}
                            {p.barcode ?? p.sku ?? ""}
                          </p>
                        </div>
                        <span className="text-xs font-mono text-gray-600 shrink-0 mt-0.5">
                          {formatPrice(price)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
              {showDropdown && !searchLoading && searchResults.length === 0 && searchQuery.length >= 2 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-[#ccc] rounded-lg shadow-lg px-3 py-3 text-sm text-gray-500">
                  Ürün bulunamadı.
                </div>
              )}
            </div>

            {/* Kampanya tipi */}
            <div>
              <label className="text-xs font-medium text-[#333] block mb-1">
                Kampanya Tipi
              </label>
              <div className="flex rounded-lg border border-[#ccc] overflow-hidden text-sm h-[38px]">
                {(["outlet", "featured"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAddType(t)}
                    className={cn(
                      "px-3 font-medium transition-colors whitespace-nowrap",
                      addType === t
                        ? t === "outlet"
                          ? "bg-red-600 text-white"
                          : "bg-orange-500 text-white"
                        : "text-[#555] hover:bg-gray-50"
                    )}
                  >
                    {t === "outlet" ? "Outlet" : "Fırsat"}
                  </button>
                ))}
              </div>
            </div>

            {/* Ekle butonu */}
            <Button
              onClick={handleAdd}
              disabled={!selectedProduct || addLoading}
              className="h-[38px] bg-[#00179e] hover:bg-[#001380] text-white shrink-0"
            >
              <Plus className="h-4 w-4" />
              {addLoading ? "Ekleniyor..." : "Kampanyaya Ekle"}
            </Button>
          </div>

          {/* Seçilen ürün önizleme */}
          {selectedProduct && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#00179e]/20 bg-[#f0f4ff] px-3 py-2">
              <span className="text-xs text-[#333] font-medium truncate flex-1">
                Seçildi: {selectedProduct.name}
              </span>
              {selectedProduct.brand && (
                <span className="text-xs text-gray-500 shrink-0">{selectedProduct.brand.name}</span>
              )}
              {addType === "outlet" ? (
                <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded shrink-0">
                  Outlet olarak eklenecek
                </span>
              ) : (
                <span className="text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded shrink-0">
                  Fırsat olarak eklenecek
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bölüm 1: Aktif Kampanyalı Ürünler */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-base font-semibold">Aktif Kampanyalı Ürünler</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchCampaignProducts}
              aria-label="Yenile"
              className="text-gray-500"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>

          {/* Toplu işlem toolbar */}
          {someSelected && (
            <div className="flex items-center gap-3 pt-2 border-t border-[#eee] flex-wrap">
              <span className="text-sm text-[#555] font-medium">
                {selectedIds.size} ürün seçildi
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkRemove}
                disabled={bulkLoading}
                className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {bulkLoading ? "İşleniyor..." : "Seçilenleri Kampanyadan Çıkar"}
              </Button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-gray-400 hover:text-gray-600 underline ml-auto"
              >
                Seçimi temizle
              </button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#eee]">
                <TableHead className="w-10 px-4">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Tümünü seç"
                  />
                </TableHead>
                <TableHead className="text-[#555] font-semibold text-xs">Ürün Adı</TableHead>
                <TableHead className="hidden md:table-cell text-[#555] font-semibold text-xs">
                  Marka / Kategori
                </TableHead>
                <TableHead className="hidden lg:table-cell text-[#555] font-semibold text-xs text-right">
                  Alış Fiyatı
                </TableHead>
                <TableHead className="text-[#555] font-semibold text-xs">Kampanya Tipi</TableHead>
                <TableHead className="text-[#555] font-semibold text-xs text-center">Durum</TableHead>
                <TableHead className="text-right pr-4 text-[#555] font-semibold text-xs">
                  İşlemler
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-gray-400">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              )}
              {!loading && products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-gray-400">
                    Henüz kampanyalı ürün yok.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                products.map((product) => {
                  const price = product.supplierProducts[0]?.purchasePrice ?? null
                  const campaignType = getCampaignType(product)

                  return (
                    <TableRow
                      key={product.id}
                      className={cn(
                        "border-b border-[#eee] hover:bg-gray-50 transition-colors",
                        selectedIds.has(product.id) && "bg-[#f0f4ff]"
                      )}
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
                          <div className="shrink-0 w-9 h-9 rounded border border-[#eee] bg-gray-50 flex items-center justify-center overflow-hidden">
                            {product.images[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-9 h-9 object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                }}
                              />
                            ) : (
                              <span className="text-xs font-bold text-gray-300">
                                {product.name[0]?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-sm text-[#333] truncate max-w-48">
                            {product.name}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">
                          {product.brand && (
                            <p className="font-medium text-[#333]">{product.brand.name}</p>
                          )}
                          {product.category && (
                            <p className="text-xs text-gray-500">{product.category.name}</p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="hidden lg:table-cell text-right font-mono text-sm text-[#333]">
                        {formatPrice(price)}
                      </TableCell>

                      <TableCell>
                        <CampaignBadge type={campaignType} />
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant={product.isActive ? "default" : "outline"}
                          className={cn(
                            "text-xs",
                            product.isActive
                              ? "bg-[#00179e] text-white hover:bg-[#001380]"
                              : ""
                          )}
                        >
                          {product.isActive ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right pr-4">
                        <button
                          type="button"
                          onClick={() => handleRemove(product.id)}
                          title="Kampanyadan Çıkar"
                          aria-label={`${product.name} kampanyadan çıkar`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          Çıkar
                        </button>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#eee]">
              <p className="text-sm text-gray-500">
                {((meta.page - 1) * meta.limit + 1).toLocaleString("tr-TR")}–
                {Math.min(meta.page * meta.limit, meta.total).toLocaleString("tr-TR")} /{" "}
                {meta.total.toLocaleString("tr-TR")}
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
    </div>
  )
}
