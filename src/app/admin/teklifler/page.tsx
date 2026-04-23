"use client"

import { useState, useEffect, useCallback, Fragment } from "react"
import Link from "next/link"
import {
  ChevronDown,
  RefreshCw,
  FileText,
  Search,
  Plus,
  Download,
  MessageCircle,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { QuoteStatusBadge } from "@/components/admin/quote-status-badge"
import { formatCurrency, formatDate } from "@/lib/utils/format"

// ---------------------------------------------------------------------------
// Tipler
// ---------------------------------------------------------------------------

interface Quote {
  id: string
  quoteNumber: string
  status: string
  subtotal: number
  discountTotal: number
  vatTotal: number
  grandTotal: number
  validUntil: string | null
  notes: string | null
  createdAt: string
  customer?: {
    id: string
    companyName: string
    dealerCode: string
    phone?: string | null
    email?: string | null
  }
  items: Array<{
    id: string
    productName: string
    quantity: number
    unitPrice: number
    discountAmount: number
    vatRate: number
    lineTotal: number
  }>
  convertedOrder?: { id: string; orderNumber: string } | null
}

interface QuoteListItem {
  id: string
  quoteNumber: string
  status: string
  grandTotal: number
  validUntil: string | null
  createdAt: string
  customer?: {
    id: string
    companyName: string
    dealerCode: string
  }
  items: { id: string }[]
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

type FilterStatus = "ALL" | "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CONVERTED"

const FILTER_TABS: { value: FilterStatus; label: string }[] = [
  { value: "ALL", label: "Tümü" },
  { value: "DRAFT", label: "Taslak" },
  { value: "SENT", label: "Gönderildi" },
  { value: "ACCEPTED", label: "Kabul" },
  { value: "REJECTED", label: "Red" },
  { value: "CONVERTED", label: "Sipariş" },
]

// ---------------------------------------------------------------------------
// Tablo iskelet
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md" />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Ana sayfa
// ---------------------------------------------------------------------------

export default function AdminQuotesPage() {
  const [mounted, setMounted] = useState(false)
  const [quotes, setQuotes] = useState<QuoteListItem[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [status, setStatus] = useState<FilterStatus>("ALL")
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailCache, setDetailCache] = useState<Record<string, Quote>>({})
  const [detailLoading, setDetailLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)

  const fetchQuotes = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(status !== "ALL" ? { status } : {}),
        ...(search ? { search } : {}),
      })
      const res = await fetch(`/api/admin/quotes?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Yüklenemedi")
      setQuotes(json.data)
      setMeta(json.meta)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Teklifler yüklenemedi.")
    } finally {
      setIsLoading(false)
    }
  }, [page, status, search])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetchQuotes()
  }, [fetchQuotes])

  function handleStatusChange(newStatus: string) {
    setStatus(newStatus as FilterStatus)
    setPage(1)
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  async function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    if (!detailCache[id]) {
      setDetailLoading(true)
      try {
        const res = await fetch(`/api/admin/quotes/${id}`)
        const json = await res.json()
        if (res.ok) {
          setDetailCache((prev) => ({ ...prev, [id]: json.data }))
        }
      } catch { /* ignore */ }
      setDetailLoading(false)
    }
  }

  async function handleDownloadPdf(quoteNumber: string, id: string) {
    setPdfLoading(id)
    try {
      const { downloadPdfFromHtml } = await import("@/lib/generate-pdf")
      await downloadPdfFromHtml(`/api/admin/quotes/${id}/pdf`, `${quoteNumber}.pdf`)
    } catch {
      alert("PDF oluşturulamadı.")
    } finally {
      setPdfLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Teklifler</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchQuotes}
            disabled={mounted && isLoading}
            aria-label="Yenile"
          >
            <RefreshCw
              className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`}
              aria-hidden
            />
            Yenile
          </Button>
          <Link href="/admin/teklifler/yeni">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" aria-hidden />
              Yeni Teklif
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Teklif no veya firma adı..."
              className="pl-9"
              aria-label="Teklif ara"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Ara
          </Button>
        </form>
      </div>

      <Tabs value={status} onValueChange={handleStatusChange}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {FILTER_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Hata */}
      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Tablo */}
      {isLoading ? (
        <TableSkeleton />
      ) : quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <FileText className="h-10 w-10 text-muted-foreground" aria-hidden />
          <p className="font-semibold">Teklif bulunamadı</p>
          <p className="text-sm text-muted-foreground">
            Henüz hiç teklif oluşturulmamış.
          </p>
          <Link href="/admin/teklifler/yeni">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" aria-hidden />
              İlk Teklifi Oluştur
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-8" />
                  <TableHead>Teklif No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead className="hidden sm:table-cell">Tarih</TableHead>
                  <TableHead className="hidden md:table-cell">Kalem</TableHead>
                  <TableHead className="hidden md:table-cell">Geçerlilik</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => {
                  const isExpanded = expandedId === quote.id
                  const detail = detailCache[quote.id]
                  return (
                    <Fragment key={quote.id}>
                      <TableRow
                        className={`hover:bg-muted/30 cursor-pointer ${isExpanded ? "bg-muted/20" : ""}`}
                        onClick={() => toggleExpand(quote.id)}
                      >
                        <TableCell>
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium">
                          {quote.quoteNumber}
                        </TableCell>
                        <TableCell>
                          {quote.customer ? (
                            <div>
                              <p className="text-sm font-medium line-clamp-1">
                                {quote.customer.companyName}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {quote.customer.dealerCode}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {formatDate(quote.createdAt)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {quote.items.length} ürün
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {quote.validUntil ? formatDate(quote.validUntil) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(Number(quote.grandTotal))}
                        </TableCell>
                        <TableCell>
                          <QuoteStatusBadge status={quote.status as "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CONVERTED"} />
                        </TableCell>
                      </TableRow>
                      {/* Genişletilmiş detay satırı */}
                      {isExpanded && (
                        <TableRow key={`${quote.id}-detail`}>
                          <TableCell colSpan={8} className="p-0">
                            <div className="bg-muted/10 border-t px-6 py-4 space-y-4">
                              {detailLoading && !detail ? (
                                <div className="flex justify-center py-6">
                                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                              ) : detail ? (
                                <>
                                  {/* Müşteri bilgileri */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                    {detail.customer?.phone && (
                                      <div>
                                        <p className="text-muted-foreground text-xs">Telefon</p>
                                        <p>{detail.customer.phone}</p>
                                      </div>
                                    )}
                                    {detail.customer?.email && (
                                      <div>
                                        <p className="text-muted-foreground text-xs">E-posta</p>
                                        <p>{detail.customer.email}</p>
                                      </div>
                                    )}
                                    {detail.validUntil && (
                                      <div>
                                        <p className="text-muted-foreground text-xs">Geçerlilik</p>
                                        <p>{formatDate(detail.validUntil)}</p>
                                      </div>
                                    )}
                                    {detail.notes && (
                                      <div className="col-span-2">
                                        <p className="text-muted-foreground text-xs">Not</p>
                                        <p className="whitespace-pre-wrap">{detail.notes}</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Ürün tablosu */}
                                  <div className="rounded-lg border overflow-x-auto">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-muted/30">
                                          <TableHead className="text-xs">Ürün</TableHead>
                                          <TableHead className="text-xs text-center w-16">Adet</TableHead>
                                          <TableHead className="text-xs text-right w-24">Birim</TableHead>
                                          <TableHead className="text-xs text-right w-20">İskonto</TableHead>
                                          <TableHead className="text-xs text-center w-14">KDV</TableHead>
                                          <TableHead className="text-xs text-right w-24">Tutar</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {detail.items.map((item) => (
                                          <TableRow key={item.id}>
                                            <TableCell className="text-sm">{item.productName}</TableCell>
                                            <TableCell className="text-center text-sm">{item.quantity}</TableCell>
                                            <TableCell className="text-right text-sm tabular-nums">{formatCurrency(Number(item.unitPrice))}</TableCell>
                                            <TableCell className="text-right text-sm tabular-nums">
                                              {Number(item.discountAmount) > 0 ? formatCurrency(Number(item.discountAmount)) : "—"}
                                            </TableCell>
                                            <TableCell className="text-center text-sm">{Number(item.vatRate)}%</TableCell>
                                            <TableCell className="text-right text-sm font-medium tabular-nums">{formatCurrency(Number(item.lineTotal))}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>

                                  {/* Toplamlar + Aksiyonlar */}
                                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                                    <div className="w-64 space-y-1 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Ara Toplam</span>
                                        <span className="tabular-nums">{formatCurrency(Number(detail.subtotal))}</span>
                                      </div>
                                      {Number(detail.discountTotal) > 0 && (
                                        <div className="flex justify-between text-destructive">
                                          <span>İskonto</span>
                                          <span className="tabular-nums">-{formatCurrency(Number(detail.discountTotal))}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">KDV</span>
                                        <span className="tabular-nums">{formatCurrency(Number(detail.vatTotal))}</span>
                                      </div>
                                      <div className="flex justify-between font-bold pt-1 border-t">
                                        <span>Genel Toplam</span>
                                        <span className="tabular-nums">{formatCurrency(Number(detail.grandTotal))}</span>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-end">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => { e.stopPropagation(); handleDownloadPdf(quote.quoteNumber, quote.id) }}
                                        disabled={pdfLoading === quote.id}
                                      >
                                        <Download className="h-4 w-4 mr-1.5" />
                                        {pdfLoading === quote.id ? "Oluşturuluyor..." : "PDF İndir"}
                                      </Button>
                                      <Link href={`/admin/teklifler/${quote.id}`} onClick={(e) => e.stopPropagation()}>
                                        <Button variant="outline" size="sm">
                                          <Eye className="h-4 w-4 mr-1.5" />
                                          Detay
                                        </Button>
                                      </Link>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center py-4 text-sm text-muted-foreground">
                                  Detay yüklenemedi.
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Sayfalama */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {meta.total} tekliften {(meta.page - 1) * meta.limit + 1}–
                {Math.min(meta.page * meta.limit, meta.total)} arası
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1 || (mounted && isLoading)}
                >
                  Önceki
                </Button>
                <span className="text-sm text-muted-foreground">
                  {meta.page} / {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= meta.totalPages || (mounted && isLoading)}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
