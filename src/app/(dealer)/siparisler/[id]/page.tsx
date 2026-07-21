"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  MapPin,
  Package,
  Truck,
  AlertTriangle,
  Loader2,
  CreditCard,
  FileText,
  XCircle,
  CheckCircle2,
  Clock,
  Copy,
  Check,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useExchangeRate } from "@/hooks/use-exchange-rate"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

// ---------------------------------------------------------------------------
// Tipler
// ---------------------------------------------------------------------------

interface ShippingAddress {
  companyName?: string
  contactName?: string
  phone?: string
  address?: string
  city?: string
  district?: string
  postalCode?: string
  country?: string
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

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Havale / EFT",
  ON_ACCOUNT: "Acik Hesap (Cari)",
  CREDIT_CARD: "Kredi Karti",
}

const PAYMENT_ICONS: Record<string, string> = {
  BANK_TRANSFER: "🏦",
  ON_ACCOUNT: "📋",
  CREDIT_CARD: "💳",
}

// ---------------------------------------------------------------------------
// Sipariş Durumu Zaman Çizelgesi
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

function StatusTimeline({
  currentStatus,
  createdAt,
  shippedAt,
  deliveredAt,
  cancelledAt,
}: {
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
          <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-primary)] bg-[var(--color-primary)]">
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
            {/* Dikey çizgi - step'in arkasında */}
            {!isLast && (
              <div
                className="absolute left-[13px] top-[28px] bottom-0 w-0.5"
                style={{ backgroundColor: idx < currentIndex ? "var(--color-primary)" : "#e5e5e5" }}
              />
            )}
            {/* Daire */}
            <div
              className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                isDone
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                  : "border-[#e5e5e5] bg-white"
              }`}
            >
              <div className={`h-2.5 w-2.5 rounded-full ${isDone ? "bg-white" : "bg-[#ccc]"}`} />
            </div>
            {/* Metin */}
            <div className="pt-0.5">
              <p
                className={`text-sm leading-snug ${
                  isCurrent ? "font-semibold text-[var(--color-primary)]" : isDone ? "font-medium text-[#333]" : "text-[#999]"
                }`}
              >
                {step.label}
              </p>
              {step.date ? (
                <p className="text-xs text-[#999] mt-0.5">{formatDate(step.date)}</p>
              ) : isCurrent ? (
                <p className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] mt-0.5">
                  <Clock className="h-3 w-3" />
                  <span>İşlemde</span>
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
// İptal modal
// ---------------------------------------------------------------------------

function CancelModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: (reason: string) => void
  isLoading: boolean
}) {
  const [reason, setReason] = useState("")
  const [err, setErr] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (reason.trim().length < 5) {
      setErr("İptal sebebi en az 5 karakter olmalı.")
      return
    }
    onConfirm(reason.trim())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#333]">Siparişi İptal Et</DialogTitle>
          <DialogDescription className="text-[var(--color-text-muted)]">
            Bu işlem geri alınamaz. Cari hesabınıza yapılan borç kaydı da iptal edilecektir.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label htmlFor="cancel-reason" className="text-sm font-medium text-[#333]">
              İptal Sebebi
            </label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => { setReason(e.target.value); setErr("") }}
              placeholder="İptal sebebinizi yazın..."
              rows={3}
              className="rounded-xl border-[#e5e5e5] focus:border-[var(--color-primary)]"
            />
            {err && <p className="text-xs text-red-600">{err}</p>}
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="h-10 px-4 rounded-xl border border-[#e5e5e5] text-sm font-medium text-[#333] hover:bg-[#f9fafb] transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-10 px-4 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Siparişi İptal Et
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Ana sayfa
// ---------------------------------------------------------------------------

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { usd } = useExchangeRate()

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/orders/${id}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? "Yüklenemedi")
        setOrder(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sipariş yüklenemedi.")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  async function handleCancel(reason: string) {
    setIsCancelling(true)
    setCancelError(null)
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "İptal edilemedi.")
      setCancelOpen(false)
      const res2 = await fetch(`/api/orders/${id}`)
      const json2 = await res2.json()
      if (res2.ok) setOrder(json2.data)
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "İptal edilemedi.")
    } finally {
      setIsCancelling(false)
    }
  }

  function copyOrderNumber() {
    if (order) {
      navigator.clipboard.writeText(order.orderNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[var(--color-surface-muted)] animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-[var(--color-surface-muted)] rounded animate-pulse" />
            <div className="h-3 w-48 bg-[var(--color-surface-muted)] rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 rounded-2xl bg-[var(--color-surface-muted)] animate-pulse" />
          <div className="h-48 rounded-2xl bg-[var(--color-surface-muted)] animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-[#333] mb-2">Sipariş Bulunamadı</h1>
        <p className="text-[var(--color-text-muted)] mb-6">{error ?? "Aradığınız sipariş mevcut değil."}</p>
        <Link
          href="/siparisler"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Siparişlerime Dön
        </Link>
      </div>
    )
  }

  const shippingAddr = order.shippingAddress
  const grandTotalTRY = usd ? order.grandTotal * usd : 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-3">
          <Link
            href="/siparisler"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e5e5e5] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[#333] font-mono tracking-tight">
                {order.orderNumber}
              </h1>
              <button
                onClick={copyOrderNumber}
                className="text-[#999] hover:text-[var(--color-primary)] transition-colors"
                title="Kopyala"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        {order.status === "PENDING" && (
          <button
            onClick={() => setCancelOpen(true)}
            className="h-10 px-4 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5"
          >
            <XCircle className="h-4 w-4" />
            Siparişi İptal Et
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: Kalemler + Kargo + Notlar */}
        <div className="lg:col-span-2 space-y-5">
          {/* Sipariş Kalemleri */}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
            <div className="p-5 pb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
                <Package className="h-3.5 w-3.5 text-[var(--color-primary)]" />
              </div>
              <h2 className="text-sm font-semibold text-[#333]">Sipariş Kalemleri</h2>
              <span className="ml-auto text-xs text-[#999]">{order.items.length} ürün</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-[#e5e5e5] bg-[#fafafa]">
                    <th className="text-left py-2.5 px-5 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Ürün</th>
                    <th className="text-center py-2.5 px-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide w-16">Adet</th>
                    <th className="text-right py-2.5 px-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide w-28">Birim</th>
                    <th className="text-right py-2.5 px-5 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide w-28">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f9fafb] transition-colors">
                      <td className="py-3 px-5">
                        <p className="font-medium text-[#333] leading-snug">{item.productName}</p>
                        {item.productBarcode && (
                          <p className="text-xs text-[#999] mt-0.5">Barkod: {item.productBarcode}</p>
                        )}
                        <p className="text-xs text-[#999] mt-0.5">KDV: %{item.vatRate}</p>
                      </td>
                      <td className="py-3 px-3 text-center tabular-nums text-[#333]">{item.quantity}</td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        <span className="text-[#333]">{formatCurrency(item.unitPrice)}</span>
                        <br />
                        <span className="text-[10px] text-[#999]">
                          {formatCurrency(item.unitPrice * (1 + item.vatRate / 100))} KDV dahil
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right font-semibold text-[#333] tabular-nums">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tablo altı toplam */}
            <div className="border-t border-[#e5e5e5] bg-[#fafafa] px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-muted)]">Toplam ({order.items.reduce((s, i) => s + i.quantity, 0)} adet)</span>
              <span className="font-bold text-[var(--color-primary)] text-lg tabular-nums">{formatCurrency(order.grandTotal)}</span>
            </div>
          </div>

          {/* Kargo Bilgileri */}
          {(order.shippingTrackingNumber || order.shippingCarrier) && (
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
                  <Truck className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                </div>
                <h2 className="text-sm font-semibold text-[#333]">Kargo Bilgileri</h2>
              </div>
              <div className="space-y-2 text-sm">
                {order.shippingCarrier && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Kargo Firması</span>
                    <span className="font-medium text-[#333]">{order.shippingCarrier}</span>
                  </div>
                )}
                {order.shippingTrackingNumber && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Takip No</span>
                    <span className="font-mono font-medium text-[var(--color-primary)]">{order.shippingTrackingNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* İptal sebebi */}
          {order.cancelledReason && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm font-semibold text-red-700">İptal Sebebi</p>
              </div>
              <p className="text-sm text-red-600">{order.cancelledReason}</p>
            </div>
          )}

          {/* Sipariş notu */}
          {order.notes && (
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-surface-muted)]">
                  <FileText className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                </div>
                <p className="text-sm font-semibold text-[#333]">Sipariş Notu</p>
              </div>
              <p className="text-sm text-[var(--color-text-muted)]">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sağ: Durum + Ödeme + Adres + Fiyat */}
        <div className="space-y-5">
          {/* Sipariş Durumu */}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5">
            <h2 className="text-sm font-semibold text-[#333] mb-4">Sipariş Durumu</h2>
            <StatusTimeline
              currentStatus={order.status}
              createdAt={order.createdAt}
              shippedAt={order.shippedAt}
              deliveredAt={order.deliveredAt}
              cancelledAt={order.cancelledAt}
            />
          </div>

          {/* Ödeme Bilgileri */}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
                <CreditCard className="h-3.5 w-3.5 text-[var(--color-primary)]" />
              </div>
              <h2 className="text-sm font-semibold text-[#333]">Ödeme Bilgileri</h2>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Ödeme Yöntemi</span>
                <span className="font-medium text-[#333]">
                  {PAYMENT_ICONS[order.paymentMethod]}{" "}
                  {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-muted)]">Ödeme Durumu</span>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  order.paymentStatus === "PAID"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {order.paymentStatus === "PAID" ? (
                    <><CheckCircle2 className="h-3 w-3" /> Ödendi</>
                  ) : (
                    <><Clock className="h-3 w-3" /> Bekliyor</>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Teslimat Adresi */}
          {shippingAddr && (
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
                  <MapPin className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                </div>
                <h2 className="text-sm font-semibold text-[#333]">Teslimat Adresi</h2>
              </div>
              <div className="text-sm space-y-1">
                {shippingAddr.companyName && <p className="font-semibold text-[#333]">{shippingAddr.companyName}</p>}
                {shippingAddr.contactName && <p className="text-[var(--color-text-muted)]">{shippingAddr.contactName}</p>}
                {shippingAddr.phone && <p className="text-[var(--color-text-muted)]">{shippingAddr.phone}</p>}
                {shippingAddr.address && <p className="text-[var(--color-text-muted)]">{shippingAddr.address}</p>}
                <p className="text-[var(--color-text-muted)]">
                  {[shippingAddr.district, shippingAddr.city, shippingAddr.postalCode].filter(Boolean).join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* Fiyat Özeti */}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[#333]">Fiyat Özeti</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Ara Toplam (KDV hariç)</span>
                <span className="text-[#333] tabular-nums">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">İskonto</span>
                  <span className="text-green-600 tabular-nums">-{formatCurrency(order.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">KDV</span>
                <span className="text-[#333] tabular-nums">{formatCurrency(order.vatTotal)}</span>
              </div>
              {order.shippingTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Kargo</span>
                  <span className="text-[#333] tabular-nums">{formatCurrency(order.shippingTotal)}</span>
                </div>
              )}
            </div>

            <Separator className="bg-[#e5e5e5]" />

            <div className="flex justify-between items-center">
              <span className="font-semibold text-[#333]">Genel Toplam</span>
              <span className="font-bold text-lg text-[var(--color-primary)] tabular-nums">{formatCurrency(order.grandTotal)}</span>
            </div>

            {usd > 0 && (
              <div className="rounded-xl bg-[#f0f5ff] border border-[#c5d9f8] p-3 space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--color-primary)] font-medium">TL Karşılığı</span>
                  <span className="font-bold text-[var(--color-primary)] tabular-nums">{formatCurrency(grandTotalTRY, "TRY")}</span>
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)]">1 USD = {usd.toFixed(2)} TL (TCMB günlük kur)</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {cancelError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{cancelError}</div>
      )}

      <CancelModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onConfirm={handleCancel}
        isLoading={isCancelling}
      />
    </div>
  )
}
