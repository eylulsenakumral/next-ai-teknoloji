"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  RefreshCw,
  FileText,
  Send,
  ShoppingCart,
  Trash2,
  Download,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { QuoteStatusBadge } from "@/components/admin/quote-status-badge"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import type { QuoteStatus } from "@prisma/client"

// ---------------------------------------------------------------------------
// Tipler
// ---------------------------------------------------------------------------

interface QuoteDetail {
  id: string
  quoteNumber: string
  status: QuoteStatus
  subtotal: number
  discountTotal: number
  vatTotal: number
  grandTotal: number
  currency: string
  validUntil: string | null
  notes: string | null
  internalNotes: string | null
  pdfUrl: string | null
  createdAt: string
  updatedAt: string
  convertedOrderId: string | null
  customer: {
    id: string
    companyName: string
    dealerCode: string
    phone?: string | null
    email?: string | null
    address?: string | null
    city?: string | null
  }
  items: Array<{
    id: string
    productName: string
    quantity: number
    unitPrice: number
    discountAmount: number
    vatRate: number
    lineTotal: number
    notes: string | null
    product?: { id: string; name: string; images?: string[] } | null
  }>
  convertedOrder?: { id: string; orderNumber: string } | null
}

// ---------------------------------------------------------------------------
// Ana sayfa
// ---------------------------------------------------------------------------

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [quote, setQuote] = useState<QuoteDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function fetchQuote() {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/quotes/${id}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Teklif yüklenemedi")
      setQuote(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Teklif yüklenemedi.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuote()
  }, [id])

  async function updateStatus(status: QuoteStatus) {
    setActionLoading(status)
    try {
      const res = await fetch(`/api/admin/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Durum güncellenemedi")
      }
      await fetchQuote()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Durum güncellenemedi.")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleConvert() {
    if (!confirm("Bu teklifi siparişe dönüştürmek istediğinize emin misiniz?")) return
    setActionLoading("convert")
    try {
      const res = await fetch(`/api/admin/quotes/${id}/convert`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Siparişe dönüştürülemedi")
      router.push(`/admin/siparisler/${json.data.orderId}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Siparişe dönüştürülemedi.")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete() {
    if (!confirm("Bu teklifi silmek istediğinize emin misiniz?")) return
    setActionLoading("delete")
    try {
      const res = await fetch(`/api/admin/quotes/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Silinemedi")
      }
      router.push("/admin/teklifler")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Silinemedi.")
      setActionLoading(null)
    }
  }

  async function handleGeneratePdf() {
    setActionLoading("pdf")
    try {
      const res = await fetch(`/api/admin/quotes/${id}/pdf`, { method: "POST" })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "PDF oluşturulamadı")
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${quote?.quoteNumber ?? "teklif"}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err instanceof Error ? err.message : "PDF oluşturulamadı.")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleSendWhatsApp() {
    setActionLoading("whatsapp")
    try {
      const res = await fetch(`/api/admin/quotes/${id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "whatsapp" }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Gönderilemedi")
      alert("Teklif WhatsApp ile gönderildi.")
      await fetchQuote()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gönderilemedi.")
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="space-y-4">
        <Link href="/admin/teklifler">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error ?? "Teklif bulunamadı."}
        </div>
      </div>
    )
  }

  const canEdit = quote.status === "DRAFT"
  const canSend = quote.status === "DRAFT"
  const canConvert = quote.status === "ACCEPTED" && !quote.convertedOrderId
  const canDelete = quote.status === "DRAFT"

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/teklifler">
            <Button variant="ghost" size="icon" aria-label="Geri">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{quote.quoteNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {formatDate(quote.createdAt)} oluşturuldu
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <QuoteStatusBadge status={quote.status} />
          <Button variant="outline" size="sm" onClick={fetchQuote} aria-label="Yenile">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Müşteri bilgisi */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Müşteri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Firma</p>
              <p className="font-medium">{quote.customer.companyName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Bayi Kodu</p>
              <p className="font-mono">{quote.customer.dealerCode}</p>
            </div>
            {quote.customer.phone && (
              <div>
                <p className="text-muted-foreground">Telefon</p>
                <p>{quote.customer.phone}</p>
              </div>
            )}
            {quote.customer.email && (
              <div>
                <p className="text-muted-foreground">E-posta</p>
                <p>{quote.customer.email}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ürünler */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Kalemler ({quote.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Ürün</TableHead>
                  <TableHead className="text-center">Miktar</TableHead>
                  <TableHead className="text-right">Birim Fiyat</TableHead>
                  <TableHead className="text-right">İskonto</TableHead>
                  <TableHead className="text-center">KDV %</TableHead>
                  <TableHead className="text-right">Satır Toplam</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm font-medium">{item.productName}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(Number(item.unitPrice))}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(item.discountAmount) > 0 ? formatCurrency(Number(item.discountAmount)) : "—"}
                    </TableCell>
                    <TableCell className="text-center">{Number(item.vatRate)}%</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(Number(item.lineTotal))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Toplamlar */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex justify-end">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ara Toplam</span>
                <span className="tabular-nums">{formatCurrency(Number(quote.subtotal))}</span>
              </div>
              {Number(quote.discountTotal) > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>İskonto</span>
                  <span className="tabular-nums">-{formatCurrency(Number(quote.discountTotal))}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">KDV</span>
                <span className="tabular-nums">{formatCurrency(Number(quote.vatTotal))}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>Genel Toplam</span>
                <span className="tabular-nums">{formatCurrency(Number(quote.grandTotal))}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notlar */}
      {(quote.notes || quote.internalNotes || quote.validUntil) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Detaylar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {quote.validUntil && (
              <div>
                <p className="text-muted-foreground">Geçerlilik Tarihi</p>
                <p>{formatDate(quote.validUntil)}</p>
              </div>
            )}
            {quote.notes && (
              <div>
                <p className="text-muted-foreground">Müşteri Notu</p>
                <p className="whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}
            {quote.internalNotes && (
              <div>
                <p className="text-muted-foreground">İç Not</p>
                <p className="whitespace-pre-wrap">{quote.internalNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dönüştürülen sipariş bilgisi */}
      {quote.convertedOrder && (
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-sm">
              <ShoppingCart className="h-4 w-4 text-violet-600" />
              <span>Bu teklif siparişe dönüştürüldü:</span>
              <Link
                href={`/admin/siparisler/${quote.convertedOrder.id}`}
                className="font-medium text-primary hover:underline"
              >
                {quote.convertedOrder.orderNumber}
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* İşlem butonları */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap gap-3">
            {canSend && (
              <Button
                onClick={() => updateStatus("SENT")}
                disabled={actionLoading !== null}
              >
                <Send className="h-4 w-4 mr-1.5" />
                Gönderildi Olarak İşaretle
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleGeneratePdf}
              disabled={actionLoading !== null}
            >
              <Download className="h-4 w-4 mr-1.5" />
              {actionLoading === "pdf" ? "Oluşturuluyor..." : "PDF İndir"}
            </Button>
            <Button
              variant="outline"
              onClick={handleSendWhatsApp}
              disabled={actionLoading !== null}
            >
              <MessageCircle className="h-4 w-4 mr-1.5" />
              {actionLoading === "whatsapp" ? "Gönderiliyor..." : "WhatsApp ile Gönder"}
            </Button>
            {quote.status === "SENT" && (
              <>
                <Button
                  variant="outline"
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => updateStatus("ACCEPTED")}
                  disabled={actionLoading !== null}
                >
                  Kabul Edildi
                </Button>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => updateStatus("REJECTED")}
                  disabled={actionLoading !== null}
                >
                  Reddedildi
                </Button>
              </>
            )}
            {canConvert && (
              <Button onClick={handleConvert} disabled={actionLoading !== null}>
                <ShoppingCart className="h-4 w-4 mr-1.5" />
                {actionLoading === "convert" ? "Dönüştürülüyor..." : "Siparişe Dönüştür"}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={actionLoading !== null}
                className="ml-auto"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Sil
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
