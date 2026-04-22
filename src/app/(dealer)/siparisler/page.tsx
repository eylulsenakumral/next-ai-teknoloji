"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Eye,
  RefreshCw,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import { formatCurrency, formatDate } from "@/lib/utils/format"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Order {
  id: string
  orderNumber: string
  status: string
  grandTotal: number
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  itemCount: number
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

type FilterStatus =
  | "ALL"
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"

const FILTER_TABS: { value: FilterStatus; label: string }[] = [
  { value: "ALL", label: "Tümü" },
  { value: "PENDING", label: "Bekleyen" },
  { value: "CONFIRMED", label: "Onaylanan" },
  { value: "PREPARING", label: "Hazırlanıyor" },
  { value: "SHIPPED", label: "Kargoda" },
  { value: "DELIVERED", label: "Teslim Edildi" },
  { value: "CANCELLED", label: "İptal" },
]

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Havale/EFT",
  ON_ACCOUNT: "Cari Hesap",
  CREDIT_CARD: "Kredi Kartı",
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <div className="rounded-2xl ring-1 ring-black/5 shadow-sm overflow-hidden">
      <div className="bg-[#f9f9f9] px-6 py-3">
        <div className="h-4 w-full animate-pulse rounded bg-black/5" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-t border-black/5 px-6 py-4"
        >
          <div className="h-4 w-24 animate-pulse rounded bg-black/5" />
          <div className="hidden sm:block h-4 w-28 animate-pulse rounded bg-black/5" />
          <div className="hidden md:block h-4 w-12 animate-pulse rounded bg-black/5" />
          <div className="hidden sm:block h-4 w-20 animate-pulse rounded bg-black/5" />
          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-black/5" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-black/5" />
          <div className="h-8 w-8 animate-pulse rounded bg-black/5" />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

function Pagination({
  meta,
  page,
  onPageChange,
  isLoading,
}: {
  meta: Meta
  page: number
  onPageChange: (p: number) => void
  isLoading: boolean
}) {
  const { total, totalPages, limit } = meta
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  // Generate visible page numbers
  function getPageNumbers(): (number | "ellipsis")[] {
    const pages: (number | "ellipsis")[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
      return pages
    }
    pages.push(1)
    if (page > 3) pages.push("ellipsis")
    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (page < totalPages - 2) pages.push("ellipsis")
    pages.push(totalPages)
    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
      <p className="text-sm text-[#767676]">
        Toplam <span className="font-medium text-[#333333]">{total}</span>{" "}
        siparişten{" "}
        <span className="font-medium text-[#333333]">
          {from}-{to}
        </span>{" "}
        arası gösteriliyor
      </p>

      <nav
        className="flex items-center gap-1"
        aria-label="Sayfa navigasyonu"
      >
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e0e0e0] bg-white text-[#767676] transition-colors hover:border-[#0040a4] hover:text-[#0040a4] disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Önceki sayfa"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>

        {getPageNumbers().map((p, idx) =>
          p === "ellipsis" ? (
            <span
              key={`ellipsis-${idx}`}
              className="inline-flex h-8 w-8 items-center justify-center text-sm text-[#767676]"
            >
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              disabled={isLoading}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? "bg-[#0040a4] text-white shadow-sm"
                  : "border border-[#e0e0e0] bg-white text-[#767676] hover:border-[#0040a4] hover:text-[#0040a4]"
              } disabled:opacity-40 disabled:pointer-events-none`}
              aria-label={`Sayfa ${p}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e0e0e0] bg-white text-[#767676] transition-colors hover:border-[#0040a4] hover:text-[#0040a4] disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Sonraki sayfa"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </nav>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [status, setStatus] = useState<FilterStatus>("ALL")
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(status !== "ALL" ? { status } : {}),
      })
      const res = await fetch(`/api/orders?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Yüklenemedi")
      setOrders(json.data)
      setMeta(json.meta)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Siparişler yüklenemedi.",
      )
    } finally {
      setIsLoading(false)
    }
  }, [page, status])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  function handleStatusChange(newStatus: FilterStatus) {
    setStatus(newStatus)
    setPage(1)
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ---- Header ---- */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#333333] tracking-tight">
            Siparişlerim
          </h1>
          <p className="mt-1 text-sm text-[#767676]">
            Tüm siparişlerinizi buradan takip edebilirsiniz.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {meta && (
            <span className="inline-flex items-center rounded-full bg-[#0040a4]/10 px-3 py-1 text-xs font-semibold text-[#0040a4]">
              {meta.total} sipariş
            </span>
          )}
          <button
            onClick={fetchOrders}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0040a4] px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1a6fd4] disabled:opacity-50"
            aria-label="Siparişleri yenile"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              aria-hidden
            />
            Yenile
          </button>
        </div>
      </div>

      {/* ---- Filter Buttons ---- */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none"
        role="tablist"
        aria-label="Sipariş durumu filtresi"
      >
        {FILTER_TABS.map((tab) => {
          const isActive = status === tab.value
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleStatusChange(tab.value)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#0040a4] text-white shadow-sm"
                  : "border border-[#e0e0e0] bg-white text-[#767676] hover:border-[#0040a4] hover:text-[#0040a4]"
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ---- Error ---- */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
        >
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
      )}

      {/* ---- Content ---- */}
      {isLoading ? (
        <TableSkeleton />
      ) : orders.length === 0 ? (
        /* ---- Empty State ---- */
        <div className="rounded-2xl ring-1 ring-black/5 shadow-sm bg-white">
          <div className="flex flex-col items-center justify-center gap-5 py-20 text-center px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0040a4]/10">
              <ShoppingBag
                className="h-8 w-8 text-[#0040a4]"
                aria-hidden
              />
            </div>
            <div>
              <p className="text-lg font-semibold text-[#333333]">
                Sipariş bulunamadı
              </p>
              <p className="mt-1.5 text-sm text-[#767676] max-w-sm mx-auto">
                {status !== "ALL"
                  ? "Bu filtreye uygun sipariş bulunmuyor. Farklı bir filtre deneyin."
                  : "Henüz siparişiniz yok. Ürünlerimize göz atın!"}
              </p>
            </div>
            <Button
              render={<Link href="/urunler" />}
              className="mt-2 bg-[#0040a4] text-white hover:bg-[#1a6fd4]"
            >
              Alışverişe Başla
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* ---- Table ---- */}
          <div className="rounded-2xl ring-1 ring-black/5 shadow-sm bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#f9f9f9] border-b border-black/5">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#767676]">
                      Sipariş No
                    </th>
                    <th className="hidden sm:table-cell px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#767676]">
                      Tarih
                    </th>
                    <th className="hidden md:table-cell px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#767676]">
                      Ürün Sayısı
                    </th>
                    <th className="hidden sm:table-cell px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#767676]">
                      Ödeme Yöntemi
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#767676] text-right">
                      Toplam
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#767676]">
                      Durum
                    </th>
                    <th className="px-5 py-3 w-12">
                      <span className="sr-only">İşlemler</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {orders.map((order, idx) => (
                    <tr
                      key={order.id}
                      className={`transition-colors hover:bg-[#f9f9f9] ${
                        idx % 2 === 1 ? "bg-[#fafafa]" : "bg-white"
                      }`}
                    >
                      <td className="px-5 py-3.5 font-mono text-sm font-bold text-[#333333] whitespace-nowrap">
                        {order.orderNumber}
                      </td>
                      <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-[#767676] whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="hidden md:table-cell px-5 py-3.5 text-sm text-[#767676]">
                        {order.itemCount} ürün
                      </td>
                      <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-[#767676]">
                        {PAYMENT_METHOD_LABELS[order.paymentMethod] ??
                          order.paymentMethod}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-[#333333] text-right tabular-nums whitespace-nowrap">
                        {formatCurrency(order.grandTotal)}
                      </td>
                      <td className="px-5 py-3.5">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/siparisler/${order.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#767676] transition-colors hover:bg-[#0040a4]/10 hover:text-[#0040a4]"
                          aria-label={`${order.orderNumber} siparişini görüntüle`}
                        >
                          <Eye className="h-4 w-4" aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ---- Pagination ---- */}
          {meta && meta.totalPages > 1 && (
            <Pagination
              meta={meta}
              page={page}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          )}
        </>
      )}
    </section>
  )
}
