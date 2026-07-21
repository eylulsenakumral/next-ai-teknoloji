"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Search,
  Link2,
  Unlink,
  Tag,
  Package,
  ChevronLeft,
  ChevronRight,
  Filter,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ============================================================================
// Types
// ============================================================================
interface CategoryOption {
  id: string
  name: string
  slug: string
  depth?: number
  parentId?: string | null
}

interface LinkedProduct {
  id: string
  name: string
  slug: string
  categoryId: string | null
  category: { id: string; name: string; slug: string } | null
  images: string[]
}

interface SupplierProduct {
  id: string
  externalId: string
  externalName: string
  externalBarcode: string | null
  externalSku: string | null
  externalUrl: string | null
  purchasePrice: number | null
  currency: string
  vatRate: number | null
  stockQuantity: number
  isAvailable: boolean
  rawData: Record<string, unknown> | null
  lastScrapedAt: string | null
  productId: string | null
  product: LinkedProduct | null
}

interface SupplierInfo {
  id: string
  name: string
  code: string
}

interface Summary {
  total: number
  linked: number
  mapped: number
  categoryDistribution: Array<{ categoryId: string | null; count: number }>
}

// ============================================================================
// Helpers
// ============================================================================
function formatPrice(price: number | null, currency: string = "USD"): string {
  if (price === null) return "—"
  const locale = currency === "TRY" ? "tr-TR" : "en-US"
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(price)
}

function getMappedCategory(rawData: Record<string, unknown> | null): string | null {
  if (!rawData) return null
  return (rawData._mappedCategoryId as string) || null
}

function getSupplierCategory(rawData: Record<string, unknown> | null): string {
  if (!rawData) return ""
  return (rawData._supplierCategory as string) || ""
}

// ============================================================================
// Page
// ============================================================================
export default function TedarikciUrunlerPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supplierId = params.id

  const [supplier, setSupplier] = useState<SupplierInfo | null>(null)
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterLinked, setFilterLinked] = useState<"" | "true" | "false">("")
  const [page, setPage] = useState(1)
  const limit = 25

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(timer)
  }, [q])

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [debouncedQ, filterCategory, filterLinked])

  // Fetch categories once
  useEffect(() => {
    fetch("/api/public/categories")
      .then((r) => r.json())
      .then((data) => {
        const flat = flattenCategories(data.data ?? [])
        setCategories(flat)
      })
      .catch(() => setCategories([]))
  }, [])

  // Fetch supplier products
  useEffect(() => {
    setLoading(true)
    setError(null)

    const sp = new URLSearchParams()
    sp.set("page", String(page))
    sp.set("limit", String(limit))
    if (debouncedQ) sp.set("q", debouncedQ)
    if (filterCategory) sp.set("categoryId", filterCategory)
    if (filterLinked === "true") sp.set("hasMatch", "true")
    if (filterLinked === "false") sp.set("hasMatch", "false")

    fetch(`/api/suppliers/${supplierId}/products?${sp.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        setSupplier(data.supplier)
        setProducts(data.products ?? [])
        setTotal(data.total ?? 0)
        setTotalPages(data.totalPages ?? 1)
        setSummary(data.summary ?? null)
      })
      .catch((err) => {
        setError(err.message)
        setProducts([])
      })
      .finally(() => setLoading(false))
  }, [supplierId, page, debouncedQ, filterCategory, filterLinked])

  // Category name lookup
  const getCategoryName = useCallback(
    (catId: string) => {
      return categories.find((c) => c.id === catId)?.name ?? catId.slice(0, 8)
    },
    [categories]
  )

  const linkedCount = summary?.linked ?? 0
  const mappedCount = summary?.mapped ?? 0
  const totalCount = summary?.total ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/entegrasyonlar")}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri
        </Button>
        <div>
          <h1 className="text-xl font-bold text-[#333]">
            {supplier ? supplier.name : "Tedarikçi"} — Tedarikçi Ürünleri
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            Sync edilen ham tedarikçi ürünleri ve kategori eşleşmeleri
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard
            label="Toplam Ürün"
            value={totalCount}
            icon={<Package className="h-4 w-4" />}
          />
          <SummaryCard
            label="Kategori Eşleşti"
            value={mappedCount}
            icon={<Tag className="h-4 w-4" />}
            accent={mappedCount === totalCount}
          />
          <SummaryCard
            label="Ürün Bağlı"
            value={linkedCount}
            icon={<Link2 className="h-4 w-4" />}
            accent={linkedCount === totalCount}
          />
          <SummaryCard
            label="Bağlı Değil"
            value={totalCount - linkedCount}
            icon={<Unlink className="h-4 w-4" />}
            warning={totalCount - linkedCount > 0}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-[var(--color-border)] rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#333] uppercase tracking-widest">
          <Filter className="h-3.5 w-3.5" />
          Filtreler
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <Input
              placeholder="İsim, barkod, SKU ara..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8 h-8 text-sm border-[var(--color-border)]"
            />
          </div>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-8 rounded-md border border-[var(--color-border)] bg-white px-2.5 text-sm text-[#333] outline-none focus:border-[var(--color-nx-dark)]"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {"  ".repeat(cat.depth ?? 0)}
                {cat.name}
              </option>
            ))}
          </select>

          {/* Linked filter */}
          <select
            value={filterLinked}
            onChange={(e) => setFilterLinked(e.target.value as "" | "true" | "false")}
            className="h-8 rounded-md border border-[var(--color-border)] bg-white px-2.5 text-sm text-[#333] outline-none focus:border-[var(--color-nx-dark)]"
          >
            <option value="">Tüm Durum</option>
            <option value="true">Ürün Bağlı</option>
            <option value="false">Bağlı Değil</option>
          </select>

          {/* Clear */}
          {(q || filterCategory || filterLinked) && (
            <button
              type="button"
              onClick={() => {
                setQ("")
                setFilterCategory("")
                setFilterLinked("")
              }}
              className="text-xs text-[var(--color-text-muted)] hover:text-[#c82333] transition-colors"
            >
              Temizle
            </button>
          )}
        </div>
      </div>

      {/* Category Distribution */}
      {summary && summary.categoryDistribution.length > 0 && !filterCategory && (
        <div className="bg-white border border-[var(--color-border)] rounded-lg p-4">
          <div className="text-xs font-bold text-[#333] uppercase tracking-widest mb-3">
            Kategori Dağılımı
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.categoryDistribution.slice(0, 20).map((cat) => (
              <button
                key={cat.categoryId ?? "none"}
                type="button"
                onClick={() =>
                  setFilterCategory(cat.categoryId ?? "")
                }
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-colors",
                  filterCategory === (cat.categoryId ?? "")
                    ? "bg-[var(--color-nx-dark)] text-white border-[var(--color-nx-dark)]"
                    : "bg-white text-[#333] border-[var(--color-border)] hover:border-[var(--color-nx-dark)] hover:text-[var(--color-nx-dark)]"
                )}
              >
                <span className="truncate max-w-32">
                  {cat.categoryId ? getCategoryName(cat.categoryId) : "Eşleşmemiş"}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold tabular-nums",
                    filterCategory === (cat.categoryId ?? "")
                      ? "text-white/70"
                      : "text-[var(--color-text-muted)]"
                  )}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-[var(--color-border)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[#fafafa]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Ürün
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Tedarikçi Kategorisi
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Eşleşen Kategori
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Fiyat
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Stok
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Durum
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3">
                      <div className="h-4 bg-[#f0f0f0] rounded w-48" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-[#f0f0f0] rounded w-32" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-[#f0f0f0] rounded w-28" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-[#f0f0f0] rounded w-20" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-[#f0f0f0] rounded w-12" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-[#f0f0f0] rounded w-16 mx-auto" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[var(--color-text-muted)]">
                    Ürün bulunamadı
                  </td>
                </tr>
              ) : (
                products.map((sp) => {
                  const mappedCatId = getMappedCategory(sp.rawData)
                  const supplierCat = getSupplierCategory(sp.rawData)
                  const isLinked = !!sp.productId
                  const hasMapping = !!mappedCatId

                  return (
                    <tr
                      key={sp.id}
                      className="hover:bg-[#fafafa] transition-colors"
                    >
                      {/* Ürün */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-[#333] truncate">
                              {sp.externalName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {sp.externalBarcode && (
                                <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
                                  {sp.externalBarcode}
                                </span>
                              )}
                              {sp.externalSku && (
                                <span className="text-[11px] text-[var(--color-text-muted)]">
                                  SKU: {sp.externalSku}
                                </span>
                              )}
                            </div>
                            {isLinked && sp.product && (
                              <a
                                href={`/admin/urunler/${sp.product.id}`}
                                className="inline-flex items-center gap-1 text-[11px] text-[var(--color-nx-dark)] hover:underline mt-0.5"
                              >
                                <Link2 className="h-3 w-3" />
                                {sp.product.name}
                              </a>
                            )}
                          </div>
                          {sp.externalUrl && (
                            <a
                              href={sp.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-nx-dark)]"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Tedarikçi kategorisi */}
                      <td className="px-4 py-3">
                        <span className="text-[12px] text-[var(--color-text-muted)] truncate max-w-40 block">
                          {supplierCat || "—"}
                        </span>
                      </td>

                      {/* Eşleşen kategori */}
                      <td className="px-4 py-3">
                        {hasMapping ? (
                          <Badge
                            variant="outline"
                            className="text-[11px] border-[var(--color-nx-dark)]/30 text-[var(--color-nx-dark)] bg-[var(--color-nx-dark)]/5 gap-1"
                          >
                            <Tag className="h-3 w-3" />
                            {getCategoryName(mappedCatId!)}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-[#c82333] italic">
                            Eşleşmedi
                          </span>
                        )}
                      </td>

                      {/* Fiyat */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-[13px] font-medium text-[#333] tabular-nums">
                          {formatPrice(sp.purchasePrice ? Number(sp.purchasePrice) : null, sp.currency)}
                        </span>
                      </td>

                      {/* Stok */}
                      <td className="px-4 py-3 text-right">
                        <span
                          className={cn(
                            "text-[13px] tabular-nums font-medium",
                            sp.stockQuantity > 0 ? "text-emerald-600" : "text-red-500"
                          )}
                        >
                          {sp.stockQuantity}
                        </span>
                      </td>

                      {/* Durum */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isLinked && (
                            <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                              <Link2 className="h-3 w-3" />
                              Bağlı
                            </Badge>
                          )}
                          {hasMapping && !isLinked && (
                            <Badge className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 gap-1">
                              <Tag className="h-3 w-3" />
                              Eşleşti
                            </Badge>
                          )}
                          {!hasMapping && !isLinked && (
                            <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 gap-1">
                              <Unlink className="h-3 w-3" />
                              Bekliyor
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-3">
            <span className="text-xs text-[var(--color-text-muted)]">
              {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center justify-center h-8 w-8 border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-nx-dark)] hover:text-[var(--color-nx-dark)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      "inline-flex items-center justify-center h-8 w-8 text-xs font-semibold transition-colors",
                      page === pageNum
                        ? "bg-[var(--color-nx-dark)] text-white border border-[var(--color-nx-dark)]"
                        : "border border-[var(--color-border)] text-[#333] hover:border-[var(--color-nx-dark)] hover:text-[var(--color-nx-dark)]"
                    )}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center justify-center h-8 w-8 border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-nx-dark)] hover:text-[var(--color-nx-dark)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Sub-components
// ============================================================================
function SummaryCard({
  label,
  value,
  icon,
  accent,
  warning,
}: {
  label: string
  value: number
  icon: React.ReactNode
  accent?: boolean
  warning?: boolean
}) {
  return (
    <div
      className={cn(
        "bg-white border rounded-lg p-3 flex items-center gap-3",
        accent ? "border-emerald-200" : warning ? "border-amber-200" : "border-[var(--color-border)]"
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
          accent
            ? "bg-emerald-50 text-emerald-600"
            : warning
              ? "bg-amber-50 text-amber-600"
              : "bg-[var(--color-nx-dark)]/10 text-[var(--color-nx-dark)]"
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-[#333] tabular-nums">{value}</p>
        <p className="text-[11px] text-[var(--color-text-muted)]">{label}</p>
      </div>
    </div>
  )
}

// ============================================================================
// Utilities
// ============================================================================
function flattenCategories(
  nodes: Array<{ id: string; name: string; slug: string; children?: unknown[] }>,
  depth = 0
): CategoryOption[] {
  const result: CategoryOption[] = []
  for (const node of nodes) {
    result.push({
      id: node.id,
      name: node.name,
      slug: node.slug,
      depth,
    })
    if (node.children && Array.isArray(node.children)) {
      result.push(
        ...flattenCategories(
          node.children as Array<{ id: string; name: string; slug: string; children?: unknown[] }>,
          depth + 1
        )
      )
    }
  }
  return result
}
