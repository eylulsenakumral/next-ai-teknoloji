export const dynamic = 'force-dynamic'

import { Suspense } from "react"
import {
  Package,
  Users,
  ShoppingBag,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  InboxIcon,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { withCache, CacheKey, TTL } from "@/lib/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import type { SupplierSyncStatus } from "@prisma/client"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfMonth(): Date {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

function scraperStatusLabel(status: SupplierSyncStatus): "ok" | "warning" | "error" {
  if (status === "SUCCESS") return "ok"
  if (status === "PARTIAL" || status === "RUNNING" || status === "IDLE") return "warning"
  return "error"
}

function relativeTime(date: Date | null): string {
  if (!date) return "Hiç çalışmadı"
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return "Az önce"
  if (diffMin < 60) return `${diffMin} dk önce`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} saat önce`
  const diffD = Math.floor(diffH / 24)
  return `${diffD} gün önce`
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  change: string
  icon: React.ElementType
  color: string
  bg: string
}

function StatCard({ label, value, change, icon: Icon, color, bg }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{change}</p>
          </div>
          <div className={`p-2.5 rounded-lg shrink-0 ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} aria-hidden />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Recent Orders Table ──────────────────────────────────────────────────────

interface RecentOrdersTableProps {
  orders: Array<{
    id: string
    orderNumber: string
    status: string
    grandTotal: { toString(): string }
    createdAt: Date
    customer: { companyName: string }
    orderItems: { id: string }[]
  }>
}

function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">Son Siparişler</CardTitle>
          <CardDescription>En son gelen 5 sipariş</CardDescription>
        </div>
        <Link
          href="/admin/siparisler"
          className="inline-flex items-center gap-1 text-xs h-7 px-2.5 rounded-lg font-medium text-sm hover:bg-muted hover:text-foreground transition-colors"
        >
          Tümünü Gör
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <InboxIcon className="h-8 w-8 text-muted-foreground/40" aria-hidden />
            <p className="text-sm text-muted-foreground">Henüz sipariş yok</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Bayi</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Ürün</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead className="text-right">Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-sm">
                      <Link
                        href={`/admin/siparisler/${order.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{order.customer.companyName}</TableCell>
                    <TableCell className="hidden md:table-cell text-right text-sm text-muted-foreground">
                      {order.orderItems.length}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm">
                      {formatCurrency(Number(order.grandTotal))}
                    </TableCell>
                    <TableCell className="text-right">
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Scraper Status Widget ────────────────────────────────────────────────────

interface ScraperItem {
  id: string
  name: string
  syncStatus: SupplierSyncStatus
  lastSyncAt: Date | null
  scraperLogs: Array<{ productsFound: number }>
}

function ScraperStatusWidget({ suppliers }: { suppliers: ScraperItem[] }) {
  const statusIcon = {
    ok: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    warning: <AlertCircle className="h-4 w-4 text-orange-500" />,
    error: <XCircle className="h-4 w-4 text-destructive" />,
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">Scraper Durumu</CardTitle>
          <CardDescription>Tedarikçi senkronizasyonu</CardDescription>
        </div>
        <Link
          href="/admin/entegrasyonlar"
          aria-label="Entegrasyonlara git"
          className="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
            <InboxIcon className="h-7 w-7 text-muted-foreground/40" aria-hidden />
            <p className="text-sm text-muted-foreground">Aktif tedarikçi yok</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suppliers.map((s) => {
              const statusKey = scraperStatusLabel(s.syncStatus)
              const productCount = s.scraperLogs[0]?.productsFound ?? 0
              return (
                <div key={s.id} className="flex items-center gap-3">
                  {statusIcon[statusKey]}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {relativeTime(s.lastSyncAt)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {productCount.toLocaleString("tr")} ürün
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Pending Applications Widget ─────────────────────────────────────────────

interface PendingApp {
  id: string
  companyName: string
  city: string | null
  createdAt: Date
}

function PendingApplicationsWidget({
  applications,
  totalCount,
}: {
  applications: PendingApp[]
  totalCount: number
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">Bekleyen Başvurular</CardTitle>
          <CardDescription>
            {totalCount === 0
              ? "İnceleme bekleyen başvuru yok"
              : `${totalCount} başvuru inceleme bekliyor`}
          </CardDescription>
        </div>
        <Link
          href="/admin/basvurular"
          className="inline-flex items-center gap-1 text-xs h-7 px-2.5 rounded-lg font-medium text-sm hover:bg-muted hover:text-foreground transition-colors"
        >
          Tümünü Gör
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
            <CheckCircle2 className="h-7 w-7 text-emerald-500/60" aria-hidden />
            <p className="text-sm text-muted-foreground">Bekleyen başvuru yok</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {app.companyName[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{app.companyName}</p>
                  <p className="text-xs text-muted-foreground">{app.city ?? "Bilinmiyor"}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(app.createdAt)}
                  </span>
                  <Link
                    href={`/admin/basvurular/${app.id}`}
                    className="inline-flex items-center justify-center h-6 px-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
                  >
                    İncele
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Page (Server Component) ──────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user.role !== "admin" && session.user.role !== "super_admin")) {
    redirect("/login")
  }

  const today = startOfToday()
  const month = startOfMonth()

  // Summary counts are cached for 2 minutes. Recent orders and scraper status
  // are real-time (no cache) because they change frequently.
  const [cachedStats, recentOrders, pendingApplicationsData, suppliers] = await Promise.all([
    withCache(CacheKey.dashboardStats(), TTL.DASHBOARD_STATS, async () => {
      const [productCount, customerCount, todayOrderCount, monthlyRevenue] = await Promise.all([
        prisma.product.count({ where: { deletedAt: null, isActive: true } }),
        prisma.customer.count({ where: { deletedAt: null, status: "APPROVED" } }),
        prisma.order.count({ where: { deletedAt: null, createdAt: { gte: today } } }),
        prisma.order.aggregate({
          where: { deletedAt: null, createdAt: { gte: month } },
          _sum: { grandTotal: true },
        }),
      ])
      return {
        productCount,
        customerCount,
        todayOrderCount,
        monthlyRevenue: Number(monthlyRevenue._sum.grandTotal ?? 0),
      }
    }),
    prisma.order.findMany({
      where: { deletedAt: null },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { companyName: true } },
        orderItems: { select: { id: true } },
      },
    }),
    // Son 3 başvuruyu + toplam sayıyı birlikte al (parallel read — transaction gerekmez,
    // Neon pooler'da $transaction başlatma zaman aşımına takılıyordu: P2028)
    Promise.all([
      prisma.dealerApplication.findMany({
        where: { status: "PENDING" },
        take: 3,
        orderBy: { createdAt: "desc" },
        select: { id: true, companyName: true, city: true, createdAt: true },
      }),
      prisma.dealerApplication.count({ where: { status: "PENDING" } }),
    ]),
    prisma.supplier.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { priority: "desc" },
      include: {
        scraperLogs: {
          take: 1,
          orderBy: { startedAt: "desc" },
          select: { productsFound: true },
        },
      },
    }),
  ])

  const { productCount, customerCount, todayOrderCount, monthlyRevenue } = cachedStats

  const [pendingApps, pendingCount] = pendingApplicationsData
  const monthlyTotal = monthlyRevenue

  const stats: StatCardProps[] = [
    {
      label: "Toplam Ürün",
      value: productCount.toLocaleString("tr"),
      change: "Aktif ürün sayısı",
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Aktif Bayi",
      value: customerCount.toLocaleString("tr"),
      change: "Onaylı bayi hesabı",
      icon: Users,
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-950/30",
    },
    {
      label: "Bugünkü Sipariş",
      value: todayOrderCount.toLocaleString("tr"),
      change: "Bugün oluşturulan",
      icon: ShoppingBag,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950/30",
    },
    {
      label: "Aylık Ciro",
      value: formatCurrency(monthlyTotal),
      change: "Bu ay toplam",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Sistemin genel durumuna hoş geldiniz.
        </p>
      </div>

      {/* İstatistikler */}
      <section aria-label="Özet istatistikler">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      {/* Siparişler + Yan Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
            <RecentOrdersTable orders={recentOrders} />
          </Suspense>
        </div>
        <div className="space-y-6">
          <Suspense fallback={<Skeleton className="h-48 rounded-xl" />}>
            <ScraperStatusWidget suppliers={suppliers} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-48 rounded-xl" />}>
            <PendingApplicationsWidget
              applications={pendingApps}
              totalCount={pendingCount}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
