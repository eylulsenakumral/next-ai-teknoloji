"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  MapPin,
  Package,
  Truck,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import { OrderStatusTimeline } from "@/components/orders/order-status-timeline"
import { OrderSummary } from "@/components/orders/order-summary"
import { formatCurrency, formatDate } from "@/lib/utils/format"

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
  ON_ACCOUNT: "Açık Hesap (Cari)",
  CREDIT_CARD: "Kredi Kartı",
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Siparişi İptal Et</DialogTitle>
          <DialogDescription>
            Bu işlem geri alınamaz. Cari hesabınıza yapılan borç kaydı da iptal edilecektir.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">İptal Sebebi</Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setErr("")
              }}
              placeholder="İptal sebebinizi yazın..."
              rows={3}
              aria-invalid={!!err}
              aria-describedby={err ? "cancel-reason-error" : undefined}
            />
            {err && (
              <p id="cancel-reason-error" className="text-xs text-destructive">
                {err}
              </p>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Vazgeç
            </Button>
            <Button type="submit" variant="destructive" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden />
                  İptal ediliyor...
                </>
              ) : (
                "Siparişi İptal Et"
              )}
            </Button>
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
  const router = useRouter()

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

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
      router.refresh()
      // Siparişi yeniden yükle
      const res2 = await fetch(`/api/orders/${id}`)
      const json2 = await res2.json()
      if (res2.ok) setOrder(json2.data)
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "İptal edilemedi.")
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden />
        <p className="font-semibold">{error ?? "Sipariş bulunamadı."}</p>
        <Button variant="outline" render={<Link href="/siparisler" />}>
          Siparişlerime Dön
        </Button>
      </div>
    )
  }

  const shippingAddr = order.shippingAddress

  return (
    <>
      <div className="space-y-6">
        {/* Başlık */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              render={<Link href="/siparisler" />}
              aria-label="Siparişlere dön"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold font-mono">{order.orderNumber}</h1>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          {/* İptal butonu */}
          {order.status === "PENDING" && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setCancelOpen(true)}
            >
              <AlertTriangle className="h-4 w-4 mr-1.5" aria-hidden />
              Siparişi İptal Et
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol: Kalemler + Kargo */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sipariş Kalemleri */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4" aria-hidden />
                  Sipariş Kalemleri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" aria-label="Sipariş kalemleri">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground uppercase tracking-wide">
                        <th className="text-left pb-2 font-medium">Ürün</th>
                        <th className="text-center pb-2 font-medium w-16">Adet</th>
                        <th className="text-right pb-2 font-medium w-28">Birim Fiyat</th>
                        <th className="text-right pb-2 font-medium w-28">Toplam</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {order.items.map((item) => (
                        <tr key={item.id} className="py-2">
                          <td className="py-3 pr-4">
                            <p className="font-medium leading-snug">{item.productName}</p>
                            {item.productBarcode && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Barkod: {item.productBarcode}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              KDV: %{item.vatRate}
                            </p>
                          </td>
                          <td className="py-3 text-center tabular-nums">{item.quantity}</td>
                          <td className="py-3 text-right tabular-nums">
                            <div className="flex flex-col items-end">
                              <span>{formatCurrency(item.unitPrice)}</span>
                              <span className="text-[10px] text-gray-400">
                                {formatCurrency(item.unitPrice * (1 + item.vatRate / 100))}
                                <span className="text-[9px]"> KDV dahil</span>
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-right font-medium tabular-nums">
                            {formatCurrency(item.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Kargo Bilgileri */}
            {(order.shippingTrackingNumber || order.shippingCarrier) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Truck className="h-4 w-4" aria-hidden />
                    Kargo Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  {order.shippingCarrier && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-28">Kargo Firması:</span>
                      <span className="font-medium">{order.shippingCarrier}</span>
                    </div>
                  )}
                  {order.shippingTrackingNumber && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-28">Takip No:</span>
                      <span className="font-mono font-medium">
                        {order.shippingTrackingNumber}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* İptal sebebi */}
            {order.cancelledReason && (
              <Card className="border-destructive/30">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium text-destructive">İptal Sebebi</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.cancelledReason}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Sipariş notu */}
            {order.notes && (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm font-medium">Sipariş Notu</p>
                  <p className="text-sm text-muted-foreground mt-1">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sağ: Durum + Adres + Fiyat */}
          <div className="space-y-4">
            {/* Durum zaman çizelgesi */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Sipariş Durumu</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderStatusTimeline
                  currentStatus={order.status}
                  createdAt={order.createdAt}
                  shippedAt={order.shippedAt}
                  deliveredAt={order.deliveredAt}
                  cancelledAt={order.cancelledAt}
                />
              </CardContent>
            </Card>

            {/* Teslimat Adresi */}
            {shippingAddr && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4" aria-hidden />
                    Teslimat Adresi
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  {shippingAddr.companyName && (
                    <p className="font-medium">{shippingAddr.companyName}</p>
                  )}
                  {shippingAddr.contactName && (
                    <p className="text-muted-foreground">{shippingAddr.contactName}</p>
                  )}
                  {shippingAddr.phone && (
                    <p className="text-muted-foreground">{shippingAddr.phone}</p>
                  )}
                  {shippingAddr.address && (
                    <p className="text-muted-foreground">{shippingAddr.address}</p>
                  )}
                  <p className="text-muted-foreground">
                    {[shippingAddr.district, shippingAddr.city, shippingAddr.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Fiyat Özeti */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Fiyat Özeti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <OrderSummary
                  subtotal={order.subtotal}
                  vatTotal={order.vatTotal}
                  discountTotal={order.discountTotal}
                  shippingTotal={order.shippingTotal}
                  grandTotal={order.grandTotal}
                />
                <Separator />
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ödeme Yöntemi</span>
                    <span>{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ödeme Durumu</span>
                    <span>
                      {order.paymentStatus === "PAID"
                        ? "Ödendi"
                        : order.paymentStatus === "PARTIAL"
                          ? "Kısmi Ödendi"
                          : "Bekliyor"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {cancelError && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {cancelError}
        </p>
      )}

      <CancelModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onConfirm={handleCancel}
        isLoading={isCancelling}
      />
    </>
  )
}
