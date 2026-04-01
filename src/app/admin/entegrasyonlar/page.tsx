import type { Metadata } from "next"
import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Package,
  Activity,
  Zap,
  TrendingUp,
} from "lucide-react"
import type { SupplierSyncStatus } from "@prisma/client"
import { EntegrasyonlarClient } from "./entegrasyonlar-client"

export const metadata: Metadata = {
  title: "Entegrasyonlar",
}

// ─── Yardımcı ────────────────────────────────────────────────────────────────

function relativeTime(date: Date | null | undefined): string {
  if (!date) return "Hiç çalışmadı"
  const diffMs = Date.now() - new Date(date).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return "Az önce"
  if (diffMin < 60) return `${diffMin} dk önce`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} saat önce`
  const diffD = Math.floor(diffH / 24)
  return `${diffD} gün önce`
}

function syncStatusMeta(status: SupplierSyncStatus): {
  label: string
  color: string
  bg: string
  icon: React.ElementType
} {
  switch (status) {
    case "SUCCESS":
      return {
        label: "Başarılı",
        color: "text-emerald-600",
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        icon: CheckCircle2,
      }
    case "RUNNING":
      return {
        label: "Çalışıyor",
        color: "text-blue-600",
        bg: "bg-blue-50 dark:bg-blue-950/30",
        icon: RefreshCw,
      }
    case "PARTIAL":
      return {
        label: "Kısmi",
        color: "text-orange-500",
        bg: "bg-orange-50 dark:bg-orange-950/30",
        icon: AlertCircle,
      }
    case "ERROR":
      return {
        label: "Hata",
        color: "text-destructive",
        bg: "bg-destructive/10",
        icon: XCircle,
      }
    default:
      return {
        label: "Bekliyor",
        color: "text-muted-foreground",
        bg: "bg-muted",
        icon: Clock,
      }
  }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  description: string
  icon: React.ElementType
  color: string
  bg: string
}

function StatCard({ label, value, description, icon: Icon, color, bg }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className={`p-2.5 rounded-lg shrink-0 ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} aria-hidden />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Sync Log Tablosu ─────────────────────────────────────────────────────────

interface LogRow {
  id: string
  supplierName: string
  startedAt: Date
  finishedAt: Date | null
  status: SupplierSyncStatus
  productsFound: number
  productsNew: number
  productsUpdated: number
  errorsCount: number
  durationMs: number | null
}

function SyncLogTable({ logs }: { logs: LogRow[] }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
        <Activity className="h-8 w-8 text-muted-foreground/40" aria-hidden />
        <p className="text-sm text-muted-foreground">Henüz sync işlemi gerçekleşmedi.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tedarikçi</TableHead>
          <TableHead>Başlangıç</TableHead>
          <TableHead className="hidden md:table-cell">Süre</TableHead>
          <TableHead className="text-right hidden sm:table-cell">Bulunan</TableHead>
          <TableHead className="text-right hidden sm:table-cell">Yeni</TableHead>
          <TableHead className="text-right hidden md:table-cell">Güncellenen</TableHead>
          <TableHead className="text-right hidden lg:table-cell">Hata</TableHead>
          <TableHead className="text-right">Durum</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => {
          const meta = syncStatusMeta(log.status)
          const StatusIcon = meta.icon
          const durationStr = log.durationMs
            ? log.durationMs < 60_000
              ? `${(log.durationMs / 1000).toFixed(1)}s`
              : `${Math.floor(log.durationMs / 60_000)}dk`
            : "—"

          return (
            <TableRow key={log.id}>
              <TableCell className="font-medium text-sm">{log.supplierName}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {relativeTime(log.startedAt)}
              </TableCell>
              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                {durationStr}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-right text-sm">
                {log.productsFound.toLocaleString("tr")}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-right text-sm text-emerald-600 font-medium">
                +{log.productsNew.toLocaleString("tr")}
              </TableCell>
              <TableCell className="hidden md:table-cell text-right text-sm">
                {log.productsUpdated.toLocaleString("tr")}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-right text-sm">
                {log.errorsCount > 0 ? (
                  <span className="text-destructive font-medium">
                    {log.errorsCount}
                  </span>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}
                >
                  <StatusIcon className="h-3 w-3" aria-hidden />
                  {meta.label}
                </span>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

// ─── Page (Server Component) ──────────────────────────────────────────────────

export default async function EntegrasyonlarPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user.role !== "admin" && session.user.role !== "super_admin")) {
    redirect("/login")
  }

  // Tüm tedarikçileri + son logları + ürün sayısını çek
  const suppliers = await prisma.supplier.findMany({
    where: { deletedAt: null },
    orderBy: [{ priority: "desc" }, { name: "asc" }],
    include: {
      scraperLogs: {
        take: 5,
        orderBy: { startedAt: "desc" },
        select: {
          id: true,
          startedAt: true,
          finishedAt: true,
          status: true,
          productsFound: true,
          productsUpdated: true,
          productsNew: true,
          productsRemoved: true,
          errorsCount: true,
          errorMessage: true,
          durationMs: true,
        },
      },
      _count: {
        select: { supplierProducts: { where: { deletedAt: null } } },
      },
    },
  })

  // Son 20 log (tüm tedarikçilerden)
  const recentLogs = await prisma.scraperLog.findMany({
    take: 20,
    orderBy: { startedAt: "desc" },
    include: {
      supplier: { select: { name: true } },
    },
  })

  // İstatistikler
  const activeCount = suppliers.filter((s) => s.isActive).length
  const totalProducts = suppliers.reduce((sum, s) => sum + s._count.supplierProducts, 0)
  const errorCount = suppliers.filter((s) => s.syncStatus === "ERROR").length
  const successCount = suppliers.filter((s) => s.syncStatus === "SUCCESS").length

  const stats: StatCardProps[] = [
    {
      label: "Aktif Entegrasyon",
      value: `${activeCount} / ${suppliers.length}`,
      description: "Toplam entegrasyon sayısı",
      icon: Zap,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Toplam Ürün",
      value: totalProducts.toLocaleString("tr"),
      description: "Tüm entegrasyonlardan",
      icon: Package,
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-950/30",
    },
    {
      label: "Başarılı Sync",
      value: successCount.toLocaleString("tr"),
      description: "Son durumu başarılı",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      label: "Hata",
      value: errorCount.toLocaleString("tr"),
      description: "Dikkat gerektiren",
      icon: XCircle,
      color: errorCount > 0 ? "text-destructive" : "text-muted-foreground",
      bg: errorCount > 0 ? "bg-destructive/10" : "bg-muted",
    },
  ]

  // Serileştirilebilir supplier verisi — Client Component'e geç
  const supplierData = suppliers.map((s) => ({
    id: s.id,
    code: s.code,
    name: s.name,
    isActive: s.isActive,
    scraperType: s.scraperType as string,
    syncStatus: s.syncStatus as string,
    syncError: s.syncError ?? null,
    syncIntervalMinutes: s.syncIntervalMinutes,
    lastSyncAt: s.lastSyncAt?.toISOString() ?? null,
    productCount: s._count.supplierProducts,
    lastLog: s.scraperLogs[0]
      ? {
          status: s.scraperLogs[0].status as string,
          productsFound: s.scraperLogs[0].productsFound,
          productsNew: s.scraperLogs[0].productsNew,
          productsUpdated: s.scraperLogs[0].productsUpdated,
          errorsCount: s.scraperLogs[0].errorsCount,
          durationMs: s.scraperLogs[0].durationMs ?? null,
          startedAt: s.scraperLogs[0].startedAt.toISOString(),
        }
      : null,
  }))

  const logData: LogRow[] = recentLogs.map((l) => ({
    id: l.id,
    supplierName: l.supplier.name,
    startedAt: l.startedAt,
    finishedAt: l.finishedAt,
    status: l.status,
    productsFound: l.productsFound,
    productsNew: l.productsNew,
    productsUpdated: l.productsUpdated,
    errorsCount: l.errorsCount,
    durationMs: l.durationMs,
  }))

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Entegrasyonlar</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Tedarikçi entegrasyonlarını yönetin ve senkronizasyonları tetikleyin.
        </p>
      </div>

      {/* İstatistikler */}
      <section aria-label="Entegrasyon istatistikleri">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      {/* Entegrasyon Kartları — Client Component (sync butonu interaktif) */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        }
      >
        <EntegrasyonlarClient suppliers={supplierData} />
      </Suspense>

      {/* Son Sync Geçmişi */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Son Senkronizasyon Geçmişi</CardTitle>
          <CardDescription>Son 20 sync işleminin özeti</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense fallback={<Skeleton className="h-48 m-4 rounded-xl" />}>
            <SyncLogTable logs={logData} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
