"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Eye,
  RefreshCw,
  ShoppingBag,
  Search,
  TrendingUp,
  Clock,
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
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import { formatCurrency, formatDate } from "@/lib/utils/format"

// ---------------------------------------------------------------------------
// Tipler
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
  customer?: {
    id: string
    companyName: string
    dealerCode: string
  }
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface Stats {
  count: number
  total: number
  pending: number
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

const PAYMENT_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Havale/EFT",
  ON_ACCOUNT: "Cari Hesap",
  CREDIT_CARD: "Kredi Kartı",
}

// ---------------------------------------------------------------------------
// İstatistik kartı
// ---------------------------------------------------------------------------

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string
  value: string
  icon: React.ElementType
  subtitle?: string
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" aria-hidden />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [status, setStatus] = useState<FilterStatus>("ALL")
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
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
        stats: "1",
        ...(status !== "ALL" ? { status } : {}),
        ...(search ? { search } : {}),
      })
      const res = await fetch(`/api/admin/orders?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Yüklenemedi")
      setOrders(json.data)
      setMeta(json.meta)
      if (json.stats) setStats(json.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Siparişler yüklenemedi.")
    } finally {
      setIsLoading(false)
    }
  }, [page, status, search])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  function handleStatusChange(newStatus: string) {
    setStatus(newStatus as FilterStatus)
    setPage(1)
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Siparişler</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          disabled={isLoading}
          aria-label="Yenile"
        >
          <RefreshCw
            className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`}
            aria-hidden
          />
          Yenile
        </Button>
      </div>

      {/* İstatistik kartları */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Bugünkü Sipariş"
            value={String(stats.count)}
            icon={ShoppingBag}
            subtitle="Bugün oluşturulan"
          />
          <StatCard
            title="Bugünkü Ciro"
            value={formatCurrency(stats.total)}
            icon={TrendingUp}
            subtitle="Bugün alınan tutar"
          />
          <StatCard
            title="Bekleyen Sipariş"
            value={String(stats.pending)}
            icon={Clock}
            subtitle="Tüm zamanlarda onay bekleyen"
          />
        </div>
      )}

      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Sipariş no, firma veya bayi kodu..."
              className="pl-9"
              aria-label="Sipariş ara"
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
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" aria-hidden />
          <p className="font-semibold">Sipariş bulunamadı</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Sipariş No</TableHead>
                  <TableHead>Bayi</TableHead>
                  <TableHead className="hidden sm:table-cell">Tarih</TableHead>
                  <TableHead className="hidden md:table-cell">Kalem</TableHead>
                  <TableHead className="hidden sm:table-cell">Ödeme</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-10" aria-label="İşlemler" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      {order.customer ? (
                        <div>
                          <p className="text-sm font-medium line-clamp-1">
                            {order.customer.companyName}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {order.customer.dealerCode}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {order.itemCount} ürün
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(order.grandTotal)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/siparisler/${order.id}`}
                        className="size-8 inline-flex items-center justify-center rounded-lg hover:bg-muted hover:text-foreground transition-colors"
                        aria-label={`${order.orderNumber} detayını gör`}
                      >
                        <Eye className="h-4 w-4" aria-hidden />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Sayfalama */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {meta.total} siparişten {(meta.page - 1) * meta.limit + 1}–
                {Math.min(meta.page * meta.limit, meta.total)} arası
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1 || isLoading}
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
                  disabled={page >= meta.totalPages || isLoading}
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
