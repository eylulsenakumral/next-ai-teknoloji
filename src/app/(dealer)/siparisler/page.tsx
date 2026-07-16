"use client"

import { useState, useEffect, useCallback, Fragment } from "react"
import Link from "next/link"
import {
  RefreshCw,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Package,
  MapPin,
  Truck,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Copy,
  Check,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
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
  currency: string
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  itemCount: number
}

interface OrderItem {
  id: string
  productId: string | null
  productName: string
  productBarcode: string | null
  quantity: number
  unitPrice: number
  discountAmount: number
  vatRate: number
  lineSubtotal: number
  lineVat: number
  lineTotal: number
}

interface ShippingAddress {
  companyName?: string
  contactName?: string
  phone?: string
  address?: string
  city?: string
  district?: string
  postalCode?: string
}

interface OrderDetail {
  id: string
  orderNumber: string
  status: string
  subtotal: number
  discountTotal: number
  vatTotal: number
  shippingTotal: number
  grandTotal: number
  shippingAddress: ShippingAddress | null
  notes: string | null
  paymentMethod: string
  paymentStatus: string
  shippingTrackingNumber: string | null
  shippingCarrier: string | null
  cancelledAt: string | null
  cancelledReason: string | null
  shippedAt: string | null
  deliveredAt: string | null
  createdAt: string
  items: OrderItem[]
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

const PAYMENT_ICONS: Record<string, string> = {
  BANK_TRANSFER: "🏦",
  ON_ACCOUNT: "📋",
  CREDIT_CARD: "💳",
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
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Status Timeline
// ---------------------------------------------------------------------------

const NORMAL_FLOW = ["PENDING", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"] as const
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Sipariş Alındı",
  CONFIRMED: "Onaylandı",
  PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoya Verildi",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal Edildi",
  RETURNED: "İade Edildi",
}

function StatusTimeline({ currentStatus, createdAt, shippedAt, deliveredAt, cancelledAt }: {
  currentStatus: string
  createdAt: string
  shippedAt?: string | null
  deliveredAt?: string | null
  cancelledAt?: string | null
}) {
  const isCancelled = currentStatus === "CANCELLED" || currentStatus === "RETURNED"

  if (isCancelled) {
    return (
      <div className="relative">
        <div className="flex items-start gap-3 relative" style={{ minHeight: 44 }}>
          <div className="absolute left-[13px] top-[28px] bottom-0 w-0.5 bg-[#e5e5e5]" />
          <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#0040a4] bg-[#0040a4]">
            <div className="h-2.5 w-2.5 rounded-full bg-white" />
          </div>
          <div className="pt-0.5">
            <p className="text-sm font-medium text-[#333] leading-snug">Sipariş Alındı</p>
            <p className="text-xs text-[#999] mt-0.5">{formatDate(createdAt)}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 relative" style={{ minHeight: 28 }}>
          <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-red-400 bg-red-100">
            <XCircle className="h-3.5 w-3.5 text-red-600" />
          </div>
          <div className="pt-0.5">
            <p className="text-sm font-medium text-red-600 leading-snug">
              {currentStatus === "RETURNED" ? "İade Edildi" : "İptal Edildi"}
            </p>
            {cancelledAt && <p className="text-xs text-[#999] mt-0.5">{formatDate(cancelledAt)}</p>}
          </div>
        </div>
      </div>
    )
  }

  const currentIndex = NORMAL_FLOW.indexOf(currentStatus as typeof NORMAL_FLOW[number])
  const steps = NORMAL_FLOW.map((s, idx) => ({
    status: s,
    label: STATUS_LABELS[s] ?? s,
    date: idx === 0 ? createdAt : s === "SHIPPED" ? shippedAt : s === "DELIVERED" ? deliveredAt : null,
  }))

  return (
    <div className="relative">
      {steps.map((step, idx) => {
        const isDone = idx <= currentIndex
        const isCurrent = idx === currentIndex
        const isLast = idx === steps.length - 1
        return (
          <div key={step.status} className="flex items-start gap-3 relative" style={{ minHeight: isLast ? 28 : 44 }}>
            {!isLast && (
              <div className="absolute left-[13px] top-[28px] bottom-0 w-0.5" style={{ backgroundColor: idx < currentIndex ? "#0040a4" : "#e5e5e5" }} />
            )}
            <div className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${isDone ? "border-[#0040a4] bg-[#0040a4]" : "border-[#e5e5e5] bg-white"}`}>
              <div className={`h-2.5 w-2.5 rounded-full ${isDone ? "bg-white" : "bg-[#ccc]"}`} />
            </div>
            <div className="pt-0.5">
              <p className={`text-sm leading-snug ${isCurrent ? "font-semibold text-[#0040a4]" : isDone ? "font-medium text-[#333]" : "text-[#999]"}`}>
                {step.label}
              </p>
              {step.date ? (
                <p className="text-xs text-[#999] mt-0.5">{formatDate(step.date)}</p>
              ) : isCurrent ? (
                <p className="flex items-center gap-1 text-xs text-[#767676] mt-0.5">
                  <Clock className="h-3 w-3" /><span>İşlemde</span>
                </p>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

function Pagination({ meta, page, onPageChange, isLoading }: {
  meta: Meta
  page: number
  onPageChange: (p: number) => void
  isLoading: boolean
}) {
  const { total, totalPages, limit } = meta
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

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
        <span className="font-medium text-[#333333]">{from}-{to}</span>{" "}
        arası gösteriliyor
      </p>
      <nav className="flex items-center gap-1" aria-label="Sayfa navigasyonu">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1 || isLoading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e0e0e0] bg-white text-[#767676] transition-colors hover:border-[#0040a4] hover:text-[#0040a4] disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Önceki sayfa">
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        {getPageNumbers().map((p, idx) =>
          p === "ellipsis" ? (
            <span key={`e-${idx}`} className="inline-flex h-8 w-8 items-center justify-center text-sm text-[#767676]">...</span>
          ) : (
            <button key={p} onClick={() => onPageChange(p)} disabled={isLoading}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                p === page ? "bg-[#0040a4] text-white shadow-sm" : "border border-[#e0e0e0] bg-white text-[#767676] hover:border-[#0040a4] hover:text-[#0040a4]"
              } disabled:opacity-40 disabled:pointer-events-none`}
              aria-label={`Sayfa ${p}`} aria-current={p === page ? "page" : undefined}>
              {p}
            </button>
          ),
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages || isLoading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e0e0e0] bg-white text-[#767676] transition-colors hover:border-[#0040a4] hover:text-[#0040a4] disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Sonraki sayfa">
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </nav>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Order Detail Accordion Panel
// ---------------------------------------------------------------------------

function OrderDetailPanel({ orderId, usdTryRate }: { orderId: string; usdTryRate: number }) {
  const [detail, setDetail] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/orders/${orderId}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        if (!cancelled) setDetail(json.data)
      } catch {
        if (!cancelled) setDetail(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [orderId])

  function copyOrderNumber() {
    if (detail) {
      navigator.clipboard.writeText(detail.orderNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#0040a4]" />
      </div>
    )
  }

  if (!detail) {
    return <div className="py-6 text-center text-sm text-red-600">Sipariş detayı yüklenemedi.</div>
  }

  const shippingAddr = detail.shippingAddress
  const grandTotalTRY = usdTryRate > 0 ? detail.grandTotal * usdTryRate : 0

  return (
    <div className="p-5 space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sol: Kalemler */}
        <div className="lg:col-span-2 space-y-4">
          {/* Sipariş Başlığı */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-[#333]">{detail.orderNumber}</span>
            <button onClick={copyOrderNumber} className="text-[#999] hover:text-[#0040a4] transition-colors" title="Kopyala">
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <OrderStatusBadge status={detail.status} />
            <span className="text-xs text-[#999] ml-auto">{formatDate(detail.createdAt)}</span>
          </div>

          {/* Sipariş Kalemleri */}
          <div className="rounded-xl ring-1 ring-black/5 overflow-hidden">
            <div className="p-3 pb-2 flex items-center gap-2 bg-[#fafafa]">
              <Package className="h-3.5 w-3.5 text-[#0040a4]" />
              <span className="text-xs font-semibold text-[#333]">Sipariş Kalemleri</span>
              <span className="ml-auto text-xs text-[#999]">{detail.items.length} ürün</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-[#e5e5e5] bg-[#fafafa]">
                    <th className="text-left py-2 px-4 text-xs font-medium text-[#767676] uppercase tracking-wide">Ürün</th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-[#767676] uppercase tracking-wide w-14">Adet</th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-[#767676] uppercase tracking-wide w-24">Birim</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-[#767676] uppercase tracking-wide w-24">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]">
                  {detail.items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f9fafb] transition-colors">
                      <td className="py-2.5 px-4">
                        <p className="font-medium text-[#333] text-xs leading-snug">{item.productName}</p>
                        {item.productBarcode && <p className="text-[10px] text-[#999] mt-0.5">Barkod: {item.productBarcode}</p>}
                      </td>
                      <td className="py-2.5 px-2 text-center tabular-nums text-[#333] text-xs">{item.quantity}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums text-xs">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="font-semibold text-[#333] tabular-nums text-xs block">{formatCurrency(item.lineTotal)}</span>
                        <span className="text-[9px] text-[#aaa] block">KDV Dahil</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[#e5e5e5] bg-[#fafafa] px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-[#767676]">Toplam ({detail.items.reduce((s, i) => s + i.quantity, 0)} adet)</span>
              <span className="font-bold text-[#0040a4] tabular-nums">{formatCurrency(detail.grandTotal)}</span>
            </div>
          </div>

          {/* Kargo */}
          {(detail.shippingTrackingNumber || detail.shippingCarrier) && (
            <div className="rounded-xl ring-1 ring-black/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-3.5 w-3.5 text-[#0040a4]" />
                <span className="text-xs font-semibold text-[#333]">Kargo Bilgileri</span>
              </div>
              <div className="space-y-1.5 text-xs">
                {detail.shippingCarrier && (
                  <div className="flex justify-between">
                    <span className="text-[#767676]">Kargo Firması</span>
                    <span className="font-medium text-[#333]">{detail.shippingCarrier}</span>
                  </div>
                )}
                {detail.shippingTrackingNumber && (
                  <div className="flex justify-between">
                    <span className="text-[#767676]">Takip No</span>
                    <span className="font-mono font-medium text-[#0040a4]">{detail.shippingTrackingNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* İptal sebebi */}
          {detail.cancelledReason && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-3.5 w-3.5 text-red-600" />
                <span className="text-xs font-semibold text-red-700">İptal Sebebi</span>
              </div>
              <p className="text-xs text-red-600">{detail.cancelledReason}</p>
            </div>
          )}

          {/* Sipariş notu */}
          {detail.notes && (
            <div className="rounded-xl ring-1 ring-black/5 p-4">
              <span className="text-xs font-semibold text-[#333]">Sipariş Notu</span>
              <p className="text-xs text-[#767676] mt-1">{detail.notes}</p>
            </div>
          )}
        </div>

        {/* Sağ: Durum + Ödeme + Adres + Fiyat */}
        <div className="space-y-4">
          {/* Durum */}
          <div className="rounded-xl ring-1 ring-black/5 p-4">
            <span className="text-xs font-semibold text-[#333] mb-3 block">Sipariş Durumu</span>
            <StatusTimeline
              currentStatus={detail.status}
              createdAt={detail.createdAt}
              shippedAt={detail.shippedAt}
              deliveredAt={detail.deliveredAt}
              cancelledAt={detail.cancelledAt}
            />
          </div>

          {/* Ödeme */}
          <div className="rounded-xl ring-1 ring-black/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-3.5 w-3.5 text-[#0040a4]" />
              <span className="text-xs font-semibold text-[#333]">Ödeme Bilgileri</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#767676]">Ödeme Yöntemi</span>
                <span className="font-medium text-[#333]">
                  {PAYMENT_ICONS[detail.paymentMethod]} {PAYMENT_METHOD_LABELS[detail.paymentMethod] ?? detail.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#767676]">Ödeme Durumu</span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  detail.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}>
                  {detail.paymentStatus === "PAID" ? <><CheckCircle2 className="h-3 w-3" /> Ödendi</> : <><Clock className="h-3 w-3" /> Bekliyor</>}
                </span>
              </div>
            </div>
          </div>

          {/* Adres */}
          {shippingAddr && (
            <div className="rounded-xl ring-1 ring-black/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-3.5 w-3.5 text-[#0040a4]" />
                <span className="text-xs font-semibold text-[#333]">Teslimat Adresi</span>
              </div>
              <div className="text-xs space-y-0.5">
                {shippingAddr.companyName && <p className="font-semibold text-[#333]">{shippingAddr.companyName}</p>}
                {shippingAddr.contactName && <p className="text-[#767676]">{shippingAddr.contactName}</p>}
                {shippingAddr.phone && <p className="text-[#767676]">{shippingAddr.phone}</p>}
                {shippingAddr.address && <p className="text-[#767676]">{shippingAddr.address}</p>}
                <p className="text-[#767676]">{[shippingAddr.district, shippingAddr.city, shippingAddr.postalCode].filter(Boolean).join(", ")}</p>
              </div>
            </div>
          )}

          {/* Fiyat Özeti */}
          <div className="rounded-xl ring-1 ring-black/5 p-4 space-y-2">
            <span className="text-xs font-semibold text-[#333]">Fiyat Özeti</span>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#767676]">Ara Toplam</span>
                <span className="text-[#333] tabular-nums">{formatCurrency(detail.subtotal)}</span>
              </div>
              {detail.discountTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#767676]">İskonto</span>
                  <span className="text-green-600 tabular-nums">-{formatCurrency(detail.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#767676]">KDV</span>
                <span className="text-[#333] tabular-nums">{formatCurrency(detail.vatTotal)}</span>
              </div>
              {detail.shippingTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#767676]">Kargo</span>
                  <span className="text-[#333] tabular-nums">{formatCurrency(detail.shippingTotal)}</span>
                </div>
              )}
            </div>
            <Separator className="bg-[#e5e5e5]" />
            <div className="flex justify-between items-center">
              <span className="font-semibold text-[#333] text-xs">Genel Toplam</span>
              <span className="font-bold text-[#0040a4] tabular-nums">{formatCurrency(detail.grandTotal)}</span>
            </div>
            {grandTotalTRY > 0 && (
              <div className="rounded-lg bg-[#f0f5ff] border border-[#c5d9f8] p-2.5 space-y-0.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#0040a4] font-medium">TL Karşılığı</span>
                  <span className="font-bold text-[#0040a4] tabular-nums">{formatCurrency(grandTotalTRY, "TRY")}</span>
                </div>
                <p className="text-[10px] text-[#767676]">1 USD = {usdTryRate.toFixed(2)} TL</p>
              </div>
            )}
          </div>
        </div>
      </div>
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
  const [usdTryRate, setUsdTryRate] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
      if (json.usdTryRate) setUsdTryRate(json.usdTryRate)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Siparişler yüklenemedi.")
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
    setExpandedId(null)
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    setExpandedId(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ---- Header ---- */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#333333] tracking-tight">Siparişlerim</h1>
          <p className="mt-1 text-sm text-[#767676]">Tüm siparişlerinizi buradan takip edebilirsiniz.</p>
        </div>
        <div className="flex items-center gap-3">
          {meta && (
            <span className="inline-flex items-center rounded-full bg-[#0040a4]/10 px-3 py-1 text-xs font-semibold text-[#0040a4]">
              {meta.total} sipariş
            </span>
          )}
          <button onClick={fetchOrders} disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0040a4] px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1a6fd4] disabled:opacity-50"
            aria-label="Siparişleri yenile">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden />
            Yenile
          </button>
        </div>
      </div>

      {/* ---- Filter Buttons ---- */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none" role="tablist" aria-label="Sipariş durumu filtresi">
        {FILTER_TABS.map((tab) => {
          const isActive = status === tab.value
          return (
            <button key={tab.value} role="tab" aria-selected={isActive} onClick={() => handleStatusChange(tab.value)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                isActive ? "bg-[#0040a4] text-white shadow-sm" : "border border-[#e0e0e0] bg-white text-[#767676] hover:border-[#0040a4] hover:text-[#0040a4]"
              }`}>
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ---- Error ---- */}
      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
      )}

      {/* ---- Content ---- */}
      {isLoading ? (
        <TableSkeleton />
      ) : orders.length === 0 ? (
        <div className="rounded-2xl ring-1 ring-black/5 shadow-sm bg-white">
          <div className="flex flex-col items-center justify-center gap-5 py-20 text-center px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0040a4]/10">
              <ShoppingBag className="h-8 w-8 text-[#0040a4]" aria-hidden />
            </div>
            <div>
              <p className="text-lg font-semibold text-[#333333]">Sipariş bulunamadı</p>
              <p className="mt-1.5 text-sm text-[#767676] max-w-sm mx-auto">
                {status !== "ALL" ? "Bu filtreye uygun sipariş bulunmuyor. Farklı bir filtre deneyin." : "Henüz siparişiniz yok. Ürünlerimize göz atın!"}
              </p>
            </div>
            <Link href="/urunler" className="mt-2 bg-[#0040a4] text-white hover:bg-[#1a6fd4] inline-flex items-center justify-center gap-1.5 rounded-lg h-8 px-2.5 text-sm font-medium transition-colors">
              Alışverişe Başla
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* ---- Accordion Table ---- */}
          <div className="rounded-2xl ring-1 ring-black/5 shadow-sm bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#f9f9f9] border-b border-black/5">
                    <th className="w-10 px-3 py-3" />
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#767676]">Sipariş No</th>
                    <th className="hidden sm:table-cell px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#767676]">Tarih</th>
                    <th className="hidden md:table-cell px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#767676]">Ürün Sayısı</th>
                    <th className="hidden sm:table-cell px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#767676]">Ödeme Yöntemi</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#767676] text-right">Toplam</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#767676]">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {orders.map((order, idx) => {
                    const isExpanded = expandedId === order.id
                    return (
                      <Fragment key={order.id}>
                        <tr
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                          onClick={() => setExpandedId(isExpanded ? null : order.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              setExpandedId(isExpanded ? null : order.id)
                            }
                          }}
                          className={`cursor-pointer transition-colors hover:bg-[#f0f4ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0040a4] ${idx % 2 === 1 ? "bg-[#fafafa]" : "bg-white"}`}
                        >
                          <td className="px-3 py-3.5">
                            <ChevronDown className={`h-4 w-4 text-[#767676] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                          </td>
                          <td className="px-5 py-3.5 font-mono text-sm font-bold text-[#333333] whitespace-nowrap">{order.orderNumber}</td>
                          <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-[#767676] whitespace-nowrap">{formatDate(order.createdAt)}</td>
                          <td className="hidden md:table-cell px-5 py-3.5 text-sm text-[#767676]">{order.itemCount} ürün</td>
                          <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-[#767676]">{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</td>
                          <td className="px-5 py-3.5 text-right tabular-nums whitespace-nowrap">
                            <div className="text-sm font-semibold text-[#333333]">{formatCurrency(order.grandTotal, "USD")}</div>
                            {usdTryRate > 0 && (
                              <div className="text-[11px] text-[#767676] mt-0.5">≈ {formatCurrency(order.grandTotal * usdTryRate, "TRY")}</div>
                            )}
                          </td>
                          <td className="px-5 py-3.5"><OrderStatusBadge status={order.status} /></td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="bg-[#fafcff] border-t border-b-2 border-[#0040a4]/10 p-0">
                              <OrderDetailPanel orderId={order.id} usdTryRate={usdTryRate} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ---- Pagination ---- */}
          {meta && meta.totalPages > 1 && (
            <Pagination meta={meta} page={page} onPageChange={handlePageChange} isLoading={isLoading} />
          )}
        </>
      )}
    </section>
  )
}
