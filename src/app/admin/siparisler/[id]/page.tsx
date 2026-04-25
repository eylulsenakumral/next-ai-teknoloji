"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  MapPin,
  Package,
  Truck,
  User,
  AlertTriangle,
  Loader2,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import { OrderStatusTimeline } from "@/components/orders/order-status-timeline"
import { OrderSummary } from "@/components/orders/order-summary"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { cn } from "@/lib/utils"

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
  purchasePrice: number | null
  profitMarginPct: number | null
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
  adminNotes: string | null
  paymentMethod: string
  paymentStatus: string
  shippingTrackingNumber: string | null
  shippingCarrier: string | null
  cancelledAt: string | null
  cancelledReason: string | null
  shippedAt: string | null
  deliveredAt: string | null
  createdAt: string
  customer: {
    id: string
    companyName: string
    dealerCode: string
    contactName: string | null
    phone: string | null
    email: string | null
    city: string | null
    taxNumber: string | null
  }
  items: OrderItem[]
  totalPurchaseCost?: number
  totalProfit?: number
  profitMarginPct?: number
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "PENDING", label: "Beklemede" },
  { value: "CONFIRMED", label: "Onaylandı" },
  { value: "PREPARING", label: "Hazırlanıyor" },
  { value: "SHIPPED", label: "Kargoya Verildi" },
  { value: "DELIVERED", label: "Teslim Edildi" },
  { value: "CANCELLED", label: "İptal Edildi" },
  { value: "RETURNED", label: "İade Edildi" },
]

const PAYMENT_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Havale / EFT",
  ON_ACCOUNT: "Açık Hesap (Cari)",
  CREDIT_CARD: "Kredi Kartı",
}

// ---------------------------------------------------------------------------
// Kar/Zarar satırı
// ---------------------------------------------------------------------------

function ProfitRow({ item }: { item: OrderItem }) {
  if (item.purchasePrice == null) return null
  const cost = item.purchasePrice * item.quantity
  const profit = item.lineSubtotal - cost

  return (
    <tr className="text-xs text-muted-foreground bg-muted/20">
      <td colSpan={3} className="px-3 pb-2 text-right">
        Alış: {formatCurrency(item.purchasePrice)} × {item.quantity} ={" "}
        {formatCurrency(cost)}
      </td>
      <td className="px-3 pb-2 text-right">
        <span className={cn("font-medium", profit >= 0 ? "text-green-600" : "text-red-600")}>
          {profit >= 0 ? "+" : ""}
          {formatCurrency(profit)}
        </span>
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Ana sayfa
// ---------------------------------------------------------------------------

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Durum güncelleme formu
  const [selectedStatus, setSelectedStatus] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [carrier, setCarrier] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/orders/${id}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? "Yüklenemedi")
        setOrder(json.data)
        setSelectedStatus(json.data.status)
        setAdminNotes(json.data.adminNotes ?? "")
        setTrackingNumber(json.data.shippingTrackingNumber ?? "")
        setCarrier(json.data.shippingCarrier ?? "")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sipariş yüklenemedi.")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setIsUpdating(true)
    setUpdateError(null)
    setUpdateSuccess(false)
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedStatus,
          adminNotes: adminNotes || undefined,
          shippingTrackingNumber: trackingNumber || undefined,
          shippingCarrier: carrier || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Güncellenemedi.")
      // Sipariş durumunu yenile
      const res2 = await fetch(`/api/admin/orders/${id}`)
      const json2 = await res2.json()
      if (res2.ok) {
        setOrder(json2.data)
        setSelectedStatus(json2.data.status)
      }
      setUpdateSuccess(true)
      setTimeout(() => setUpdateSuccess(false), 3000)
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Güncelleme başarısız.")
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-80" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-56" />
            <Skeleton className="h-40" />
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
        <Link
          href="/admin/siparisler"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground h-8 px-2.5 text-sm font-medium transition-colors"
        >
          Siparişlere Dön
        </Link>
      </div>
    )
  }

  const shippingAddr = order.shippingAddress

  // Toplam kar bilgisi
  const hasProfit =
    order.totalPurchaseCost !== undefined && order.totalProfit !== undefined

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/siparisler"
          className="size-8 inline-flex items-center justify-center rounded-lg hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Siparişlere dön"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold font-mono">{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: Kalemler + Kar + Durum Güncelle */}
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
                      <React.Fragment key={item.id}>
                        <tr>
                          <td className="py-3 pr-4">
                            <p className="font-medium leading-snug">
                              {item.productName}
                            </p>
                            {item.productBarcode && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Barkod: {item.productBarcode}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              KDV: %{item.vatRate}
                              {item.profitMarginPct != null && (
                                <span className="ml-2 text-green-600">
                                  Marj: %{Number(item.profitMarginPct).toFixed(1)}
                                </span>
                              )}
                            </p>
                          </td>
                          <td className="py-3 text-center tabular-nums">{item.quantity}</td>
                          <td className="py-3 text-right tabular-nums">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="py-3 text-right font-medium tabular-nums">
                            {formatCurrency(item.lineTotal)}
                          </td>
                        </tr>
                        <ProfitRow item={item} />
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Toplam kar */}
              {hasProfit && (
                <>
                  <Separator className="my-4" />
                  <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Toplam Maliyet</span>
                      <span className="tabular-nums">
                        {formatCurrency(order.totalPurchaseCost!)}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-600" aria-hidden />
                        Brüt Kar
                      </span>
                      <span
                        className={cn(
                          "tabular-nums",
                          order.totalProfit! >= 0 ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {order.totalProfit! >= 0 ? "+" : ""}
                        {formatCurrency(order.totalProfit!)}
                        {" "}
                        <span className="font-normal text-xs">
                          (%{Number(order.profitMarginPct ?? 0).toFixed(1)})
                        </span>
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Durum Güncelle */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sipariş Durumu Güncelle</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="order-status">Durum</Label>
                    <Select
                      value={selectedStatus}
                      onValueChange={(v) => v && setSelectedStatus(v)}
                    >
                      <SelectTrigger id="order-status">
                        <SelectValue placeholder="Durum seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Kargo bilgileri */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="carrier">Kargo Firması</Label>
                    <Input
                      id="carrier"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      placeholder="Ör: Yurtiçi Kargo"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tracking-number">Kargo Takip No</Label>
                    <Input
                      id="tracking-number"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Takip numarasını girin"
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admin-notes">Admin Notu</Label>
                  <Textarea
                    id="admin-notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="İç not (bayiye görünmez)..."
                    rows={3}
                    maxLength={2000}
                  />
                </div>

                {updateError && (
                  <p role="alert" className="text-sm text-destructive">
                    {updateError}
                  </p>
                )}
                {updateSuccess && (
                  <p role="status" className="text-sm text-green-600">
                    Sipariş başarıyla güncellendi.
                  </p>
                )}

                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden />
                      Güncelleniyor...
                    </>
                  ) : (
                    "Güncelle"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Kargo ve notlar */}
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

          {order.notes && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm font-medium">Bayi Notu</p>
                <p className="text-sm text-muted-foreground mt-1">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sağ: Müşteri + Adres + Durum + Fiyat */}
        <div className="space-y-4">
          {/* Müşteri Bilgileri */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" aria-hidden />
                Bayi Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>
                <p className="font-medium">{order.customer.companyName}</p>
                <p className="text-xs font-mono text-muted-foreground">
                  {order.customer.dealerCode}
                </p>
              </div>
              {order.customer.contactName && (
                <p className="text-muted-foreground">{order.customer.contactName}</p>
              )}
              {order.customer.phone && (
                <p className="text-muted-foreground">{order.customer.phone}</p>
              )}
              {order.customer.email && (
                <p className="text-muted-foreground">{order.customer.email}</p>
              )}
              {order.customer.city && (
                <p className="text-muted-foreground">{order.customer.city}</p>
              )}
              {order.customer.taxNumber && (
                <p className="text-muted-foreground">VKN: {order.customer.taxNumber}</p>
              )}
              <Link
                href={`/admin/musteriler/${order.customer.id}`}
                className="mt-2 w-full inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground h-7 px-2.5 text-[0.8rem] font-medium transition-colors"
              >
                Bayi Profiline Git
              </Link>
            </CardContent>
          </Card>

          {/* Durum Zaman Çizelgesi */}
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
              <div className="text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ödeme Yöntemi</span>
                  <span>{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
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

          {/* Kargo bilgisi (varsa) */}
          {(order.shippingTrackingNumber || order.shippingCarrier) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-4 w-4" aria-hidden />
                  Kargo
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1.5">
                {order.shippingCarrier && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-20">Firma:</span>
                    <span>{order.shippingCarrier}</span>
                  </div>
                )}
                {order.shippingTrackingNumber && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-20">Takip No:</span>
                    <span className="font-mono">{order.shippingTrackingNumber}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
