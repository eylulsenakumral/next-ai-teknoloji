"use client"

import { useState } from "react"
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Package,
  Activity,
  Zap,
  ZapOff,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupplierData {
  id: string
  code: string
  name: string
  isActive: boolean
  scraperType: string
  syncStatus: string
  syncError: string | null
  syncIntervalMinutes: number
  lastSyncAt: string | null
  productCount: number
  lastLog: {
    status: string
    productsFound: number
    productsNew: number
    productsUpdated: number
    errorsCount: number
    durationMs: number | null
    startedAt: string
  } | null
}

interface SyncResult {
  success: boolean
  error?: string
  data?: {
    data?: {
      productsFound?: number
      imported?: { total?: number }
      synced?: number
    }
  }
}

// ─── Yardımcı ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "Hiç çalışmadı"
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return "Az önce"
  if (diffMin < 60) return `${diffMin} dk önce`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} saat önce`
  const diffD = Math.floor(diffH / 24)
  return `${diffD} gün önce`
}

function statusMeta(status: string): {
  label: string
  color: string
  bg: string
  borderColor: string
  icon: React.ElementType
} {
  switch (status) {
    case "SUCCESS":
      return {
        label: "Başarılı",
        color: "text-emerald-600",
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        borderColor: "border-emerald-200 dark:border-emerald-800",
        icon: CheckCircle2,
      }
    case "RUNNING":
      return {
        label: "Çalışıyor",
        color: "text-blue-600",
        bg: "bg-blue-50 dark:bg-blue-950/30",
        borderColor: "border-blue-200 dark:border-blue-800",
        icon: RefreshCw,
      }
    case "PARTIAL":
      return {
        label: "Kısmi",
        color: "text-orange-500",
        bg: "bg-orange-50 dark:bg-orange-950/30",
        borderColor: "border-orange-200 dark:border-orange-800",
        icon: AlertCircle,
      }
    case "ERROR":
      return {
        label: "Hata",
        color: "text-destructive",
        bg: "bg-destructive/10",
        borderColor: "border-destructive/30",
        icon: XCircle,
      }
    default:
      return {
        label: "Bekliyor",
        color: "text-muted-foreground",
        bg: "bg-muted",
        borderColor: "border-border",
        icon: Clock,
      }
  }
}

function scraperTypeLabel(type: string): string {
  switch (type) {
    case "PLAYWRIGHT":
      return "Playwright"
    case "API":
      return "API"
    case "MANUAL":
      return "Manuel"
    default:
      return type
  }
}

// ─── Entegrasyon Kartı ────────────────────────────────────────────────────────

interface SupplierCardProps {
  supplier: SupplierData
  syncing: boolean
  lastSyncResult: SyncResult | null
  onSync: () => void
  onToggleActive: () => void
  togglingActive: boolean
}

function SupplierCard({
  supplier,
  syncing,
  lastSyncResult,
  onSync,
  onToggleActive,
  togglingActive,
}: SupplierCardProps) {
  const meta = statusMeta(supplier.syncStatus)
  const StatusIcon = meta.icon

  const durationStr = supplier.lastLog?.durationMs
    ? supplier.lastLog.durationMs < 60_000
      ? `${(supplier.lastLog.durationMs / 1000).toFixed(1)}s`
      : `${Math.floor(supplier.lastLog.durationMs / 60_000)}dk`
    : null

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        !supplier.isActive && "opacity-60",
        supplier.syncStatus === "ERROR" && "border-destructive/40"
      )}
    >
      {/* Renk çizgisi — status rengi */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-0.5",
          supplier.syncStatus === "SUCCESS" && "bg-emerald-500",
          supplier.syncStatus === "RUNNING" && "bg-blue-500",
          supplier.syncStatus === "PARTIAL" && "bg-orange-400",
          supplier.syncStatus === "ERROR" && "bg-destructive",
          supplier.syncStatus === "IDLE" && "bg-border"
        )}
        aria-hidden
      />

      <CardHeader className="pb-3 pt-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <div>
              <CardTitle className="text-base leading-tight">{supplier.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5 flex items-center gap-1.5">
                <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                  {supplier.code}
                </code>
                <span>{scraperTypeLabel(supplier.scraperType)}</span>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Aktif/Pasif badge */}
            <Badge
              variant={supplier.isActive ? "default" : "secondary"}
              className="text-xs h-5 px-1.5 cursor-pointer"
              onClick={onToggleActive}
              aria-label={supplier.isActive ? "Pasif yap" : "Aktif yap"}
              title={supplier.isActive ? "Tıkla: pasif yap" : "Tıkla: aktif yap"}
            >
              {togglingActive ? (
                <RefreshCw className="h-2.5 w-2.5 animate-spin" />
              ) : supplier.isActive ? (
                <>
                  <Zap className="h-2.5 w-2.5 mr-0.5" />
                  Aktif
                </>
              ) : (
                <>
                  <ZapOff className="h-2.5 w-2.5 mr-0.5" />
                  Pasif
                </>
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-4">
        {/* Durum + son sync */}
        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
              meta.bg,
              meta.color
            )}
          >
            <StatusIcon
              className={cn("h-3 w-3", supplier.syncStatus === "RUNNING" && "animate-spin")}
              aria-hidden
            />
            {meta.label}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0" aria-hidden />
            {relativeTime(supplier.lastSyncAt)}
          </span>
        </div>

        {/* Hata mesajı */}
        {supplier.syncStatus === "ERROR" && supplier.syncError && (
          <div className="flex items-start gap-1.5 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
            <Info className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" aria-hidden />
            <p className="text-xs text-destructive leading-relaxed line-clamp-2">
              {supplier.syncError}
            </p>
          </div>
        )}

        {/* Son sync sonuçları */}
        {supplier.lastLog && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-muted/50 p-2">
              <p className="text-lg font-bold leading-none">
                {supplier.lastLog.productsFound.toLocaleString("tr")}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Bulunan</p>
            </div>
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2">
              <p className="text-lg font-bold leading-none text-emerald-600">
                +{supplier.lastLog.productsNew.toLocaleString("tr")}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Yeni</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2">
              <p className="text-lg font-bold leading-none">
                {supplier.lastLog.productsUpdated.toLocaleString("tr")}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Güncellenen</p>
            </div>
          </div>
        )}

        {/* Ürün sayısı + sync aralığı */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" aria-hidden />
            {supplier.productCount.toLocaleString("tr")} ürün
          </span>
          {durationStr && (
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" aria-hidden />
              {durationStr}
            </span>
          )}
          <span>
            Her {supplier.syncIntervalMinutes >= 60
              ? `${supplier.syncIntervalMinutes / 60}sa`
              : `${supplier.syncIntervalMinutes}dk`}
          </span>
        </div>

        {/* Son sync sonuç bildirimi (son tetiklemeden) */}
        {lastSyncResult && (
          <div
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg text-xs font-medium",
              lastSyncResult.success
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {lastSyncResult.success ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Senkronizasyon tamamlandı
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {lastSyncResult.error ?? "Hata oluştu"}
              </>
            )}
          </div>
        )}

        {/* Sync Butonu */}
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-1.5"
          disabled={syncing || !supplier.isActive || supplier.syncStatus === "RUNNING"}
          onClick={onSync}
          aria-label={`${supplier.name} senkronize et`}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} aria-hidden />
          {syncing ? "Senkronize ediliyor..." : "Şimdi Senkronize Et"}
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Ana Client Component ─────────────────────────────────────────────────────

interface EntegrasyonlarClientProps {
  suppliers: SupplierData[]
}

export function EntegrasyonlarClient({ suppliers: initialSuppliers }: EntegrasyonlarClientProps) {
  const [suppliers, setSuppliers] = useState<SupplierData[]>(initialSuppliers)
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set())
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())
  const [syncResults, setSyncResults] = useState<Record<string, SyncResult>>({})

  async function handleSync(supplier: SupplierData) {
    if (syncingIds.has(supplier.id)) return

    setSyncingIds((prev) => new Set(prev).add(supplier.id))
    // Önceki sonucu temizle
    setSyncResults((prev) => {
      const next = { ...prev }
      delete next[supplier.id]
      return next
    })

    try {
      const res = await fetch("/api/admin/integrations/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierCode: supplier.code }),
      })
      const data = (await res.json()) as SyncResult

      setSyncResults((prev) => ({ ...prev, [supplier.id]: data }))

      // Başarılı ise supplier verisini güncelle (optimistik)
      if (data.success) {
        setSuppliers((prev) =>
          prev.map((s) =>
            s.id === supplier.id
              ? {
                  ...s,
                  syncStatus: "SUCCESS",
                  lastSyncAt: new Date().toISOString(),
                  syncError: null,
                }
              : s
          )
        )
      } else {
        setSuppliers((prev) =>
          prev.map((s) =>
            s.id === supplier.id
              ? { ...s, syncStatus: "ERROR", syncError: data.error ?? "Bilinmeyen hata" }
              : s
          )
        )
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bağlantı hatası"
      setSyncResults((prev) => ({
        ...prev,
        [supplier.id]: { success: false, error: message },
      }))
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev)
        next.delete(supplier.id)
        return next
      })
    }
  }

  async function handleToggleActive(supplier: SupplierData) {
    if (togglingIds.has(supplier.id)) return

    setTogglingIds((prev) => new Set(prev).add(supplier.id))

    // Optimistik UI
    const newIsActive = !supplier.isActive
    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplier.id ? { ...s, isActive: newIsActive } : s))
    )

    try {
      const res = await fetch("/api/admin/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: supplier.id,
          supplierData: { isActive: newIsActive },
        }),
      })

      if (!res.ok) {
        // Geri al
        setSuppliers((prev) =>
          prev.map((s) => (s.id === supplier.id ? { ...s, isActive: !newIsActive } : s))
        )
      }
    } catch {
      // Geri al
      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplier.id ? { ...s, isActive: !newIsActive } : s))
      )
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(supplier.id)
        return next
      })
    }
  }

  if (suppliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-2 rounded-xl border border-dashed border-border">
        <Package className="h-10 w-10 text-muted-foreground/40" aria-hidden />
        <p className="text-sm text-muted-foreground">Henüz hiç tedarikçi tanımlı değil.</p>
      </div>
    )
  }

  return (
    <section aria-label="Tedarikçi entegrasyonları">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Tedarikçiler
        </h2>
        <span className="text-xs text-muted-foreground">
          {suppliers.filter((s) => s.isActive).length} aktif / {suppliers.length} toplam
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {suppliers.map((supplier) => (
          <SupplierCard
            key={supplier.id}
            supplier={supplier}
            syncing={syncingIds.has(supplier.id)}
            lastSyncResult={syncResults[supplier.id] ?? null}
            onSync={() => handleSync(supplier)}
            onToggleActive={() => handleToggleActive(supplier)}
            togglingActive={togglingIds.has(supplier.id)}
          />
        ))}
      </div>
    </section>
  )
}
